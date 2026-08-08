import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Registra la aceptación de términos/privacidad/comunidad del usuario actual.
// Lo usa la pantalla de bienvenida del registro con Google (donde el usuario
// confirma sus datos y acepta), ya que ese flujo no captura los términos.
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const now = new Date()
  await prisma.user.update({
    where: { id: session.user.id },
    data: { acceptedTermsAt: now, acceptedPrivacyAt: now, acceptedCommunityAt: now },
  })
  return NextResponse.json({ ok: true })
}
