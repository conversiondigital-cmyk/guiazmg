import { prisma } from "@/lib/prisma"
import { interpretQuery, enrichInterpretation } from "./query-interpreter"
import { getCategories, getMunicipalities } from "@/lib/queries"

export interface SearchParams {
  q?: string
  category?: string
  municipality?: string
  neighborhood?: string
  subcategory?: string
  lat?: number
  lng?: number
  page?: number
  limit?: number
  sort?: "relevance" | "distance" | "rating" | "newest"
  isOpenNow?: boolean
  isVerified?: boolean
  isPremium?: boolean
  minRating?: number
  maxDistance?: number
}

export interface SearchResultItem extends Record<string, any> {
  score: number
  distance?: number
  relevance?: number
}

export interface SearchResponse {
  profiles: any[]
  businesses: any[]
  marketplaceListings: any[]
  marketplaceTotal: number
  total: number
  page: number
  totalPages: number
  interpretation?: {
    categoryQuery?: string
    subcategoryQuery?: string
    municipalityQuery?: string
    neighborhoodQuery?: string
    isUrgency: boolean
    isProximity: boolean
    isOpenNow: boolean
    original: string
  }
}

interface RankedRow {
  id: string
  rank: number
  dist: number | null
  avg_rating: number | null
  total_count: bigint
}

/**
 * Motor de búsqueda de negocios.
 *
 * Texto: full-text search en `search_vector` (tsvector español + unaccent, con
 * pesos nombre>categoría/keywords>descripción) con fallback trigram (`similarity`)
 * para typos. Distancia (Haversine) y ORDEN se calculan EN LA BD antes de paginar,
 * así el "más cercano" global sale primero de verdad.
 *
 * SEGURIDAD: todo valor del usuario va parametrizado ($1, $2…); la única parte
 * dinámica del SQL (ORDER BY, fragmentos condicionales) proviene de flags/whitelist
 * internos, nunca de strings del usuario.
 */
export async function search(params: SearchParams): Promise<SearchResponse> {
  const {
    q,
    category: categorySlug,
    municipality: municipalitySlug,
    neighborhood,
    subcategory,
    lat,
    lng,
    page = 1,
    limit = 20,
    sort = "relevance",
    isOpenNow,
    isVerified,
    isPremium,
    minRating,
    maxDistance,
  } = params

  // Blindaje: page/limit acotados (este método es exportado y search/page.tsx no
  // los valida → evita OFFSET negativo/NaN o un LIMIT gigante).
  const safeLimit = Math.min(Math.max(1, Math.floor(Number(limit)) || 20), 50)
  const safePage = Math.max(1, Math.floor(Number(page)) || 1)

  let interpretation = q ? interpretQuery(q) : null
  if (interpretation && q) {
    interpretation = await enrichInterpretation(interpretation, getCategories, getMunicipalities)
  }

  const categoryId = interpretation?.categoryQuery || categorySlug
  const municipalityId = interpretation?.municipalityQuery || municipalitySlug
  const subcategoryId = interpretation?.subcategoryQuery || subcategory
  const neighborhoodId = interpretation?.neighborhoodQuery || neighborhood
  const isOpenNowFilter = interpretation?.isOpenNow || isOpenNow

  // Texto para FTS: lo que quede tras extraer categoría/municipio; o la query
  // completa si no se extrajo nada. Vacío = búsqueda por filtro puro (sin texto).
  let searchText = ""
  if (interpretation?.remainingTokens?.length) {
    searchText = interpretation.remainingTokens.join(" ")
  } else if (q && !categoryId && !municipalityId) {
    searchText = q
  }
  searchText = searchText.trim()

  const hasLoc =
    typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng)

  // Constructor de parámetros posicionales seguros ($1, $2, ...).
  const values: unknown[] = []
  const param = (v: unknown) => {
    values.push(v)
    return `$${values.length}`
  }

  const conditions: string[] = [`b.status = 'ACTIVE'`]

  let rankSql = `0::float`
  if (searchText) {
    const tq = param(searchText)
    conditions.push(
      `(b.search_vector @@ websearch_to_tsquery('spanish', unaccent(${tq})) ` +
        `OR similarity(unaccent(b.name), unaccent(${tq})) > 0.3)`
    )
    rankSql =
      `(ts_rank(b.search_vector, websearch_to_tsquery('spanish', unaccent(${tq}))) ` +
      `+ GREATEST(similarity(unaccent(b.name), unaccent(${tq})), 0) * 0.5)`
  }

  // El filtro puede llegar como id (del intérprete) o como slug (de la UI):
  // se resuelve contra ambas columnas para no devolver 0 al filtrar por slug.
  if (categoryId) { const v = param(categoryId); conditions.push(`b."categoryId" IN (SELECT id FROM categories WHERE id = ${v} OR slug = ${v})`) }
  if (subcategoryId) { const v = param(subcategoryId); conditions.push(`b."subcategoryId" IN (SELECT id FROM subcategories WHERE id = ${v} OR slug = ${v})`) }
  if (municipalityId) { const v = param(municipalityId); conditions.push(`b."municipalityId" IN (SELECT id FROM municipalities WHERE id = ${v} OR slug = ${v})`) }
  if (neighborhoodId) { const v = param(neighborhoodId); conditions.push(`b."neighborhoodId" IN (SELECT id FROM neighborhoods WHERE id = ${v} OR slug = ${v})`) }
  if (isVerified) conditions.push(`b."isVerified" = true`)
  if (isPremium) conditions.push(`b."isPremium" = true`)
  if (minRating) {
    conditions.push(
      `EXISTS (SELECT 1 FROM reviews r WHERE r."businessId" = b.id ` +
        `AND r.status <> 'REJECTED' AND r.rating >= ${param(minRating)})`
    )
  }
  if (isOpenNowFilter) {
    const now = new Date()
    const dow = now.getDay()
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    conditions.push(
      `EXISTS (SELECT 1 FROM business_hours h WHERE h."businessId" = b.id ` +
        `AND h."dayOfWeek" = ${param(dow)} AND h."isClosed" = false ` +
        `AND h."opensAt" <= ${param(time)} AND h."closesAt" >= ${param(time)})`
    )
  }

  let distSql = `NULL::float`
  if (hasLoc) {
    const latP = param(lat)
    const lngP = param(lng)
    distSql =
      `CASE WHEN b.latitude IS NOT NULL AND b.longitude IS NOT NULL THEN ` +
      `(6371 * acos(LEAST(1, GREATEST(-1, ` +
      `cos(radians(${latP})) * cos(radians(b.latitude)) * cos(radians(b.longitude) - radians(${lngP})) ` +
      `+ sin(radians(${latP})) * sin(radians(b.latitude)))))) ELSE NULL END`
    if (maxDistance) {
      conditions.push(`(${distSql}) <= ${param(maxDistance)}`)
    }
  }

  const avgSql = `(SELECT AVG(r.rating)::float FROM reviews r WHERE r."businessId" = b.id AND r.status <> 'REJECTED')`

  // ORDER BY por whitelist (nunca interpola valores del usuario).
  let orderSql: string
  if (sort === "distance" && hasLoc) orderSql = `dist ASC NULLS LAST, rank DESC`
  else if (sort === "newest") orderSql = `b."createdAt" DESC`
  else if (sort === "rating") orderSql = `avg_rating DESC NULLS LAST, rank DESC`
  else if (hasLoc) orderSql = `rank DESC, dist ASC NULLS LAST`
  else orderSql = `rank DESC, b."isFeatured" DESC, b."createdAt" DESC`

  const offset = (safePage - 1) * safeLimit
  const limitP = param(safeLimit)
  const offsetP = param(offset)

  const sql = `
    SELECT b.id,
      ${rankSql} AS rank,
      ${distSql} AS dist,
      ${avgSql} AS avg_rating,
      count(*) OVER() AS total_count
    FROM businesses b
    WHERE ${conditions.join(" AND ")}
    ORDER BY ${orderSql}
    LIMIT ${limitP} OFFSET ${offsetP}
  `

  const rows = await prisma.$queryRawUnsafe<RankedRow[]>(sql, ...values)
  let total = rows.length > 0 ? Number(rows[0].total_count) : 0
  // Si la página pedida excede los resultados, count(*) OVER() no devuelve filas;
  // se cuenta aparte para no reportar total 0 habiendo resultados en páginas previas.
  if (rows.length === 0 && safePage > 1) {
    const whereValues = values.slice(0, values.length - 2)
    const counted = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
      `SELECT count(*)::bigint AS c FROM businesses b WHERE ${conditions.join(" AND ")}`,
      ...whereValues
    )
    total = Number(counted[0]?.c ?? 0)
  }
  const ids = rows.map((r) => r.id)

  const hydrated = ids.length
    ? await prisma.profile.findMany({
        where: { id: { in: ids } },
        include: {
          municipality: true,
          neighborhood: true,
          category: true,
          subcategory: true,
          memberships: { include: { plan: true } },
          tags: { include: { tag: true } },
          hours: true,
          _count: { select: { reviews: { where: { status: { not: "REJECTED" } } }, favorites: true } },
        },
      })
    : []
  const byId = new Map(hydrated.map((pf) => [pf.id, pf]))

  // Reordena según el orden que devolvió el SQL y adjunta distancia/relevancia.
  const profiles = rows
    .map((r) => {
      const pf = byId.get(r.id)
      if (!pf) return null
      return {
        ...pf,
        distance: r.dist ?? undefined,
        relevance: r.rank,
        avgRating: r.avg_rating ?? 0,
        score: r.rank,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // Marketplace (búsqueda simple por texto, sin cambios estructurales).
  const marketplaceWhere: any = { status: "ACTIVE", deletedAt: null }
  if (q) {
    marketplaceWhere.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }

  const [marketplaceListings, marketplaceTotal] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where: marketplaceWhere,
      include: {
        category: { select: { name: true, slug: true } },
        user: { select: { id: true, name: true, image: true } },
        images: { take: 1, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.marketplaceListing.count({ where: marketplaceWhere }),
  ])

  const interpretationOut = interpretation
    ? {
        categoryQuery: interpretation.categoryQuery,
        subcategoryQuery: interpretation.subcategoryQuery,
        municipalityQuery: interpretation.municipalityQuery,
        neighborhoodQuery: interpretation.neighborhoodQuery,
        isUrgency: interpretation.isUrgency,
        isProximity: interpretation.isProximity,
        isOpenNow: interpretation.isOpenNow,
        original: interpretation.original,
      }
    : undefined

  return {
    profiles,
    businesses: profiles,
    marketplaceListings,
    marketplaceTotal,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
    interpretation: interpretationOut,
  }
}
