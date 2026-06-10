export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
