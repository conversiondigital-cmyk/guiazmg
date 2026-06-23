import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { getMapBusinesses, getCategories } from "@/lib/queries"
import { getGoogleMapsApiKey } from "@/lib/maps-config"
import { InteractiveMap, type MapPoint, type MapCategory } from "@/components/map/interactive-map"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Mapa Interactivo",
  description:
    "Explora negocios, servicios y lugares de la Zona Metropolitana de Guadalajara en un mapa interactivo.",
}

export default async function MapaPage() {
  let apiKey = ""
  let businesses: Awaited<ReturnType<typeof getMapBusinesses>> = []
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  try {
    ;[apiKey, businesses, categories] = await Promise.all([
      getGoogleMapsApiKey(),
      getMapBusinesses(),
      getCategories(),
    ])
  } catch {
    // BD/clave no disponible — el componente muestra el estado vacío.
  }

  const points: MapPoint[] = businesses
    .filter((b) => b.latitude != null && b.longitude != null)
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      lat: b.latitude as number,
      lng: b.longitude as number,
      image: b.coverImageUrl || b.logoUrl || null,
      rating: b.googleRating ?? null,
      categoryName: b.category?.name ?? "",
      categorySlug: b.category?.slug ?? "",
      icon: b.category?.icon || "📍",
      location: [b.neighborhood?.name, b.municipality?.name].filter(Boolean).join(", "),
      featured: b.isFeatured,
    }))

  const cats: MapCategory[] = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon || "📍",
  }))

  return (
    <>
      <Header />
      <main className="flex-1">
        <InteractiveMap apiKey={apiKey} points={points} categories={cats} />
      </main>
      <Footer />
    </>
  )
}
