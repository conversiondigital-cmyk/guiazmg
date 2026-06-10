import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20))
    const status = searchParams.get("status")
    const search = searchParams.get("search")?.trim()

    const where: Prisma.ProfileWhereInput = {
      deletedAt: null,
    }

    if (status && status !== "ALL") {
      where.status = status as any
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { owner: { name: { contains: search, mode: "insensitive" } } },
        { owner: { email: { contains: search, mode: "insensitive" } } },
      ]
    }

    const [businesses, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true, image: true } },
          category: { select: { id: true, name: true } },
          municipality: { select: { id: true, name: true } },
          memberships: {
            include: { plan: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: { select: { reviews: true, images: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.profile.count({ where }),
    ])

    const stats = await prisma.profile.aggregate({
      where: { deletedAt: null },
      _count: true,
    })

    const pendingCount = await prisma.profile.count({
      where: { deletedAt: null, status: "PENDING_REVIEW" },
    })
    const activeCount = await prisma.profile.count({
      where: { deletedAt: null, status: "ACTIVE" },
    })
    const suspendedCount = await prisma.profile.count({
      where: { deletedAt: null, status: "SUSPENDED" },
    })

    return NextResponse.json({
      businesses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: stats._count,
        pending: pendingCount,
        active: activeCount,
        suspended: suspendedCount,
      },
    })
  } catch (error) {
    console.error("[ADMIN_BUSINESSES_GET]", error)
    return NextResponse.json({ error: "Error al obtener negocios" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0 || !action) {
      return NextResponse.json({ error: "IDs y acción requeridos" }, { status: 400 })
    }

    let updateData: Prisma.ProfileUpdateManyMutationInput = {}

    switch (action) {
      case "APPROVE":
        updateData = { status: "ACTIVE" }
        break
      case "REJECT":
        updateData = { status: "REJECTED" }
        break
      case "SUSPEND":
        updateData = { status: "SUSPENDED" }
        break
      case "ACTIVATE":
        updateData = { status: "ACTIVE" }
        break
      case "ARCHIVE":
        updateData = { status: "ARCHIVED" }
        break
      case "DELETE":
        updateData = { deletedAt: new Date() }
        break
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    await prisma.profile.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    await prisma.auditLog.createMany({
      data: ids.map((id) => ({
        actorUserId: session.user.id,
        action: `BATCH_${action}`,
        entityType: "Business",
        entityId: id,
        newValue: JSON.stringify({ action }),
      })),
    })

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error) {
    console.error("[ADMIN_BUSINESSES_PATCH]", error)
    return NextResponse.json({ error: "Error en operación por lote" }, { status: 500 })
  }
}
