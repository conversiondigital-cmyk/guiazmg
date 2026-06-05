export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const definitions = await prisma.boostDefinition.findMany({
      orderBy: { price: "asc" },
    })

    return NextResponse.json({ definitions: JSON.parse(JSON.stringify(definitions)) })
  } catch (error) {
    console.error("Error fetching boost definitions:", error)
    return NextResponse.json({ error: "Error al obtener definiciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, durationDays, price, priorityBonus, isActive } = body

    if (!name || !durationDays || !price) {
      return NextResponse.json({ error: "Nombre, duración y costo requeridos" }, { status: 400 })
    }

    const definition = await prisma.boostDefinition.create({
      data: {
        name,
        durationDays: parseInt(durationDays),
        price: parseFloat(price),
        priorityBonus: priorityBonus ? parseInt(priorityBonus) : 0,
        isActive: isActive ?? true,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "create_boost_definition",
        entityType: "BoostDefinition",
        entityId: definition.id,
      },
    })

    return NextResponse.json({ definition })
  } catch (error) {
    console.error("Error creating boost definition:", error)
    return NextResponse.json({ error: "Error al crear definición" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.durationDays !== undefined) updateData.durationDays = parseInt(data.durationDays)
    if (data.price !== undefined) updateData.price = parseFloat(data.price)
    if (data.priorityBonus !== undefined) updateData.priorityBonus = parseInt(data.priorityBonus)
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const definition = await prisma.boostDefinition.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ definition })
  } catch (error) {
    console.error("Error updating boost definition:", error)
    return NextResponse.json({ error: "Error al actualizar definición" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const definition = await prisma.boostDefinition.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({ definition })
  } catch (error) {
    console.error("Error toggling boost definition:", error)
    return NextResponse.json({ error: "Error al cambiar estado" }, { status: 500 })
  }
}
