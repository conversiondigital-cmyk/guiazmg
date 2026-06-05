import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { NeighborhoodsClient } from "./neighborhoods-client"

export const dynamic = "force-dynamic"

async function getNeighborhoods(searchParams: Record<string, string | string[] | undefined>) {
  const municipalityId = typeof searchParams.municipalityId === "string" ? searchParams.municipalityId : undefined
  const search = typeof searchParams.search === "string" ? searchParams.search.trim() : undefined

  const where: Record<string, unknown> = {}
  if (municipalityId) where.municipalityId = municipalityId
  if (search) where.name = { contains: search, mode: "insensitive" }

  const [neighborhoods, municipalities] = await Promise.all([
    prisma.neighborhood.findMany({
      where,
      include: {
        municipality: { select: { id: true, name: true } },
        _count: { select: { businesses: true } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.municipality.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return {
    neighborhoods: JSON.parse(JSON.stringify(neighborhoods)),
    municipalities: JSON.parse(JSON.stringify(municipalities)),
  }
}

export default async function AdminColoniasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const params = await searchParams
  const { neighborhoods, municipalities } = await getNeighborhoods(params)

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <NeighborhoodsClient neighborhoods={neighborhoods} municipalities={municipalities} />
    </Suspense>
  )
}
