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
    const tipo = searchParams.get("tipo")
    const status = searchParams.get("status")
    const search = searchParams.get("search")?.trim()

    const where: Prisma.MarketplaceListingWhereInput = {}

    if (tipo && tipo !== "todos") {
      if (tipo === "comunidad") {
        where.type = { in: ["TRADE", "PURCHASE"] }
      } else if (["productos", "servicios", "solicitudes", "eventos", "promocion"].includes(tipo)) {
        const typeMap: Record<string, string> = {
          productos: "SALE",
          servicios: "SERVICE",
          solicitudes: "REQUEST",
          eventos: "EVENT",
          promocion: "PROMOTION",
        }
        where.type = typeMap[tipo] as any
      }
    }

    if (status && status !== "todos") {
      const statusMap: Record<string, string> = {
        activos: "ACTIVE",
        pendientes: "ACTIVE",
        ocultos: "HIDDEN",
        suspendidos: "HIDDEN",
        eliminados: "DELETED",
      }
      where.status = statusMap[status] as any
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
          images: { select: { id: true, url: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.marketplaceListing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("[ADMIN_MARKETPLACE_GET]", error)
    return NextResponse.json({ error: "Error al obtener publicaciones" }, { status: 500 })
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

    let updateData: Prisma.MarketplaceListingUpdateManyMutationInput = {}

    switch (action) {
      case "APPROVE":
      case "ACTIVATE":
        updateData = { status: "ACTIVE" }
        break
      case "REJECT":
      case "HIDE":
      case "SUSPEND":
        updateData = { status: "HIDDEN" }
        break
      case "DELETE":
        updateData = { status: "DELETED", deletedAt: new Date() }
        break
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    await prisma.marketplaceListing.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    await prisma.auditLog.createMany({
      data: ids.map((id) => ({
        actorUserId: session.user.id,
        action: `BATCH_${action}`,
        entityType: "MarketplaceListing",
        entityId: id,
        newValue: JSON.stringify({ action }),
      })),
    })

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error) {
    console.error("[ADMIN_MARKETPLACE_PATCH]", error)
    return NextResponse.json({ error: "Error en operación por lote" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: "ID y acción requeridos" }, { status: 400 })
    }

    const listing = await prisma.marketplaceListing.findUnique({ where: { id } })
    if (!listing) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 })
    }

    let updateData: any = {}
    const actionLabel = action

    switch (action) {
      case "APPROVE":
        updateData = { status: "ACTIVE" }
        break
      case "REJECT":
        updateData = { status: "HIDDEN" }
        break
      case "HIDE":
        updateData = { status: "HIDDEN" }
        break
      case "SUSPEND":
        updateData = { status: "HIDDEN" }
        break
      case "ACTIVATE":
        updateData = { status: "ACTIVE" }
        break
      case "DELETE":
        updateData = { status: "DELETED", deletedAt: new Date() }
        break
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    const updated = await prisma.marketplaceListing.update({
      where: { id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: actionLabel,
        entityType: "MarketplaceListing",
        entityId: id,
        oldValue: JSON.stringify({ status: listing.status }),
        newValue: JSON.stringify({ status: updated.status }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[ADMIN_MARKETPLACE_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar publicación" }, { status: 500 })
  }
}
