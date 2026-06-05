import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { enforceRateLimits, getClientIp } from "@/lib/security/request-rate-limit"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password || typeof password !== "string") {
      return NextResponse.json({ error: "Token y contraseña requeridos" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const ip = getClientIp(req)
    const rateLimitedByIp = await enforceRateLimits([
      { key: `auth:reset:ip:${ip}`, windowMs: 60_000, maxRequests: 5 },
    ])

    if (rateLimitedByIp) return rateLimitedByIp

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 })
    }

    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.json({ error: "Token expirado" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const rateLimitedByEmail = await enforceRateLimits([
      { key: `auth:reset:email:${user.email.toLowerCase()}`, windowMs: 60_000, maxRequests: 3 },
    ])

    if (rateLimitedByEmail) return rateLimitedByEmail

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    })

    await prisma.verificationToken.delete({ where: { token } })
    await prisma.verificationToken.deleteMany({ where: { identifier: verificationToken.identifier } })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al restablecer la contraseña" }, { status: 500 })
  }
}
