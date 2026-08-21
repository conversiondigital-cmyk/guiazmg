// Listado paginado de reseñas de un negocio. No existe hoy en la web (la
// página de ficha solo trae las primeras 10 vía `getProfileBySlug`); este
// endpoint es NUEVO, pensado para una pantalla "Ver todas las reseñas" con
// scroll infinito en la app.
export const dynamic = "force-dynamic"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api/mobile/respond"
import { mobilePaginationSchema, computeHasMore } from "@/lib/api/mobile/pagination"

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const parsed = mobilePaginationSchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", 400, "Parámetros de paginación inválidos.", parsed.error.flatten())
  }
  const { page, limit } = parsed.data

  const business = await prisma.profile.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  })
  if (!business) {
    return fail("NOT_FOUND", 404, "Negocio no encontrado.")
  }

  const where = { businessId: business.id, status: { not: "REJECTED" as const } }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
        response: { select: { response: true, createdAt: true } },
      },
    }),
    prisma.review.count({ where }),
  ])

  const data = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title ?? null,
    comment: r.comment ?? null,
    authorName: r.user?.name ?? null,
    createdAt: r.createdAt.toISOString(),
    ownerResponse: r.response ? { comment: r.response.response, createdAt: r.response.createdAt.toISOString() } : null,
  }))

  return ok(data, { page, limit, total, hasMore: computeHasMore(page, limit, total) })
}
