import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createVerificationToken } from "@/lib/auth/verification"
import { sendVerificationEmail } from "@/lib/email"
import { enforceRateLimits, getClientIp } from "@/lib/security/request-rate-limit"

export const runtime = "nodejs"

// Reenvía el enlace de activación. Responde ok siempre (no revela si el correo
// existe o ya está verificado).
export async function POST(req: Request) {
  try {
    const { email } = (await req.json().catch(() => ({}))) as { email?: string }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }
    const normalized = email.toLowerCase()

    const ip = getClientIp(req)
    const rateLimited = await enforceRateLimits([
      { key: `auth:resend:ip:${ip}`, windowMs: 60_000, maxRequests: 5 },
      { key: `auth:resend:email:${normalized}`, windowMs: 60_000, maxRequests: 3 },
    ])
    if (rateLimited) return rateLimited

    const user = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, name: true, email: true, emailVerified: true, passwordHash: true },
    })

    // Solo reenvía a cuentas de correo/contraseña sin verificar.
    if (user && !user.emailVerified && user.passwordHash) {
      const verifyUrl = await createVerificationToken(user.email)
      await sendVerificationEmail(user.email, verifyUrl, user.name, user.id).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
