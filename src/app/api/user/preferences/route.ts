import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { userId, preferences } = await request.json()

    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...preferences },
      update: preferences,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[USER_PREFERENCES]", error)
    return NextResponse.json({ error: "Error al guardar preferencias" }, { status: 500 })
  }
}
