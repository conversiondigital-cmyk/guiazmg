export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"
import { auth } from "@/lib/auth"
import { Search, Plus, MapPin } from "@/lib/icons"
import { formatCurrency } from "@/lib/utils"
import { conditionLabel, conditionBadge, LISTING_CONDITIONS } from "@/lib/marketplace-conditions"
import { ListingFavoriteHeart } from "@/components/marketplace/listing-favorite-heart"

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

// Categorías + conteos: estables (cambian lento) y se consultan en CADA carga del
// marketplace → cacheadas 5 min para no golpear la BD por visita.
const getMarketplaceCategoriesAndCounts = unstable_cache(
  async () => {
    const categories = await prisma.marketplaceCategory.findMany({
      where: { isActive: true, parentId: null },
      include: { children: { select: { id: true } } },
      orderBy: { sortOrder: "asc" },
    })
    const listingCounts = await prisma.marketplaceListing.groupBy({
      by: ["categoryId"],
      where: { status: "ACTIVE", deletedAt: null },
      _count: true,
    })
    return { categories, listingCounts }
  },
  ["marketplace-cats-counts"],
  { revalidate: 300, tags: ["marketplace"] }
)

interface MarketplaceListFilters {
  q: string; category: string; subcategoria: string; municipio: string
  sort: string; condicion: string; tipo: string
  minPrice?: number; maxPrice?: number; page: number; limit: number
}

// Listado filtrado: la llave de caché incluye TODOS los filtros (los args), así que
// cada combinación devuelve su resultado correcto. TTL corto (2 min); se invalida al
// crear/editar una publicación con revalidateTag("marketplace").
const getMarketplaceListings = unstable_cache(
  async (f: MarketplaceListFilters) => {
    const where: any = { status: "ACTIVE", deletedAt: null }
    if (f.q) where.title = { contains: f.q, mode: "insensitive" }
    if (f.subcategoria) {
      where.category = { slug: f.subcategoria }
    } else if (f.category) {
      where.category = { OR: [{ slug: f.category }, { parent: { slug: f.category } }] }
    }
    if (f.municipio) where.municipalityId = f.municipio
    if (f.condicion) where.condition = f.condicion
    if (f.tipo) where.type = f.tipo
    if (f.minPrice != null) where.price = { ...(where.price || {}), gte: f.minPrice }
    if (f.maxPrice != null) where.price = { ...(where.price || {}), lte: f.maxPrice }

    const orderBy: any =
      f.sort === "precio_asc"
        ? { price: "asc" }
        : f.sort === "precio_desc"
          ? { price: "desc" }
          : [{ isBoosted: "desc" }, { createdAt: "desc" }]

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
        orderBy,
        skip: (f.page - 1) * f.limit,
        take: f.limit,
      }),
      prisma.marketplaceListing.count({ where }),
    ])
    return { listings, total }
  },
  ["marketplace-listings"],
  { revalidate: 120, tags: ["marketplace"] }
)

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q : ""
  const category = typeof params.categoria === "string" ? params.categoria : ""
  const subcategoria = typeof params.subcategoria === "string" ? params.subcategoria : ""
  const municipio = typeof params.municipio === "string" ? params.municipio : ""
  const sort = typeof params.sort === "string" ? params.sort : "recientes"
  const condicion = typeof params.condicion === "string" ? params.condicion : ""
  const tipo = typeof params.tipo === "string" ? params.tipo : ""
  const minStr = typeof params.min === "string" ? params.min : ""
  const maxStr = typeof params.max === "string" ? params.max : ""
  const minPrice = minStr !== "" && !Number.isNaN(Number(minStr)) ? Number(minStr) : undefined
  const maxPrice = maxStr !== "" && !Number.isNaN(Number(maxStr)) ? Number(maxStr) : undefined
  const hasFilters = Boolean(q || category || subcategoria || municipio || condicion || tipo || minPrice != null || maxPrice != null)
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1"))
  const limit = 20

  const session = await auth()
  const isAuthed = !!session?.user

  const { categories, listingCounts } = await getMarketplaceCategoriesAndCounts()
  const countByCat = new Map(listingCounts.map((c) => [c.categoryId, c._count]))
  const catTotal = (c: (typeof categories)[number]) =>
    (countByCat.get(c.id) ?? 0) + c.children.reduce((s, ch) => s + (countByCat.get(ch.id) ?? 0), 0)

  const { listings, total } = await getMarketplaceListings({
    q, category, subcategoria, municipio, sort, condicion, tipo, minPrice, maxPrice, page, limit,
  })

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

          {/* Búsqueda + filtros */}
          <form method="get" className="mb-8 space-y-3">
            {/* Preserva la categoría/zona seleccionada al filtrar */}
            {category && <input type="hidden" name="categoria" value={category} />}
            {subcategoria && <input type="hidden" name="subcategoria" value={subcategoria} />}
            {municipio && <input type="hidden" name="municipio" value={municipio} />}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Buscar en marketplace..."
                className="pl-10 h-12 text-base"
              />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs">
                <span className="mb-1 block font-medium text-gray-600">Ordenar</span>
                <select name="sort" defaultValue={sort} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700">
                  <option value="recientes">Más recientes</option>
                  <option value="precio_asc">Precio: menor a mayor</option>
                  <option value="precio_desc">Precio: mayor a menor</option>
                </select>
              </label>
              <label className="text-xs">
                <span className="mb-1 block font-medium text-gray-600">Condición</span>
                <select name="condicion" defaultValue={condicion} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700">
                  <option value="">Todas</option>
                  {LISTING_CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                <span className="mb-1 block font-medium text-gray-600">Tipo</span>
                <select name="tipo" defaultValue={tipo} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700">
                  <option value="">Todos</option>
                  <option value="SALE">Venta</option>
                  <option value="SERVICE">Servicio</option>
                  <option value="TRADE">Intercambio</option>
                  <option value="REQUEST">Solicitud</option>
                </select>
              </label>
              <label className="text-xs">
                <span className="mb-1 block font-medium text-gray-600">Precio (MXN)</span>
                <div className="flex items-center gap-1">
                  <input name="min" type="number" min="0" defaultValue={minStr} placeholder="Mín" className="h-9 w-20 rounded-lg border border-gray-200 px-2 text-sm" />
                  <span className="text-gray-400">–</span>
                  <input name="max" type="number" min="0" defaultValue={maxStr} placeholder="Máx" className="h-9 w-20 rounded-lg border border-gray-200 px-2 text-sm" />
                </div>
              </label>
              <Button type="submit" className="h-9">Filtrar</Button>
              {hasFilters && (
                <Link href="/marketplace" className="inline-flex h-9 items-center px-3 text-sm text-gray-500 hover:text-gray-700">
                  Limpiar
                </Link>
              )}
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
                <span className="text-[10px] text-gray-400">{catTotal(cat)}</span>
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
                  <div key={listing.id} className="relative">
                    <ListingFavoriteHeart listingId={listing.id} isAuthed={isAuthed} className="absolute right-2 top-2 z-20" />
                    <Link href={`/marketplace/${listing.category.slug}/${listing.slug}`}>
                    <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                        {listing.isBoosted && (
                          <span className="absolute left-2 top-2 z-10 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-amber-950 shadow">
                            Destacado
                          </span>
                        )}
                        {listing.condition && (
                          <span className={`absolute left-2 bottom-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow ${conditionBadge(listing.condition)}`}>
                            {conditionLabel(listing.condition)}
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
                  </div>
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
