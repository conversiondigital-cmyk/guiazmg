import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { redirect } from "next/navigation"
import { MarketplaceListClient } from "./marketplace-list-client"

export const dynamic = "force-dynamic"

const SPAM_KEYWORDS = [
  "gratis", "free", "gana dinero", "trabajo desde casa", "inversión sin riesgo",
  "haz clic", "click here", "oferta limitada", "100% garantizado",
  "sin esfuerzo", "hazte rico", "premio", "sorteo", "casino",
  "hereda", "heredero", "millones", "dinero fácil", "inversión",
]

async function getMarketplaceListings(searchParams: Record<string, string | string[] | undefined>) {
  const page = Math.max(1, Number(searchParams.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.limit) || 20))
  const tipo = typeof searchParams.tipo === "string" ? searchParams.tipo : undefined
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined
  const search = typeof searchParams.search === "string" ? searchParams.search.trim() : undefined

  const where: Prisma.MarketplaceListingWhereInput = {}

  if (tipo && tipo !== "todos") {
    if (tipo === "comunidad") {
      where.type = { in: ["TRADE", "PURCHASE"] }
    } else if (["productos", "servicios", "solicitudes", "eventos", "promocion"].includes(tipo)) {
      const typeMap: Record<string, string> = {
        productos: "SALE",
        servicios: "SERVICE",
        solicitudes: "REQUEST",
        eventos: "EVENT",
        promocion: "PROMOTION",
      }
      where.type = typeMap[tipo] as any
    }
  }

  if (status && status !== "todos") {
    const statusMap: Record<string, string> = {
      activos: "ACTIVE",
      pendientes: "ACTIVE",
      ocultos: "HIDDEN",
      suspendidos: "HIDDEN",
      eliminados: "DELETED",
    }
    where.status = statusMap[status] as any
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  const [listings, total] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: { select: { id: true, url: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceListing.count({ where }),
  ])

  const enhancedListings = listings.map((listing) => ({
    ...listing,
    price: listing.price ? Number(listing.price) : null,
    isSpam: SPAM_KEYWORDS.some(
      (keyword) =>
        listing.title.toLowerCase().includes(keyword) ||
        (listing.description?.toLowerCase() || "").includes(keyword)
    ),
  }))

  const [totalCount, activeCount, hiddenCount, deletedCount] = await Promise.all([
    prisma.marketplaceListing.count(),
    prisma.marketplaceListing.count({ where: { status: "ACTIVE" } }),
    prisma.marketplaceListing.count({ where: { status: "HIDDEN" } }),
    prisma.marketplaceListing.count({ where: { status: "DELETED" } }),
  ])

  return {
    listings: JSON.parse(JSON.stringify(enhancedListings)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: { total: totalCount, active: activeCount, hidden: hiddenCount, deleted: deletedCount },
  }
}

export default async function AdminMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const params = await searchParams
  const { listings, pagination, stats } = await getMarketplaceListings(params)

  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Cargando...</div>}>
      <MarketplaceListClient
        listings={listings}
        stats={stats}
        pagination={pagination}
        currentTipo={typeof params.tipo === "string" ? params.tipo : "todos"}
        currentStatus={typeof params.status === "string" ? params.status : "todos"}
        currentSearch={typeof params.search === "string" ? params.search : ""}
      />
    </Suspense>
  )
}
