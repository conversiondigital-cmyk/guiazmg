export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { Star, Calendar, Store, MessageCircle } from "@/lib/icons"
import { formatCurrency, timeAgo } from "@/lib/utils"

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function SellerMarketplaceProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      email: true,
      createdAt: true,
    },
  })
  if (!user) notFound()

  const [listings, requests, reviews] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where: { userId: id, status: "ACTIVE", deletedAt: null },
      include: {
        category: { select: { name: true, slug: true } },
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        _count: { select: { favorites: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.serviceRequest.findMany({
      where: { userId: id, status: "ACTIVE" },
      include: { category: { select: { name: true, icon: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.sellerReview.findMany({
      where: { sellerId: id },
      include: {
        reviewer: { select: { name: true, image: true } },
        listing: { select: { title: true, slug: true, category: { select: { slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600 shrink-0">
                  {user.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name || "Usuario"}</h1>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Miembro desde {new Date(user.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long" })}
                    </span>
                    {avgRating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {avgRating.toFixed(1)} ({reviews.length} reseñas)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Listings */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Publicaciones ({listings.length})
                </h2>
                {listings.length === 0 ? (
                  <p className="text-gray-400 text-sm">Sin publicaciones activas</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {listings.map((listing) => (
                      <Link key={listing.id} href={`/marketplace/${listing.category.slug}/${listing.slug}`}>
                        <Card className="group overflow-hidden transition-all hover:shadow-md">
                          <div className="aspect-[4/3] bg-gray-100">
                            {listing.images[0] ? (
                              <div className="relative h-full w-full">
                                <Image src={listing.images[0].url} alt={listing.title} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="flex h-full items-center justify-center text-gray-300 text-3xl">📸</div>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <p className="text-xs text-gray-400">{listing.category.name}</p>
                            <h3 className="text-sm font-medium truncate">{listing.title}</h3>
                            <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                              {listing.price && <span className="font-bold text-blue-600">{formatCurrency(Number(listing.price))}</span>}
                              <span>{listing._count.favorites} ❤️</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Service requests */}
              {requests.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Solicitudes
                  </h2>
                  <div className="space-y-3">
                    {requests.map((req) => (
                      <Card key={req.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-xs mb-1">
                            {req.category && (
                              <Badge variant="outline" className="text-xs">
                                {req.category.icon && <span className="mr-1">{req.category.icon}</span>}
                                {req.category.name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900">{req.title}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews sidebar */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Reseñas ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin reseñas todavía</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{review.reviewer.name || "Anónimo"}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                        {review.listing && (
                        <Link href={`/marketplace/${review.listing.category.slug}/${review.listing.slug}`} className="mt-2 block text-xs text-blue-600 hover:underline">
                          {review.listing.title}
                        </Link>
                        )}
                        <p className="mt-1 text-xs text-gray-400">{timeAgo(new Date(review.createdAt))}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
