import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { userId, currentPassword, newPassword } = await request.json()

    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "No puedes cambiar la contraseña de cuentas de OAuth" }, { status: 400 })
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[USER_CHANGE_PASSWORD]", error)
    return NextResponse.json({ error: "Error al cambiar la contraseña" }, { status: 500 })
  }
}
