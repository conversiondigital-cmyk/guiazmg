export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (status && status !== "ALL") {
      where.status = status
    }

    const boosts = await prisma.boost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        listing: { select: { id: true, title: true } },
      },
    })

    const now = new Date()

    const [activeCount, scheduledCount, expiredCount, cancelledCount, boostTypeStats] = await Promise.all([
      prisma.boost.count({ where: { status: "ACTIVE" } }),
      prisma.boost.count({ where: { status: "ACTIVE", startsAt: { gt: now } } }),
      prisma.boost.count({ where: { status: "EXPIRED" } }),
      prisma.boost.count({ where: { status: "CANCELLED" } }),
      prisma.boost.groupBy({
        by: ["businessId"],
        _count: { id: true },
        where: { status: "ACTIVE" },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      }),
    ])

    return NextResponse.json({
      boosts: boosts.map((boost) => ({
        ...JSON.parse(JSON.stringify(boost)),
        pricePaid: Number(boost.pricePaid ?? 0),
      })),
      stats: {
        active: activeCount,
        scheduled: scheduledCount,
        expired: expiredCount,
        cancelled: cancelledCount,
        mostUsedType: boostTypeStats[0]?._count?.id ?? 0,
      },
    })
  } catch (error) {
    console.error("Error fetching boosts:", error)
    return NextResponse.json({ error: "Error al obtener boosts" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, action, extendDays } = body

    if (!id || !action) {
      return NextResponse.json({ error: "ID y acción requeridos" }, { status: 400 })
    }

    if (action === "cancel") {
      const boost = await prisma.boost.update({
        where: { id },
        data: { status: "CANCELLED" },
      })

      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "cancel_boost",
          entityType: "Boost",
          entityId: id,
        },
      })

      return NextResponse.json({ boost })
    }

    if (action === "extend") {
      const boost = await prisma.boost.findUnique({ where: { id } })
      if (!boost) {
        return NextResponse.json({ error: "Boost no encontrado" }, { status: 404 })
      }

      const days = extendDays || 7
      const newEnd = new Date(boost.endsAt)
      newEnd.setDate(newEnd.getDate() + days)

      const updated = await prisma.boost.update({
        where: { id },
        data: { endsAt: newEnd },
      })

      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "extend_boost",
          entityType: "Boost",
          entityId: id,
          newValue: JSON.stringify({ oldEnd: boost.endsAt, newEnd }),
        },
      })

      return NextResponse.json({ boost: updated })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("Error processing boost action:", error)
    return NextResponse.json({ error: "Error al procesar acción" }, { status: 500 })
  }
}
