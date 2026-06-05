export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))
    const rol = searchParams.get("rol")
    const status = searchParams.get("status")
    const q = searchParams.get("q")

    const where: Record<string, unknown> = { deletedAt: null }

    if (rol && rol !== "ALL") {
      where.role = rol
    }

    if (status === "active") {
      where.isActive = true
    } else if (status === "suspended") {
      where.isActive = false
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          image: true,
          _count: {
            select: {
              businesses: true,
              reviews: true,
              marketplaceListings: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { userIds, action } = body

    if (!Array.isArray(userIds) || userIds.length === 0 || !action) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (action === "suspend") {
      updateData.isActive = false
      updateData.sessionVersion = { increment: 1 }
    } else if (action === "reactivate") {
      updateData.isActive = true
    } else {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: `batch_${action}`,
        entityType: "User",
        entityId: userIds.join(","),
        newValue: JSON.stringify(updateData),
      },
    })

    return NextResponse.json({ success: true, updatedCount: userIds.length })
  } catch (error) {
    console.error("Error in batch operation:", error)
    return NextResponse.json({ error: "Error en la operación" }, { status: 500 })
  }
}
