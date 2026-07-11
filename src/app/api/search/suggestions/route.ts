import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "8"), 20)

    if (!q.trim()) {
      const popular = await prisma.searchLog.groupBy({
        by: ["query"],
        _count: { query: true },
        orderBy: { _count: { query: "desc" } },
        take: limit,
      })
      return NextResponse.json(popular.map((p) => p.query))
    }

    // Autocompletado insensible a acentos (unaccent). Las categorías matchean
    // también por sus keywords/sinónimos (ej. "taco" sugiere "Restaurantes").
    // El texto del usuario va SIEMPRE como parámetro ($1), nunca concatenado.
    const like = `%${q.trim()}%`

    const [nameRows, catRows, tagRows] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ name: string }>>(
        `SELECT name FROM businesses WHERE status='ACTIVE' AND unaccent(lower(name)) LIKE unaccent(lower($1)) ORDER BY "isVerified" DESC, "isFeatured" DESC LIMIT $2`,
        like, limit
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

    return NextResponse.json(Array.from(suggestions).slice(0, limit))
  } catch {
    return NextResponse.json([])
  }
}
