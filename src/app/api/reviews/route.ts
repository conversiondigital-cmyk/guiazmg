import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const reviewSchema = z.object({
  businessId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { businessId, rating, comment } = reviewSchema.parse(await request.json())

    const existing = await prisma.review.findUnique({
      where: { businessId_userId: { businessId, userId: session.user.id } },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Ya has reseñado este negocio" },
        { status: 409 }
      )
    }

    const review = await prisma.review.create({
      data: {
        businessId,
        userId: session.user.id,
        rating,
        comment: comment || null,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error al crear reseña" }, { status: 500 })
  }
}
