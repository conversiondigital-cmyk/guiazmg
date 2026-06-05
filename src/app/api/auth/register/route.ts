import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { enforceRateLimits, getClientIp } from "@/lib/security/request-rate-limit"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(200),
  acceptedTermsAt: z.coerce.date(),
  acceptedPrivacyAt: z.coerce.date(),
  acceptedCommunityAt: z.coerce.date(),
})

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, acceptedTermsAt, acceptedPrivacyAt, acceptedCommunityAt } = registerSchema.parse(await request.json())

    const ip = getClientIp(request)
    const rateLimited = await enforceRateLimits([
      { key: `auth:register:ip:${ip}`, windowMs: 60_000, maxRequests: 5 },
      { key: `auth:register:email:${email}`, windowMs: 60_000, maxRequests: 3 },
    ])

    if (rateLimited) return rateLimited

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "El correo ya está registrado" },
        { status: 409 }
      )
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "USER",
        acceptedTermsAt: new Date(acceptedTermsAt),
        acceptedPrivacyAt: new Date(acceptedPrivacyAt),
        acceptedCommunityAt: new Date(acceptedCommunityAt),
      },
    })

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 })
  }
}
