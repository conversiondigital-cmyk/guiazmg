import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ReviewStatus } from "@/generated/prisma/enums"

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

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        business: { select: { id: true, name: true, slug: true } },
        response: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ])

  return NextResponse.json({
    reviews,
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

    if (action === "DELETE") {
      await prisma.review.deleteMany({ where: { id: { in: ids } } })
      return NextResponse.json({ success: true })
    }

    const validStatuses = [ReviewStatus.APPROVED, ReviewStatus.REJECTED, ReviewStatus.PENDING]
    if (!validStatuses.includes(action as any)) {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    await prisma.review.updateMany({
      where: { id: { in: ids } },
      data: { status: action as ReviewStatus },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error al actualizar reseñas" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user || !allowedRoles.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status, response } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status

    if (response) {
      const review = await prisma.review.findUnique({
        where: { id },
        select: { businessId: true, response: { select: { id: true } } },
      })

      if (!review) {
        return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })
      }

      if (review.response) {
        await prisma.reviewResponse.update({
          where: { id: review.response.id },
          data: { response },
        })
      } else {
        await prisma.reviewResponse.create({
          data: {
            reviewId: id,
            businessId: review.businessId,
            userId: session.user.id,
            response,
          },
        })
      }
    }

    if (status) {
      await prisma.review.update({ where: { id }, data: { status: status as ReviewStatus } })
    }

    const updated = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        business: { select: { id: true, name: true } },
        response: true,
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Error al actualizar reseña" }, { status: 500 })
  }
}
