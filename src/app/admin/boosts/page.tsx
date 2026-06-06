import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { BoostsClient } from "./boosts-client"

export const dynamic = "force-dynamic"

export default async function AdminBoostsPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    redirect("/auth/login")
  }

  // Evita include relacional (falla por mismatch de nombre de columna FK en DB).
  // Hacemos las lookups por separado usando los IDs.
  const boostsRaw = await prisma.boost.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const businessIds = [...new Set(boostsRaw.map((b) => b.businessId).filter(Boolean))]
  const listingIds  = [...new Set(boostsRaw.map((b) => b.listingId).filter((id): id is string => !!id))]

  const [businesses, listings, activeCount, expiredCount, cancelledCount, totalCount] =
    await Promise.all([
      businessIds.length > 0
        ? prisma.business.findMany({
            where: { id: { in: businessIds } },
            select: { id: true, name: true, slug: true },
          })
        : [],
      listingIds.length > 0
        ? prisma.listing.findMany({
            where: { id: { in: listingIds } },
            select: { id: true, title: true },
          })
        : [],
      prisma.boost.count({ where: { status: "ACTIVE" } }),
      prisma.boost.count({ where: { status: "EXPIRED" } }),
      prisma.boost.count({ where: { status: "CANCELLED" } }),
      prisma.boost.count(),
    ])

  const bizMap = Object.fromEntries(businesses.map((b) => [b.id, b]))
  const listMap = Object.fromEntries(listings.map((l) => [l.id, l]))

  const boosts = boostsRaw.map((boost) => ({
    ...boost,
    business: bizMap[boost.businessId] ?? null,
    listing:  boost.listingId ? (listMap[boost.listingId] ?? null) : null,
  }))

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <BoostsClient
        boosts={JSON.parse(JSON.stringify(boosts))}
        stats={{ active: activeCount, expired: expiredCount, cancelled: cancelledCount, total: totalCount }}
      />
    </Suspense>
  )
}
