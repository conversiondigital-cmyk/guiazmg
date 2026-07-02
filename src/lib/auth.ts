import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import type { JWT } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { enforceRateLimits } from "@/lib/security/request-rate-limit"
import { getTrustedClientIp } from "@/lib/security/rate-limit"

type AuthToken = Omit<JWT, "id" | "role"> & {
  id?: string
  role?: string
  sessionVersion?: number
  lastCheck?: number
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
    error: "/auth/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = String(credentials.email).toLowerCase()
        const requestHeaders = await headers()
        const ip = getTrustedClientIp(new Request("http://localhost", { headers: requestHeaders }))

        const rateLimited = await enforceRateLimits([
          { key: `auth:login:ip:${ip}`, windowMs: 60_000, maxRequests: 10 },
          { key: `auth:login:email:${email}`, windowMs: 60_000, maxRequests: 5 },
        ])

        if (rateLimited) return null

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) return null
        if (!user.isActive) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
    // El proveedor de Google solo se registra cuando las credenciales están
    // configuradas (Vercel env). Así no aparece un login de Google roto antes
    // de ponerlas; en cuanto agregues AUTH_GOOGLE_ID/SECRET y redepliegues, se activa.
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { isActive: true, deletedAt: true },
        })
        if (dbUser && (!dbUser.isActive || dbUser.deletedAt)) return false
      }
      return true
    },
    async jwt({ token, user, account }) {
      const authToken = token as AuthToken
      let dbUser: any = null

      // OPTIMIZACIÓN: Cargar usuario una sola vez
      if (account || user) {
        const lookupEmail = (user?.email ?? authToken.email) as string | undefined
        const lookupId = (user && "id" in user ? user.id : authToken.id) as string | undefined
        dbUser = lookupId
          ? await prisma.user.findUnique({
              where: { id: lookupId },
              select: { id: true, role: true, isActive: true, deletedAt: true, sessionVersion: true },
            })
          : lookupEmail
            ? await prisma.user.findUnique({
                where: { email: lookupEmail },
                select: { id: true, role: true, isActive: true, deletedAt: true, sessionVersion: true },
              })
            : null

        if (!dbUser || !dbUser.isActive || dbUser.deletedAt) {
          delete authToken.id
          delete authToken.role
          delete authToken.sessionVersion
          return token
        }

        authToken.id = dbUser.id
        authToken.role = dbUser.role
        authToken.sessionVersion = dbUser.sessionVersion
      }

      // Tras el login (dbUser ya validado arriba): sella el timestamp y termina,
      // así NO re-consultamos la BD en cada request.
      if (dbUser) {
        authToken.role = dbUser.role
        authToken.lastCheck = Date.now()
        return token
      }

      // En requests posteriores, re-valida contra la BD como máximo cada 60s
      // (evita 1 consulta por cada request autenticado). Revoca usuarios
      // desactivados, borrados o con sessionVersion cambiada; la revocación tarda
      // a lo sumo esta ventana (60s) en vez de ser inmediata.
      const REVALIDATE_MS = 60_000
      const lastCheck = (authToken.lastCheck as number | undefined) ?? 0
      if (authToken.id && Date.now() - lastCheck > REVALIDATE_MS) {
        const fresh = await prisma.user.findUnique({
          where: { id: authToken.id },
          select: { role: true, isActive: true, deletedAt: true, sessionVersion: true },
        })
        if (!fresh || !fresh.isActive || fresh.deletedAt || fresh.sessionVersion !== authToken.sessionVersion) {
          delete authToken.id
          delete authToken.role
          delete authToken.sessionVersion
          return token
        }
        authToken.role = fresh.role
        authToken.lastCheck = Date.now()
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : ""
        if (typeof token.role === "string") {
          session.user.role = token.role
        } else {
          delete session.user.role
        }
      }
      return session
    },
  },
})
