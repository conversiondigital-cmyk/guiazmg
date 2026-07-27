import { prisma } from "@/lib/prisma"
import { MIN_INDEXABLE_PROFILES } from "./local"

export interface ZoneSeoStat {
  id: string
  name: string
  slug: string
  municipioName: string
  municipioSlug: string
  priority: number
  isActive: boolean
  isSeoIndexable: boolean
  colonias: number
  profiles: number
  eligible: boolean // aparece en Google (indexable + activa + ≥ umbral de perfiles)
}

// Perfiles ACTIVOS por zona (vía colonia). Una sola consulta agregada.
async function profilesByZone(): Promise<Map<string, number>> {
  try {
    const rows = await prisma.$queryRaw<{ zid: string; n: number }[]>`
      SELECT n."zoneId" AS zid, count(*)::int AS n
      FROM businesses b
      JOIN neighborhoods n ON n.id = b."neighborhoodId"
      WHERE b.status = 'ACTIVE' AND b."deletedAt" IS NULL AND n."zoneId" IS NOT NULL
      GROUP BY n."zoneId"`
    return new Map(rows.map((r) => [r.zid, Number(r.n)]))
  } catch {
    return new Map()
  }
}

// Estado SEO de todas las zonas (para el dashboard y para el sitemap).
export async function getZoneSeoStats(): Promise<ZoneSeoStat[]> {
  const [zones, counts] = await Promise.all([
    prisma.zone.findMany({
      include: {
        municipality: { select: { name: true, slug: true } },
        _count: { select: { neighborhoods: true } },
      },
      orderBy: [{ municipality: { name: "asc" } }, { priority: "desc" }, { name: "asc" }],
    }),
    profilesByZone(),
  ])

  return zones.map((z) => {
    const profiles = counts.get(z.id) ?? 0
    return {
      id: z.id,
      name: z.name,
      slug: z.slug,
      municipioName: z.municipality.name,
      municipioSlug: z.municipality.slug,
      priority: z.priority,
      isActive: z.isActive,
      isSeoIndexable: z.isSeoIndexable,
      colonias: z._count.neighborhoods,
      profiles,
      eligible: z.isActive && z.isSeoIndexable && profiles >= MIN_INDEXABLE_PROFILES,
    }
  })
}

export interface SearchDemandRow {
  query: string
  searches: number
  avgResults: number
}

// Demanda de búsqueda interna: qué busca la gente y con cuántos resultados.
// avgResults bajo = oportunidad (buscan algo que casi no existe en el directorio).
export async function getInternalSearchDemand(days = 30, limit = 15): Promise<SearchDemandRow[]> {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const grouped = await prisma.searchLog.groupBy({
      by: ["query"],
      where: { createdAt: { gte: since }, query: { not: "" } },
      _count: { query: true },
      _avg: { resultsCount: true },
      orderBy: { _count: { query: "desc" } },
      take: limit,
    })
    return grouped.map((g) => ({
      query: g.query,
      searches: g._count.query,
      avgResults: Math.round((g._avg.resultsCount ?? 0) * 10) / 10,
    }))
  } catch {
    return []
  }
}
