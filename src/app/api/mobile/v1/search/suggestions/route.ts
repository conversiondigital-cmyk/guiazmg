// Autocompletado de búsqueda para la app: envuelve la misma consulta que
// `src/app/api/search/suggestions/route.ts` (negocios + categorías + tags,
// insensible a acentos vía `unaccent`) en el contrato `{ ok, data }`, en vez
// del array pelado que devuelve hoy la ruta web.
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api/mobile/respond"

const querySchema = z.object({
  q: z.string().trim().max(200).optional().default(""),
  limit: z.coerce.number().int().min(1).max(20).default(8),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", 400, "Parámetros inválidos.", parsed.error.flatten())
  }
  const { q, limit } = parsed.data

  try {
    if (!q.trim()) {
      const popular = await prisma.searchLog.groupBy({
        by: ["query"],
        _count: { query: true },
        orderBy: { _count: { query: "desc" } },
        take: limit,
      })
      return ok(popular.map((p) => p.query))
    }

    // Texto del usuario SIEMPRE parametrizado ($1); nunca concatenado al SQL.
    const like = `%${q.trim()}%`

    const [nameRows, catRows, tagRows] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ name: string }>>(
        `SELECT name FROM businesses WHERE status='ACTIVE' AND unaccent(lower(name)) LIKE unaccent(lower($1)) ORDER BY "isVerified" DESC, "isFeatured" DESC LIMIT $2`,
        like,
        limit
      ),
      prisma.$queryRawUnsafe<Array<{ name: string }>>(
        `SELECT name FROM categories WHERE "isActive"=true AND (unaccent(lower(name)) LIKE unaccent(lower($1)) OR unaccent(lower(coalesce(keywords,''))) LIKE unaccent(lower($1))) LIMIT 4`,
        like
      ),
      prisma.$queryRawUnsafe<Array<{ name: string }>>(
        `SELECT name FROM tags WHERE "isActive"=true AND unaccent(lower(name)) LIKE unaccent(lower($1)) LIMIT 4`,
        like
      ),
    ])

    const suggestions = new Set<string>()
    catRows.forEach((c) => suggestions.add(c.name))
    tagRows.forEach((t) => suggestions.add(t.name))
    nameRows.forEach((b) => suggestions.add(b.name))

    return ok(Array.from(suggestions).slice(0, limit))
  } catch (error) {
    console.error("[mobile/search/suggestions]", error instanceof Error ? error.message : error)
    return ok([] as string[])
  }
}
