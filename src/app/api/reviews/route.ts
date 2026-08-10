import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireConsent } from "@/lib/auth/consent"
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
    const consent = await requireConsent()
    if (!consent.ok) return NextResponse.json({ error: consent.error }, { status: consent.status })

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
    const negocio = profile?.name ?? "un negocio"
    if (profile && profile.ownerId !== session.user.id) {
      await createNotification({
        userId: profile.ownerId,
        type: "REVIEW",
        title: `Nueva reseña de ${rating}★ en ${negocio}`,
        message: comment ? comment.slice(0, 140) : "Recibiste una nueva reseña.",
      })
    }

    // Notifica TAMBIÉN a los administradores para que vean la reseña desde su
    // panel. Se excluye al autor y al dueño (ya avisado) para no duplicar.
    const excluded = [session.user.id, profile?.ownerId].filter((x): x is string => !!x)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true, deletedAt: null, id: { notIn: excluded } },
      select: { id: true },
    })
    await Promise.all(
      admins.map((a) =>
        createNotification({
          userId: a.id,
          type: "REVIEW",
          title: `Nueva reseña de ${rating}★ en ${negocio}`,
          message: comment ? comment.slice(0, 140) : "Se publicó una nueva reseña. Revísala en el panel.",
        }),
      ),
    )

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error al crear reseña" }, { status: 500 })
  }
}
