export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { Plus, MapPin, Eye } from "@/lib/icons"
import { formatCurrency } from "@/lib/utils"

export default async function VentasDeCocheraPage() {
  const listings = await prisma.marketplaceListing.findMany({
    where: { type: "SALE", status: "ACTIVE", deletedAt: null },
    include: {
      category: { select: { name: true, slug: true } },
      user: { select: { name: true, image: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ventas de Cochera</h1>
              <p className="mt-1 text-gray-500">Artículos usados y liquidaciones en tu colonia</p>
            </div>
            <Link href="/marketplace/nuevo?type=SALE">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Publicar venta
              </Button>
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
              <p className="text-gray-400 text-lg">No hay ventas de cochera activas</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => {
                const thumb = listing.images[0]
                return (
                  <Link key={listing.id} href={`/marketplace/${listing.category.slug}/${listing.slug}`}>
                    <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        {thumb ? (
                          <div className="relative h-full w-full">
                            <Image src={thumb.url} alt={listing.title} fill className="object-cover transition-transform group-hover:scale-105" />
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-300 text-4xl">📦</div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <p className="text-xs text-gray-400 mb-1">{listing.category.name}</p>
                        <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                        {listing.price && (
                          <p className="mt-1 text-lg font-bold text-blue-600">{formatCurrency(Number(listing.price))}</p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {listing.neighborhood || "ZMG"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {listing.views}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
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
