import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Cancelar registro: elimina la cuenta recién creada si el usuario NO aceptó
// términos (dio "Cancelar" en la bienvenida del registro con Google). Solo borra
// cuentas SIN consentir; una cuenta ya consentida jamás se toca. El borrado del
// usuario cascada su vínculo OAuth (Account) por el esquema del adapter.
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: true })
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { acceptedTermsAt: true },
  })
  if (u && !u.acceptedTermsAt) {
    await prisma.user.delete({ where: { id: session.user.id } }).catch(() => {
      // Si el borrado duro fallara por alguna relación, al menos la desactiva.
      return prisma.user
        .update({ where: { id: session.user!.id }, data: { isActive: false } })
        .catch(() => {})
    })
  }
  return NextResponse.json({ ok: true })
}
