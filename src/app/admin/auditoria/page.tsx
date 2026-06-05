import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { AuditoriaClient } from "./auditoria-client"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminAuditoriaPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const limit = 50

  const userId = typeof params.userId === "string" ? params.userId : ""
  const entityType = typeof params.entityType === "string" ? params.entityType : ""
  const action = typeof params.action === "string" ? params.action : ""
  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : ""
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : ""
  const search = typeof params.search === "string" ? params.search.trim() : ""

  const where: Prisma.AuditLogWhereInput = {}
  if (userId) where.actorUserId = userId
  if (entityType) where.entityType = { contains: entityType, mode: "insensitive" }
  if (action) where.action = { contains: action, mode: "insensitive" }
  if (search) where.entityId = { contains: search, mode: "insensitive" }
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  const [logs, total, users] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "EDITOR", "SALES_AGENT"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ])

  const logsData = logs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }))

  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <AuditoriaClient
        logs={logsData}
        users={users}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        filters={{ userId, entityType, action, dateFrom, dateTo, search }}
      />
    </Suspense>
  )
}
