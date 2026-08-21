// Búsqueda de negocios para la app: envuelve `search()` (el mismo motor que usa
// la web en `src/app/api/search/route.ts`), pero proyecta cada resultado a
// `BusinessCard` (ligero) en vez del `Profile` completo con `include` (que trae
// memberships/tags/hours × 7 y pesa varias decenas de KB por 20 resultados).
//
// LIMITACIÓN CONOCIDA (no se arregla aquí, ver ARCHITECTURE/hallazgo de
// producción): el trigger que llena `search_vector` usa
// `to_tsvector('spanish', ...)` SIN `unaccent`, mientras que esta consulta sí
// aplica `unaccent` al buscar. Resultado: "taquería" (con acento, como está
// guardado) tokeniza a "taqu", pero "taqueria" (sin acento, como escribe el
// usuario típico) tokeniza a "taqueri" — NO hacen match por full-text.
// Se salva hoy por el respaldo trigram de `search()` (similarity() sobre el
// NOMBRE del negocio, ver search-engine.ts línea ~146), que si conserva. Arreglar
// el trigger implica una migración sobre datos vivos (ALTER FUNCTION + REINDEX)
// que es decisión del dueño del proyecto, no de este endpoint.
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { z } from "zod"
import { search } from "@/lib/search/search-engine"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { searchLimiter } from "@/lib/security/rate-limit"
import { ok, fail } from "@/lib/api/mobile/respond"
import { computeHasMore } from "@/lib/api/mobile/pagination"
import { toBusinessCard, type BusinessCard } from "@/lib/api/mobile/serializers"

// Mismo esquema que `src/app/api/search/route.ts` (mantenido en paralelo a
// propósito: la ruta web puede evolucionar independiente del contrato v1 de la
// app, que es estable una vez publicado).
const searchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.string().trim().max(120).optional(),
  municipality: z.string().trim().max(120).optional(),
  neighborhood: z.string().trim().max(120).optional(),
  subcategory: z.string().trim().max(120).optional(),
  lat: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().min(-90).max(90).optional()),
  lng: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().min(-180).max(180).optional()),
  page: z.preprocess((v) => (v === "" || v === undefined ? 1 : Number(v)), z.number().int().min(1).max(100).default(1)),
  limit: z.preprocess((v) => (v === "" || v === undefined ? 20 : Number(v)), z.number().int().min(1).max(50).default(20)),
  sort: z.enum(["relevance", "distance", "rating", "newest"]).default("relevance"),
  openNow: z.preprocess((v) => v === "true", z.boolean()).default(false),
  verified: z.preprocess((v) => v === "true", z.boolean()).default(false),
  premium: z.preprocess((v) => v === "true", z.boolean()).default(false),
  minRating: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().min(0).max(5).optional()),
  maxDistance: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().positive().max(200).optional()),
})

export async function GET(request: NextRequest) {
  // Rate limit por IP (mismo limiter que la búsqueda web): la búsqueda dispara
  // SQL crudo con full-text + trigram, más caro que un `findMany` simple.
  const limited = await searchLimiter(request)
  if (!limited.success) {
    return fail("RATE_LIMITED", 429, "Demasiadas búsquedas. Intenta de nuevo en un momento.", {
      resetTime: limited.resetTime,
    })
  }

  const { searchParams } = new URL(request.url)
  const parsed = searchSchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", 400, "Parámetros de búsqueda inválidos.", parsed.error.flatten())
  }

  const { q, category, municipality, neighborhood, subcategory, lat, lng, page, limit, sort, openNow, verified, premium, minRating, maxDistance } =
    parsed.data

  let results: Awaited<ReturnType<typeof search>>
  try {
    results = await search({
      q,
      category,
      municipality,
      neighborhood,
      subcategory,
      lat,
      lng,
      page,
      limit,
      sort,
      isOpenNow: openNow,
      isVerified: verified,
      isPremium: premium,
      minRating,
      maxDistance,
    })
  } catch (error) {
    console.error("[mobile/search]", error instanceof Error ? error.message : error)
    return fail("INTERNAL_ERROR", 500, "Error al realizar la búsqueda.")
  }

  // Registro de búsqueda para analítica (misma tabla que usa la web), sin
  // tumbar la respuesta si falla el insert.
  if (typeof q === "string" && q.trim()) {
    try {
      const session = await auth()
      await prisma.searchLog.create({
        data: {
          query: q.trim(),
          municipality,
          neighborhood,
          userId: session?.user?.id,
          resultsCount: results.total,
        },
      })
    } catch (error) {
      console.error("[mobile/search] searchLog", error instanceof Error ? error.message : error)
    }
  }

  const cards: BusinessCard[] = results.profiles.map((p) =>
    toBusinessCard({ ...p, reviewCount: p._count?.reviews ?? 0 })
  )

  return ok(cards, {
    page: results.page,
    limit,
    total: results.total,
    hasMore: computeHasMore(results.page, limit, results.total),
  })
}
