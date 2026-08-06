import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Corta los vínculos de acceso ANTES de anonimizar: si no, el Account de OAuth
  // (Google) sigue apuntando a este usuario ya inactivo y bloquea volver a entrar
  // o registrarse con el mismo Google. Al borrarlos, un futuro login con Google se
  // trata como cuenta NUEVA. También se borran las sesiones abiertas.
  await prisma.account.deleteMany({ where: { userId: session.user.id } })
  await prisma.session.deleteMany({ where: { userId: session.user.id } }).catch(() => {})

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      isActive: false,
      deletedAt: new Date(),
      sessionVersion: { increment: 1 },
      email: `${session.user.email || session.user.id}+deleted@guiazmg.local`,
      name: null,
      image: null,
      passwordHash: null,
    },
  })

  return NextResponse.json({ success: true })
}
