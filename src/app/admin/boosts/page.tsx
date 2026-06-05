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

  const boosts = await prisma.boost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      business: { select: { id: true, name: true, slug: true } },
      listing: { select: { id: true, title: true } },
    },
  })

  const [activeCount, expiredCount, cancelledCount, totalCount] = await Promise.all([
    prisma.boost.count({ where: { status: "ACTIVE" } }),
    prisma.boost.count({ where: { status: "EXPIRED" } }),
    prisma.boost.count({ where: { status: "CANCELLED" } }),
    prisma.boost.count(),
  ])

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <BoostsClient
        boosts={JSON.parse(JSON.stringify(boosts))}
        stats={{
          active: activeCount,
          expired: expiredCount,
          cancelled: cancelledCount,
          total: totalCount,
        }}
      />
    </Suspense>
  )
}
