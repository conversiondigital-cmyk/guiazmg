import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { redirect } from "next/navigation"
import { BusinessListClient } from "./business-list-client"

export const dynamic = "force-dynamic"

async function getBusinesses(searchParams: Record<string, string | string[] | undefined>) {
  const page = Math.max(1, Number(searchParams.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.limit) || 20))
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined
  const tipo = typeof searchParams.tipo === "string" ? searchParams.tipo : undefined
  const search = typeof searchParams.search === "string" ? searchParams.search.trim() : undefined

  const where: Prisma.ProfileWhereInput = {
    deletedAt: null,
  }

  if (status && status !== "ALL") {
    where.status = status as any
  }

  if (tipo && (tipo === "EMPRENDEDOR" || tipo === "NEGOCIO")) {
    where.profileType = tipo
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { owner: { name: { contains: search, mode: "insensitive" } } },
      { owner: { email: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [businesses, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        category: { select: { id: true, name: true } },
        municipality: { select: { id: true, name: true } },
        memberships: {
          include: { plan: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { reviews: true, images: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.profile.count({ where }),
  ])

  const [pendingCount, activeCount, suspendedCount, emprendedorCount, negocioCount] = await Promise.all([
    prisma.profile.count({ where: { deletedAt: null, status: "PENDING_REVIEW" } }),
    prisma.profile.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.profile.count({ where: { deletedAt: null, status: "SUSPENDED" } }),
    prisma.profile.count({ where: { deletedAt: null, profileType: "EMPRENDEDOR" } }),
    prisma.profile.count({ where: { deletedAt: null, profileType: "NEGOCIO" } }),
  ])

  const totalCount = await prisma.profile.count({ where: { deletedAt: null } })

  return {
    businesses: JSON.parse(JSON.stringify(businesses)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: {
      total: totalCount,
      pending: pendingCount,
      active: activeCount,
      suspended: suspendedCount,
      emprendedor: emprendedorCount,
      negocio: negocioCount,
    },
  }
}

export default async function AdminNegociosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const params = await searchParams
  const { businesses, pagination, stats } = await getBusinesses(params)

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <BusinessListClient
        businesses={businesses}
        stats={stats}
        pagination={pagination}
      />
    </Suspense>
  )
}
