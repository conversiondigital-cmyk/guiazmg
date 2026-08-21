export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Heart } from "@/lib/icons"
import { cn, formatCurrency } from "@/lib/utils"
import { conditionLabel, conditionBadge } from "@/lib/marketplace-conditions"
import { ListingFavoriteHeart } from "@/components/marketplace/listing-favorite-heart"

export default async function GuardadosPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const favs = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
      marketplaceListingId: { not: null },
      marketplaceListing: { deletedAt: null },
    },
    orderBy: { createdAt: "desc" },
    include: {
      marketplaceListing: {
        include: {
          category: { select: { name: true, slug: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  })
  const listings = favs
    .map((f) => f.marketplaceListing)
    .filter(Boolean) as NonNullable<(typeof favs)[number]["marketplaceListing"]>[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Heart className="h-5 w-5 fill-red-500 text-red-500" /> Guardados
          </h1>
          <p className="text-gray-500">Publicaciones del marketplace que guardaste</p>
        </div>
        <Link href="/marketplace" className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}>
          Explorar marketplace
        </Link>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <Heart className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Aún no tienes guardados</h3>
            <p className="mt-2 text-sm text-gray-500">
              Toca el corazón en cualquier publicación del marketplace para guardarla aquí.
            </p>
            <Link href="/marketplace" className={cn(buttonVariants(), "mt-4")}>
              Explorar marketplace
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((l) => {
            const thumb = l.images[0]
            return (
              <div key={l.id} className="relative">
                <ListingFavoriteHeart
                  listingId={l.id}
                  isAuthed
                  initialFavorited
                  className="absolute right-2 top-2 z-20"
                />
                <Link href={`/marketplace/${l.category.slug}/${l.slug}`}>
                  <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
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
                      {thumb ? (
                        <div className="relative h-full w-full">
                          <Image src={thumb.url} alt={l.title} fill className="object-cover transition-transform group-hover:scale-105" />
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl text-gray-300">📸</div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="mb-1 text-xs text-gray-400">{l.category.name}</p>
                      <h3 className="truncate font-semibold text-gray-900">{l.title}</h3>
                      {l.price && (
                        <p className="mt-1 text-lg font-bold text-blue-600">{formatCurrency(Number(l.price))}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
