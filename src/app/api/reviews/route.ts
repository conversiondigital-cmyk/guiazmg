import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications/create"
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

    // Las reseñas se publican SIN moderación previa (APPROVED). El control es
    // posterior: cualquiera puede reportar una reseña que viole las políticas y
    // el admin la revisa/oculta desde el panel de reportes.
    const review = await prisma.review.create({
      data: {
        businessId,
        userId: session.user.id,
        rating,
        comment: comment || null,
        status: "APPROVED",
      },
    })

    // Notifica al dueño del negocio (si no es el propio autor).
    const profile = await prisma.profile.findUnique({
      where: { id: businessId },
      select: { ownerId: true, name: true },
    })
    if (profile && profile.ownerId !== session.user.id) {
      await createNotification({
        userId: profile.ownerId,
        type: "REVIEW",
        title: `Nueva reseña de ${rating}★ en ${profile.name}`,
        message: comment ? comment.slice(0, 140) : "Recibiste una nueva reseña.",
      })
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error al crear reseña" }, { status: 500 })
  }
}
