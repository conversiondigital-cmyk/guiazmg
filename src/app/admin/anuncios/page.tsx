import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { redirect } from "next/navigation"
import { ListingsListClient } from "./listings-list-client"

export const dynamic = "force-dynamic"

async function getListings(searchParams: Record<string, string | string[] | undefined>) {
  const page = Math.max(1, Number(searchParams.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.limit) || 20))
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined
  const search = typeof searchParams.search === "string" ? searchParams.search.trim() : undefined

  const where: Prisma.ListingWhereInput = {
    deletedAt: null,
  }

  if (status && status !== "todos") {
    const statusMap: Record<string, string> = {
      activos: "ACTIVE",
      pendientes: "PENDING_REVIEW",
      pausados: "DRAFT",
      archivados: "ARCHIVED",
    }
    where.status = statusMap[status] as any
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { business: { name: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        business: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        images: { select: { id: true, imageUrl: true }, take: 1 },
        boosts: {
          where: { status: "ACTIVE" },
          select: { id: true, endsAt: true },
          take: 1,
        },
        _count: { select: { leads: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ])

  const enhancedListings = listings.map((listing) => ({
    ...listing,
    price: listing.price ? Number(listing.price) : null,
  }))

  const [totalCount, activeCount, pendingCount, expiredCount] = await Promise.all([
    prisma.listing.count({ where: { deletedAt: null } }),
    prisma.listing.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.listing.count({ where: { deletedAt: null, status: "PENDING_REVIEW" } }),
    prisma.listing.count({ where: { deletedAt: null, status: "EXPIRED" } }),
  ])

  return {
    listings: JSON.parse(JSON.stringify(enhancedListings)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: { total: totalCount, active: activeCount, pending: pendingCount, expired: expiredCount },
  }
}

export default async function AdminAnunciosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role ?? "")) {
    redirect("/auth/login")
  }

  const params = await searchParams
  const { listings, pagination, stats } = await getListings(params)

  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Cargando...</div>}>
      <ListingsListClient
        listings={listings}
        stats={stats}
        pagination={pagination}
        currentStatus={typeof params.status === "string" ? params.status : "todos"}
        currentSearch={typeof params.search === "string" ? params.search : ""}
      />
    </Suspense>
  )
}
