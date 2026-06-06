import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminCRUDClient } from "../admin-crud-client"

export const dynamic = "force-dynamic"

export default async function AdminBoostsPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    redirect("/auth/login")
  }

  const boosts = await prisma.boost.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const [activeCount, expiredCount] = await Promise.all([
    prisma.boost.count({ where: { status: "ACTIVE" } }),
    prisma.boost.count({ where: { status: "EXPIRED" } }),
  ])

  return (
    <AdminCRUDClient
      title="Boosts"
      description="Gestiona los boosts de visibilidad"
      apiBase="/api/admin/boosts"
      items={JSON.parse(JSON.stringify(boosts))}
      columns={[
        { key: "status", label: "Estado" },
        { key: "createdAt", label: "Fecha Creación" },
      ]}
      formFields={[
        { name: "status", label: "Estado", required: true },
      ]}
      statCards={[
        { label: "Total", value: boosts.length },
        { label: "Activos", value: activeCount },
        { label: "Expirados", value: expiredCount },
      ]}
    />
  )
}
