export const dynamic = "force-dynamic"

import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPublicAppUrl } from "@/lib/env"
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email"
import { createVerificationToken } from "@/lib/auth/verification"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // ── Acciones de acceso (desbloquear a un usuario atorado) ──────────────────
    // RESET_ACCESS: activa + verifica la cuenta e invalida sesiones, y genera un
    // enlace de restablecimiento (24h) para que el dueño fije su propia contraseña.
    // Sirve aunque la cuenta nunca tuvo contraseña o quedó sin activar. Devuelve el
    // enlace para copiarlo (por si el buzón del usuario no funciona) y lo envía por
    // correo (best-effort).
    if (body.action === "RESET_ACCESS") {
      await prisma.user.update({
        where: { id },
        data: { emailVerified: new Date(), isActive: true, sessionVersion: { increment: 1 } },
      })
      await prisma.verificationToken.deleteMany({ where: { identifier: user.email } })
      const token = crypto.randomBytes(32).toString("hex")
      await prisma.verificationToken.create({
        data: { identifier: user.email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      })
      const resetUrl = `${getPublicAppUrl()}/auth/reset-password?token=${token}`
      const emailed = await sendPasswordResetEmail(user.email, resetUrl, user.id).catch(() => false)
      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "reset_user_access",
          entityType: "User",
          entityId: id,
          newValue: JSON.stringify({ email: user.email, emailed }),
        },
      }).catch(() => {})
      return NextResponse.json({ ok: true, resetUrl, emailed, email: user.email })
    }

    // RESEND_ACTIVATION: reenvía el enlace de activación (verificación de correo).
    // Para cuentas que solo necesitan verificar (la contraseña ya está bien).
    if (body.action === "RESEND_ACTIVATION") {
      const verifyUrl = await createVerificationToken(user.email)
      const emailed = await sendVerificationEmail(user.email, verifyUrl, user.name, user.id).catch(() => false)
      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "resend_activation",
          entityType: "User",
          entityId: id,
          newValue: JSON.stringify({ email: user.email, emailed }),
        },
      }).catch(() => {})
      return NextResponse.json({ ok: true, verifyUrl, emailed, email: user.email })
    }

    const updateData: Record<string, unknown> = {}

    if (body.role && ["USER", "BUSINESS_OWNER", "EDITOR", "SALES_AGENT", "ADMIN"].includes(body.role)) {
      updateData.role = body.role
    }

    if (typeof body.isActive === "boolean") {
      updateData.isActive = body.isActive
    }

    if (typeof body.name === "string" && body.name.trim().length >= 2) {
      updateData.name = body.name.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Sin cambios válidos" }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "update_user",
        entityType: "User",
        entityId: id,
        oldValue: JSON.stringify({ role: user.role, isActive: user.isActive }),
        newValue: JSON.stringify(updateData),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}
