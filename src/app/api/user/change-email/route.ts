export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { createEmailChangeToken } from "@/lib/auth/email-change"
import { enforceRateLimits } from "@/lib/security/request-rate-limit"
import { getTrustedClientIp } from "@/lib/security/rate-limit"

const schema = z.object({ email: z.string().trim().email("Correo inválido").max(160) })

// Solicita cambiar el correo de la cuenta. NO cambia nada aún: manda un enlace de
// confirmación al correo NUEVO (solo al abrirlo se aplica) y un aviso de seguridad
// al correo anterior. Requiere sesión y está rate-limitado.
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 })
    }

    const ip = getTrustedClientIp(req)
    const limited = await enforceRateLimits([
      { key: `email:change:user:${session.user.id}`, windowMs: 60_000, maxRequests: 3 },
      { key: `email:change:ip:${ip}`, windowMs: 60_000, maxRequests: 6 },
    ])
    if (limited) {
      return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 })
    }

    const parsed = schema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Correo inválido" }, { status: 400 })
    }
    const newEmail = parsed.data.email.toLowerCase()

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    })
    if (!me) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 })

    if (me.email && me.email.toLowerCase() === newEmail) {
      return NextResponse.json({ error: "Ese ya es tu correo actual." }, { status: 400 })
    }

    // Unicidad: que ningún otro usuario tenga ese correo.
    const taken = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } })
    if (taken && taken.id !== session.user.id) {
      return NextResponse.json({ error: "Ese correo ya está en uso por otra cuenta." }, { status: 409 })
    }

    const verifyUrl = await createEmailChangeToken(session.user.id, newEmail)

    // Confirmación al correo NUEVO (el cambio se aplica al abrir este enlace).
    await sendEmail(newEmail, "verify_email_change", { verifyUrl })
    // Aviso de seguridad al correo ANTERIOR (si tiene uno).
    if (me.email) {
      await sendEmail(me.email, "email_change_alert", { newEmail }, session.user.id)
    }

    return NextResponse.json({
      success: true,
      message: `Te enviamos un enlace a ${newEmail}. Ábrelo para confirmar el cambio.`,
    })
  } catch (error) {
    console.error("[EMAIL_CHANGE_REQUEST]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "No se pudo procesar la solicitud" }, { status: 500 })
  }
}
