import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const querySchema = z.object({
  categoryId: z.string().cuid().optional(),
  municipalityId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  status: z.literal("ACTIVE").optional(),
  page: z.preprocess((v) => (v === "" || v === undefined ? 1 : Number(v)), z.number().int().min(1).max(100).default(1)),
  limit: z.preprocess((v) => (v === "" || v === undefined ? 20 : Number(v)), z.number().int().min(1).max(50).default(20)),
})

export async function GET(req: Request) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  }

  const { categoryId, municipalityId, userId, status, page, limit } = parsed.data
  const skip = (page - 1) * limit

  const where: any = { status: status || "ACTIVE" }
  if (categoryId) where.categoryId = categoryId
  if (municipalityId) where.municipalityId = municipalityId

  if (userId) {
    const canFilterByUser = session?.user?.id && (session.user.role === "ADMIN" || session.user.id === userId)
    if (!canFilterByUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    where.userId = userId
  }

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
        municipality: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
        responses: { orderBy: { createdAt: "desc" }, take: 3 },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.serviceRequest.count({ where }),
  ])

  return NextResponse.json({ data: requests, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, categoryId, municipalityId, neighborhood } = body

  if (!title || !categoryId) {
    return NextResponse.json({ error: "Título y categoría son requeridos" }, { status: 400 })
  }

  const request = await prisma.serviceRequest.create({
    data: {
      title,
      description,
      categoryId,
      municipalityId: municipalityId || null,
      neighborhood: neighborhood || null,
      userId: session.user.id,
    },
  })

  return NextResponse.json(request, { status: 201 })
}
