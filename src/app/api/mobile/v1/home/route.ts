// Pantalla de inicio de la app en UN solo round-trip (destacados + categorías +
// anuncios recientes de marketplace + zonas), equivalente a lo que hoy arma
// `src/app/page.tsx` con 4 componentes server independientes.
//
// Tolerante a BD caída: cada sección se resuelve por separado (no un solo
// Promise.all que tumbe TODO si una consulta falla) y responde 200 con las
// secciones que sí sirvieron vacías, igual que hace la home web hoy.
export const dynamic = "force-dynamic"

import { getCategories, getFeaturedProfiles } from "@/lib/queries"
import { prisma } from "@/lib/prisma"
import { ok } from "@/lib/api/mobile/respond"
import { toBusinessCard, toListingCard, type BusinessCard, type ListingCard } from "@/lib/api/mobile/serializers"

interface Zone {
  name: string
  slug: string
  municipality: { name: string; slug: string }
}

async function safeFeatured(): Promise<BusinessCard[]> {
  try {
    const profiles = await getFeaturedProfiles(10)
    // `getFeaturedProfiles` trae `_count.reviews` (cacheada y compartida con la
    // web); el serializer espera `reviewCount` plano, así que se aplana aquí en
    // vez de tocar la query compartida.
    return profiles.map((p) =>
      toBusinessCard({ ...p, reviewCount: p._count?.reviews ?? 0 } as unknown as Parameters<typeof toBusinessCard>[0])
    )
  } catch (error) {
    console.error("[mobile/home] featured", error instanceof Error ? error.message : error)
    return []
  }
}

async function safeCategories() {
  try {
    const categories = await getCategories()
    return categories.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon ?? null }))
  } catch (error) {
    console.error("[mobile/home] categories", error instanceof Error ? error.message : error)
    return []
  }
}

async function safeRecentListings(): Promise<ListingCard[]> {
  try {
    const listings = await prisma.marketplaceListing.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
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
    })
    return listings.map((l) => toListingCard(l))
  } catch (error) {
    console.error("[mobile/home] recentListings", error instanceof Error ? error.message : error)
    return []
  }
}

async function safeZones(): Promise<Zone[]> {
  try {
    return await prisma.zone.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
      take: 12,
      select: { name: true, slug: true, municipality: { select: { name: true, slug: true } } },
    })
  } catch (error) {
    console.error("[mobile/home] zones", error instanceof Error ? error.message : error)
    return []
  }
}

export async function GET() {
  const [featured, categories, recentListings, zones] = await Promise.all([
    safeFeatured(),
    safeCategories(),
    safeRecentListings(),
    safeZones(),
  ])

  return ok({ featured, categories, recentListings, zones })
}
