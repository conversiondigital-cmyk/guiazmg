import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Cancelar registro: ELIMINA de verdad la cuenta recién creada si el usuario NO
// aceptó términos (dio "Cancelar" en la bienvenida del registro con Google). Solo
// borra cuentas SIN consentir; una cuenta ya consentida jamás se toca. Borra
// explícitamente el vínculo OAuth (Account) y sesiones antes del usuario para que
// nada bloquee el borrado.
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: true })
  const userId = session.user.id

  const u = await prisma.user.findUnique({ where: { id: userId }, select: { acceptedTermsAt: true } })
  if (!u) return NextResponse.json({ ok: true })
  if (u.acceptedTermsAt) {
    return NextResponse.json({ ok: false, error: "La cuenta ya aceptó términos." }, { status: 400 })
  }

  try {
    await prisma.$transaction([
      prisma.account.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ])
  } catch (e) {
    console.error("[ABANDON_REGISTRATION]", e instanceof Error ? e.message : e)
    // Respaldo: si alguna relación bloqueó el borrado duro, deja la cuenta
    // inutilizable (desactivada + borrada + sesiones revocadas).
    await prisma.user
      .update({
        where: { id: userId },
        data: { isActive: false, deletedAt: new Date(), sessionVersion: { increment: 1 } },
      })
      .catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
