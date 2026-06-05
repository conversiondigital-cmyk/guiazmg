import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50))
    const userId = searchParams.get("userId")
    const entityType = searchParams.get("entityType")
    const action = searchParams.get("action")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const search = searchParams.get("search")?.trim()

    const where: Prisma.AuditLogWhereInput = {}

    if (userId) {
      where.actorUserId = userId
    }

    if (entityType) {
      where.entityType = { contains: entityType, mode: "insensitive" }
    }

    if (action) {
      where.action = { contains: action, mode: "insensitive" }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    if (search) {
      where.entityId = { contains: search, mode: "insensitive" }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    const users = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "EDITOR", "SALES_AGENT"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      logs,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[ADMIN_AUDIT_LOG_GET]", error)
    return NextResponse.json({ error: "Error al obtener auditoría" }, { status: 500 })
  }
}
