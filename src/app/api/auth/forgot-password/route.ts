import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import { enforceRateLimits, getClientIp } from "@/lib/security/request-rate-limit"
import { getPublicAppUrl } from "@/lib/env"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const ip = getClientIp(req)
    const rateLimited = await enforceRateLimits([
      { key: `auth:forgot:ip:${ip}`, windowMs: 60_000, maxRequests: 5 },
      { key: `auth:forgot:email:${email.toLowerCase()}`, windowMs: 60_000, maxRequests: 3 },
    ])

    if (rateLimited) return rateLimited

    const user = await prisma.user.findUnique({ where: { email } })

    // Por decisión de producto se informa explícitamente cuando el correo no
    // está registrado (mejor UX que el mensaje genérico). El rate-limit de
    // arriba (5/min IP, 3/min correo) acota el sondeo masivo de cuentas.
    if (!user) {
      return NextResponse.json(
        { error: "No hay ninguna cuenta registrada con ese correo." },
        { status: 404 },
      )
    }

    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: expiresAt,
      },
    })

    const resetUrl = `${getPublicAppUrl()}/auth/reset-password?token=${token}`
    await sendPasswordResetEmail(email, resetUrl, user.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
