export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Heart, MapPin, Star, ShoppingBag } from "lucide-react"
import { Metadata } from "next"
import { formatCurrency } from "@/lib/utils"
import { conditionLabel, conditionBadge } from "@/lib/marketplace-conditions"
import { ListingFavoriteHeart } from "@/components/marketplace/listing-favorite-heart"

export const metadata: Metadata = { title: "Favoritos" }

export default async function FavoritosPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = (session.user as any).id

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      profile: {
        select: {
          id: true, name: true, slug: true, shortDescription: true,
          logoUrl: true, municipalityId: true,
          municipality: { select: { name: true } },
          _count: { select: { reviews: true } },
        },
      },
      marketplaceListing: {
        select: {
          id: true, title: true, slug: true, price: true, condition: true, status: true, deletedAt: true,
          category: { select: { name: true, slug: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  })

  const businessFavs = favorites.filter((f) => f.profile)
  const mktFavs = favorites.filter((f) => f.marketplaceListing && !f.marketplaceListing.deletedAt)
  const totalCount = businessFavs.length + mktFavs.length

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
          <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
          Favoritos
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">{totalCount} guardados</p>
      </div>

      {totalCount === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <Heart className="mx-auto mb-3 h-12 w-12 text-gray-200" />
          <p className="font-semibold text-gray-700">Aún no tienes favoritos</p>
          <p className="mt-1 text-sm text-gray-400">
            Guarda negocios y publicaciones del marketplace para encontrarlos fácilmente.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/search" className="inline-flex rounded-xl bg-green-800 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-900">
              Explorar negocios
            </Link>
            <Link href="/marketplace" className="inline-flex rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50">
              Explorar marketplace
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Negocios guardados */}
          {businessFavs.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-gray-500">
                <Star className="h-4 w-4" /> Negocios ({businessFavs.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {businessFavs.map(({ profile: b, id }) =>
                  b == null ? null : (
                    <Link key={id} href={`/negocio/${b.slug}`} className="group flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-green-200 hover:shadow-md">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                        {b.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.logoUrl} alt={b.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xl font-black text-gray-300">{b.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-bold text-gray-900 group-hover:text-green-800">{b.name}</p>
                        {b.shortDescription && <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{b.shortDescription}</p>}
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                          {b.municipality && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{b.municipality.name}</span>}
                          <span className="flex items-center gap-0.5"><Star className="h-3 w-3" />{b._count.reviews} reseñas</span>
                        </div>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            </section>
          )}

          {/* Publicaciones del marketplace guardadas */}
          {mktFavs.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-gray-500">
                <ShoppingBag className="h-4 w-4" /> Marketplace ({mktFavs.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mktFavs.map(({ marketplaceListing: l, id }) =>
                  l == null ? null : (
                    <div key={id} className="relative">
                      <ListingFavoriteHeart listingId={l.id} isAuthed initialFavorited className="absolute right-2 top-2 z-20" />
                      <Link href={`/marketplace/${l.category.slug}/${l.slug}`} className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:border-green-200 hover:shadow-md">
                        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                          {l.condition && (
                            <span className={`absolute bottom-2 left-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow ${conditionBadge(l.condition)}`}>
                              {conditionLabel(l.condition)}
                            </span>
                          )}
                          {l.status !== "ACTIVE" && (
                            <span className="absolute left-2 top-2 z-10 rounded-full bg-gray-800/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                              No disponible
                            </span>
                          )}
                          {l.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={l.images[0].url} alt={l.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-4xl text-gray-300">📸</div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="mb-1 text-xs text-gray-400">{l.category.name}</p>
                          <h3 className="truncate font-semibold text-gray-900">{l.title}</h3>
                          {l.price && <p className="mt-1 text-lg font-bold text-blue-600">{formatCurrency(Number(l.price))}</p>}
                        </div>
                      </Link>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
