export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { Search, Plus, MapPin } from "@/lib/icons"
import { formatCurrency } from "@/lib/utils"

const CATEGORY_ICONS: Record<string, string> = {
  PRODUCTOS: "📦",
  SERVICIOS: "🔧",
  EMPLEOS: "💼",
  MASCOTAS: "🐾",
  VEHICULOS: "🚗",
  INMUEBLES: "🏠",
  EVENTOS: "🎉",
  COMIDA: "🍕",
  CLASES: "📚",
  COMUNIDAD: "👥",
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q : ""
  const category = typeof params.categoria === "string" ? params.categoria : ""
  const municipio = typeof params.municipio === "string" ? params.municipio : ""
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1"))
  const limit = 20

  const categories = await prisma.marketplaceCategory.findMany({
    where: { isActive: true, parentId: null },
    include: { _count: { select: { listings: { where: { status: "ACTIVE", deletedAt: null } } } } },
    orderBy: { sortOrder: "asc" },
  })

  const where: any = { status: "ACTIVE", deletedAt: null }
  if (q) where.title = { contains: q, mode: "insensitive" }
  if (category) where.category = { slug: category }
  if (municipio) where.municipalityId = municipio

  const [listings, total] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true, icon: true } },
        user: { select: { name: true, image: true } },
        municipality: { select: { name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        _count: { select: { favorites: true } },
      },
      // Las publicaciones destacadas (boost vigente) aparecen primero.
      orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceListing.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
              <p className="mt-1 text-gray-500">Compra, vende y encuentra servicios en tu zona</p>
            </div>
            <Link href="/marketplace/nuevo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Publicar
              </Button>
            </Link>
          </div>

          {/* Search */}
          <form className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Buscar en marketplace..."
                className="pl-10 h-12 text-base"
              />
            </div>
          </form>

          {/* Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3 mb-8">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/marketplace?categoria=${cat.slug}`}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all hover:shadow-md ${
                  category === cat.slug ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-2xl">{CATEGORY_ICONS[cat.slug.toUpperCase()] || cat.icon || "📌"}</span>
                <span className="text-xs font-medium text-gray-700">{cat.name}</span>
                <span className="text-[10px] text-gray-400">{cat._count.listings}</span>
              </Link>
            ))}
          </div>

          {/* Active filters & results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{total} publicaciones encontradas</p>
          </div>

          {/* Listing Grid */}
          {listings.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
              <p className="text-gray-400 text-lg">No hay publicaciones aún</p>
              <p className="text-gray-400 text-sm mt-1">Sé el primero en publicar</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => {
                const thumb = listing.images[0]
                return (
                  <Link key={listing.id} href={`/marketplace/${listing.category.slug}/${listing.slug}`}>
                    <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                        {listing.isBoosted && (
                          <span className="absolute left-2 top-2 z-10 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                            Destacado
                          </span>
                        )}
                        {thumb ? (
                          <div className="relative h-full w-full">
                            <Image src={thumb.url} alt={listing.title} fill className="object-cover transition-transform group-hover:scale-105" />
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-300 text-4xl">
                            📸
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <p className="text-xs text-gray-400 mb-1">{listing.category.name}</p>
                        <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                        {listing.price && (
                          <p className="mt-1 text-lg font-bold text-blue-600">
                            {formatCurrency(Number(listing.price))}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {listing.municipality?.name || listing.neighborhood || "ZMG"}
                          </span>
                          <span>{listing.user.name || "Anónimo"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
                const p = i + 1
                return (
                  <Link
                    key={p}
                    href={`/marketplace?page=${p}${category ? `&categoria=${category}` : ""}${q ? `&q=${q}` : ""}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100 border"
                    }`}
                  >
                    {p}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
