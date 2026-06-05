import { prisma } from "@/lib/prisma"
import { interpretQuery, enrichInterpretation } from "./query-interpreter"
import { calculateScore } from "./ranking"
import { haversineDistance } from "./geolocation"
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

export async function search(params: SearchParams): Promise<SearchResponse> {
  const {
    q,
    category: categorySlug,
    municipality: municipalitySlug,
    neighborhood,
    subcategory,
    lat, lng,
    page = 1,
    limit = 20,
    sort = "relevance",
    isOpenNow,
    isVerified,
    isPremium,
    minRating,
    maxDistance,
  } = params

  let interpretation = q
    ? interpretQuery(q)
    : null

  if (interpretation && q) {
    interpretation = await enrichInterpretation(interpretation, getCategories, getMunicipalities)
  }

  const baseConditions: any[] = [{ status: "ACTIVE" }]

  const categoryId = interpretation?.categoryQuery || categorySlug
  const municipalityId = interpretation?.municipalityQuery || municipalitySlug
  const subcategoryId = interpretation?.subcategoryQuery || subcategory
  const neighborhoodId = interpretation?.neighborhoodQuery || neighborhood
  const isOpenNowFilter = interpretation?.isOpenNow || isOpenNow
  const queryText = q?.toLowerCase()

  if (interpretation?.remainingTokens?.length) {
    const restQuery = interpretation.remainingTokens.join(" ")
    baseConditions.push({
      OR: [
        { name: { contains: restQuery, mode: "insensitive" } },
        { shortDescription: { contains: restQuery, mode: "insensitive" } },
        { description: { contains: restQuery, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: restQuery, mode: "insensitive" } } } } },
      ],
    })
  } else if (queryText && !categoryId && !municipalityId) {
    baseConditions.push({
      OR: [
        { name: { contains: queryText, mode: "insensitive" } },
        { shortDescription: { contains: queryText, mode: "insensitive" } },
        { description: { contains: queryText, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: queryText, mode: "insensitive" } } } } },
      ],
    })
  }

  const filters: any = {}
  if (categoryId) filters.categoryId = categoryId
  if (subcategoryId) filters.subcategoryId = subcategoryId
  if (municipalityId) filters.municipalityId = municipalityId
  if (neighborhoodId) filters.neighborhoodId = neighborhoodId
  if (isVerified) filters.isVerified = true
  if (isPremium) filters.isPremium = true
  if (minRating) filters.reviews = { some: { rating: { gte: minRating } } }

  if (isOpenNowFilter) {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    filters.hours = {
      some: {
        dayOfWeek,
        isClosed: false,
        opensAt: { lte: currentTime },
        closesAt: { gte: currentTime },
      },
    }
  }

  const where = Object.keys(filters).length > 0
    ? { AND: [...baseConditions, filters] }
    : { AND: baseConditions }

  const skip = (page - 1) * limit

  const marketplaceWhere: any = { status: "ACTIVE", deletedAt: null }
  if (queryText) {
    marketplaceWhere.OR = [
      { title: { contains: queryText, mode: "insensitive" } },
      { description: { contains: queryText, mode: "insensitive" } },
    ]
  }

  const [profiles, total, marketplaceListings, marketplaceTotal] = await Promise.all([
    prisma.profile.findMany({
      where,
      include: {
        municipality: true,
        neighborhood: true,
        category: true,
        subcategory: true,
        memberships: { include: { plan: true } },
        tags: { include: { tag: true } },
        hours: true,
        _count: { select: { reviews: true, favorites: true } },
      },
      skip,
      take: limit,
    }),
    prisma.profile.count({ where }),
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

  const now = new Date()
  const scored = profiles.map((b) => {
    const activeMembership = b.memberships?.find((m) => m.status === "ACTIVE")
    const distance = lat && lng && b.latitude && b.longitude
      ? haversineDistance(lat, lng, b.latitude, b.longitude)
      : undefined

    let textRelevance = 0
    if (q) {
      const name = b.name.toLowerCase()
      const desc = (b.description ?? "").toLowerCase()
      const shortDesc = (b.shortDescription ?? "").toLowerCase()
      const qLower = q.toLowerCase()

      if (name === qLower) textRelevance = 100
      else if (name.startsWith(qLower)) textRelevance = 90
      else if (name.includes(qLower)) textRelevance = 70
      else if (desc.includes(qLower) || shortDesc.includes(qLower)) textRelevance = 40
      else textRelevance = 10
    } else {
      textRelevance = 50
    }

    const daysSinceCreated = Math.floor(
      (now.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    const avgRating = b._count.reviews > 0
      ? 0
      : 0

    const score = calculateScore({
      textRelevance,
      distanceKm: distance,
      planSlug: activeMembership?.plan.slug ?? null,
      hasActiveBoost: false,
      avgRating,
      reviewCount: b._count.reviews,
      isVerified: b.isVerified,
      isOpenNow: isOpenNowFilter,
      daysSinceCreated,
    })

    return { ...b, score, distance }
  })

  if (sort === "distance" && lat && lng) {
    scored.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
  } else if (sort === "rating") {
    scored.sort((a, b) => (b._count.reviews) - (a._count.reviews))
  } else if (sort === "newest") {
    scored.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } else {
    scored.sort((a, b) => b.score - a.score)
  }

  if (maxDistance && lat && lng) {
    const filtered = scored.filter((b) => b.distance === undefined || b.distance <= maxDistance)
    return {
      profiles: filtered.slice(0, limit),
      businesses: filtered.slice(0, limit),
      marketplaceListings,
      marketplaceTotal,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
      interpretation: interpretation
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
        : undefined,
    }
  }

  return {
    profiles: scored.slice(0, limit),
    businesses: scored.slice(0, limit),
    marketplaceListings,
    marketplaceTotal,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    interpretation: interpretation
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
      : undefined,
  }
}
