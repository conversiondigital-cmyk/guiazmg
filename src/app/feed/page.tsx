export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { Store, MessageCircle } from "@/lib/icons"
import { timeAgo } from "@/lib/utils"

export default async function FeedPage() {
  const [listings, requests] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      include: {
        category: { select: { name: true, slug: true } },
        user: { select: { name: true, image: true } },
        images: { take: 1, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.serviceRequest.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const items: Array<{
    id: string
    type: "listing" | "request"
    title: string
    description?: string
    userName?: string
    categoryName: string
    createdAt: Date
    image?: string
    slug: string
  }> = [
    ...listings.map((l) => ({
      id: l.id,
      type: "listing" as const,
      title: l.title,
      description: l.description || undefined,
      userName: l.user.name || "Usuario",
      categoryName: l.category.name,
      createdAt: l.createdAt,
      image: l.images[0]?.url,
      slug: `${l.category.slug}/${l.slug}`,
    })),
    ...requests.map((r) => ({
      id: r.id,
      type: "request" as const,
      title: r.title,
      description: r.description || undefined,
      userName: r.user.name || "Anónimo",
      categoryName: r.category?.name || "General",
      createdAt: r.createdAt,
      image: undefined,
      slug: "",
    })),
  ]

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Feed Local</h1>
          <p className="text-gray-500 mb-6">Actividad reciente en la comunidad ZMG</p>

          <div className="space-y-3">
            {items.slice(0, 50).map((item) => (
              <Card key={`${item.type}-${item.id}`} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.image ? (
                      <div className="relative h-16 w-16 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                        <Image src={item.image} alt="" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-400">
                        {item.type === "listing" ? <Store className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">{item.categoryName}</span>
                        <span>{item.type === "listing" ? "Venta" : "Solicitud"}</span>
                      </div>
                      <p className="mt-1 font-medium text-gray-900 truncate">{item.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                        <span>{item.userName}</span>
                        <span>{timeAgo(new Date(item.createdAt))}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {items.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
                <p className="text-gray-400 text-lg">No hay actividad reciente</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
