// Listado de marketplace para la app: mismo esquema de filtros que
// `src/app/api/marketplace/route.ts` (GET), pero proyectado a `ListingCard`
// (solo portada, sin todas las imágenes ni `contactEmail`).
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api/mobile/respond"
import { computeHasMore } from "@/lib/api/mobile/pagination"
import { toListingCard } from "@/lib/api/mobile/serializers"

const querySchema = z.object({
  category: z.string().trim().max(120).optional(),
  municipality: z.string().trim().max(120).optional(),
  q: z.string().trim().max(200).optional(),
  type: z.enum(["SALE", "PURCHASE", "TRADE", "SERVICE", "REQUEST", "EVENT", "PROMOTION"]).optional(),
  minPrice: z.coerce.number().nonnegative().max(9999999).optional(),
  maxPrice: z.coerce.number().nonnegative().max(9999999).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", 400, "Parámetros inválidos.", parsed.error.flatten())
  }

  const { category, municipality, q, type, minPrice, maxPrice, sort, page, limit } = parsed.data

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return fail("VALIDATION_ERROR", 400, "Rango de precio inválido.")
  }

  const where: Record<string, unknown> = { status: "ACTIVE", deletedAt: null }
  if (q) where.title = { contains: q, mode: "insensitive" }
  if (category) where.categoryId = category
  if (municipality) where.municipalityId = municipality
  if (type) where.type = type
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    }
  }

  const orderBy =
    sort === "price_asc" ? { price: "asc" as const } : sort === "price_desc" ? { price: "desc" as const } : { createdAt: "desc" as const }

  try {
    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where: where as never,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          type: true,
          condition: true,
          isBoosted: true,
          createdAt: true,
          favoriteCount: true,
          neighborhood: true,
          category: { select: { name: true, slug: true, icon: true } },
          municipality: { select: { name: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
        },
      }),
      prisma.marketplaceListing.count({ where: where as never }),
    ])

    const cards = listings.map((l) => toListingCard(l))
    return ok(cards, { page, limit, total, hasMore: computeHasMore(page, limit, total) })
  } catch (error) {
    console.error("[mobile/marketplace]", error instanceof Error ? error.message : error)
    return fail("INTERNAL_ERROR", 500, "No se pudo cargar el marketplace.")
  }
}
