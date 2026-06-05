import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const allowedRoles = ["ADMIN", "EDITOR"]

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user || !allowedRoles.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20))

  const where: Record<string, unknown> = {}
  if (status && status !== "ALL") {
    where.status = status
  }

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        category: { select: { id: true, name: true } },
        municipality: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.serviceRequest.count({ where }),
  ])

  return NextResponse.json({
    requests,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user || !allowedRoles.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0 || !action) {
      return NextResponse.json({ error: "IDs y acción requeridos" }, { status: 400 })
    }

    const validActions = ["APPROVED", "REJECTED", "HIDDEN", "ACTIVE", "CLOSED"]
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    await prisma.serviceRequest.updateMany({
      where: { id: { in: ids } },
      data: { status: action },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error al actualizar solicitudes" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user || !allowedRoles.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "ID y estado requeridos" }, { status: 400 })
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Error al actualizar solicitud" }, { status: 500 })
  }
}
