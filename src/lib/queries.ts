import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function getProfileByUser(userId: string) {
  return prisma.profile.findFirst({
    where: { ownerId: userId },
    include: {
      municipality: true,
      neighborhood: true,
      category: true,
      subcategory: true,
      memberships: { include: { plan: true } },
    },
  })
}

export async function getProfileById(id: string) {
  return prisma.profile.findUnique({
    where: { id },
    include: {
      municipality: true,
      neighborhood: true,
      category: true,
      subcategory: true,
      memberships: { include: { plan: true } },
      coupons: { where: { isActive: true, endDate: { gte: new Date() } } },
      reviews: {
        where: { status: { not: "REJECTED" } },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, image: true } } },
      },
      tags: { include: { tag: true } },
    },
  })
}

export async function getProfileBySlug(slug: string) {
  try {
    return await prisma.profile.findUnique({
    where: { slug },
    include: {
      municipality: true,
      neighborhood: true,
      category: true,
      subcategory: true,
      memberships: { include: { plan: true } },
      coupons: {
        where: { isActive: true, endDate: { gte: new Date() } },
        orderBy: { createdAt: "desc" },
      },
      reviews: {
        where: { status: { not: "REJECTED" } },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, image: true } } },
      },
      tags: { include: { tag: true } },
      hours: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { reviews: { where: { status: { not: "REJECTED" } } } } },
    },
    })
  } catch {
    return null
  }
}

// Consultas "calientes" (corren en home, búsqueda y landings SEO): se cachean
// con etiquetas para no pegarle a la BD en cada request. Se revalidan al instante
// cuando el admin edita esas entidades (revalidateTag) y, como red de seguridad,
// por tiempo. Categorías/municipios cambian poco → 1h; destacados → 10min.
export const getCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: { isActive: true },
      include: {
        subcategories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ["categories"],
  { revalidate: 600, tags: ["categories"] }
)

export const getMunicipalities = unstable_cache(
  async () =>
    prisma.municipality.findMany({
      where: { isActive: true },
      include: {
        neighborhoods: { where: { isActive: true }, orderBy: { name: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
  ["municipalities"],
  { revalidate: 600, tags: ["municipalities"] }
)

export const getFeaturedProfiles = unstable_cache(
  async (limit = 12) =>
    prisma.profile.findMany({
      where: { status: "ACTIVE" },
      include: {
        municipality: true,
        category: true,
        memberships: { include: { plan: true } },
      },
      orderBy: [{ isVerified: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit,
    }),
  ["featured-profiles"],
  { revalidate: 300, tags: ["profiles"] }
)

// Negocios geolocalizados para el mapa interactivo (/mapa). Solo ACTIVE con
// coordenadas. Se cachea y revalida con la etiqueta de perfiles.
export const getMapBusinesses = unstable_cache(
  async () =>
    prisma.profile.findMany({
      where: { status: "ACTIVE", latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
        coverImageUrl: true,
        logoUrl: true,
        googleRating: true,
        isFeatured: true,
        isVerified: true,
        addressText: true,
        category: { select: { name: true, slug: true, icon: true } },
        municipality: { select: { name: true } },
        neighborhood: { select: { name: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { isVerified: "desc" }, { createdAt: "desc" }],
      take: 500,
    }),
  ["map-businesses"],
  { revalidate: 300, tags: ["profiles"] }
)

// Listado de una categoría con SELECT mínimo (solo lo que renderiza SearchResults).
// La página /categoria/[slug] es ISR (revalidate 300) + prebuild, así que esto corre
// en build y en cada revalidación; se refresca al aprobar/editar negocios.
export async function getCategoryListing(categoryId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const where = { status: "ACTIVE" as const, categoryId }

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        phone: true,
        whatsapp: true,
        websiteUrl: true,
        latitude: true,
        longitude: true,
        isVerified: true,
        isFeatured: true,
        municipality: { select: { name: true } },
        neighborhood: { select: { name: true } },
        category: { select: { name: true } },
        memberships: {
          where: { status: "ACTIVE" },
          select: { status: true, plan: { select: { priorityLevel: true } } },
        },
        _count: { select: { reviews: true } },
      },
      orderBy: [{ isVerified: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.profile.count({ where }),
  ])

  const businesses = profiles
    .map((b) => {
      let score = 0
      const active = b.memberships?.find((m) => m.status === "ACTIVE")
      if (active) score += (active.plan.priorityLevel || 0) * 10
      if (b.isVerified) score += 30
      if (b._count.reviews) score += Math.min(b._count.reviews * 2, 20)
      return { ...b, score }
    })
    .sort((a, b) => b.score - a.score)

  return { profiles: businesses, businesses, total, page, totalPages: Math.ceil(total / limit) }
}

export async function searchProfiles(params: {
  q?: string
  category?: string
  municipality?: string
  neighborhood?: string
  lat?: number
  lng?: number
  page?: number
  limit?: number
}) {
  const { q, category, municipality, neighborhood, lat, lng, page = 1, limit = 20 } = params
  const skip = (page - 1) * limit

  const where: any = { status: "ACTIVE" }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }

  if (category) where.categoryId = category
  if (municipality) where.municipalityId = municipality
  if (neighborhood) where.neighborhoodId = neighborhood

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      include: {
        municipality: true,
        neighborhood: true,
        category: true,
        memberships: { include: { plan: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: [
        { isVerified: "desc" },
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
    }),
    prisma.profile.count({ where }),
  ])

  let scored = profiles.map((b) => {
    let score = 0
    const activeMembership = b.memberships?.find((m) => m.status === "ACTIVE")
    if (activeMembership) {
      const planPriority = activeMembership.plan.priorityLevel || 0
      score += planPriority * 10
    }
    if (b.isVerified) score += 30
    if (b._count.reviews) score += Math.min(b._count.reviews * 2, 20)
    return { ...b, score }
  })

  if (lat && lng) {
    scored = scored.map((b) => {
      if (b.latitude && b.longitude) {
        const dist = calculateDistance(lat, lng, b.latitude, b.longitude)
        const proximityScore = Math.max(0, 50 - dist * 2)
        return { ...b, score: b.score + proximityScore, distance: dist }
      }
      return b
    })
  }

  scored.sort((a, b) => b.score - a.score)

  return {
    profiles: scored.slice(0, limit),
    businesses: scored.slice(0, limit),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export const getBusinessByUser = getProfileByUser
export const getBusinessById = getProfileById
export const getBusinessBySlug = getProfileBySlug
export const getFeaturedBusinesses = getFeaturedProfiles
export const searchBusinesses = searchProfiles

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
