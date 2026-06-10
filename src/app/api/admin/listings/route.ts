import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !["ADMIN", "EDITOR"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20))
    const status = searchParams.get("status")
    const search = searchParams.get("search")?.trim()

    const where: Prisma.ListingWhereInput = { deletedAt: null }

    if (status && status !== "todos") {
      const statusMap: Record<string, string> = {
        activos: "ACTIVE",
        pendientes: "PENDING_REVIEW",
        pausados: "DRAFT",
        archivados: "ARCHIVED",
      }
      where.status = statusMap[status] as any
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { profile: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          profile: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true } },
          subcategory: { select: { id: true, name: true } },
          images: { select: { id: true, imageUrl: true }, take: 1 },
          boosts: {
            where: { status: "ACTIVE" },
            select: { id: true, endsAt: true },
            take: 1,
          },
          _count: { select: { leads: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("[ADMIN_LISTINGS_GET]", error)
    return NextResponse.json({ error: "Error al obtener anuncios" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !["ADMIN", "EDITOR"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0 || !action) {
      return NextResponse.json({ error: "IDs y acción requeridos" }, { status: 400 })
    }

    let updateData: Prisma.ListingUpdateManyMutationInput = {}

    switch (action) {
      case "APPROVE":
        updateData = { status: "ACTIVE" }
        break
      case "REJECT":
        updateData = { status: "ARCHIVED" }
        break
      case "PAUSE":
        updateData = { status: "DRAFT" }
        break
      case "ARCHIVE":
        updateData = { status: "ARCHIVED" }
        break
      case "ACTIVATE":
        updateData = { status: "ACTIVE" }
        break
      case "DELETE":
        updateData = { deletedAt: new Date() }
        break
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    await prisma.listing.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    await prisma.auditLog.createMany({
      data: ids.map((id) => ({
        actorUserId: session.user.id,
        action: `BATCH_${action}`,
        entityType: "Listing",
        entityId: id,
        newValue: JSON.stringify({ action }),
      })),
    })

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error) {
    console.error("[ADMIN_LISTINGS_PATCH]", error)
    return NextResponse.json({ error: "Error en operación por lote" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !["ADMIN", "EDITOR"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: "ID y acción requeridos" }, { status: 400 })
    }

    const listing = await prisma.listing.findUnique({ where: { id } })
    if (!listing) {
      return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 })
    }

    let updateData: any = {}
    let actionLabel = action

    switch (action) {
      case "APPROVE":
        updateData = { status: "ACTIVE" }
        break
      case "REJECT":
        updateData = { status: "ARCHIVED" }
        break
      case "PAUSE":
        updateData = { status: "DRAFT" }
        break
      case "ARCHIVE":
        updateData = { status: "ARCHIVED" }
        break
      case "DELETE":
        updateData = { deletedAt: new Date() }
        break
      case "FEATURE":
        updateData = { visibilityScore: { increment: 100 } }
        actionLabel = "FEATURE"
        break
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: actionLabel,
        entityType: "Listing",
        entityId: id,
        oldValue: JSON.stringify({ status: listing.status, visibilityScore: listing.visibilityScore }),
        newValue: JSON.stringify({ status: updated.status, visibilityScore: updated.visibilityScore }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[ADMIN_LISTINGS_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar anuncio" }, { status: 500 })
  }
}
