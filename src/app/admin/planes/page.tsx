import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminCRUDClient } from "../admin-crud-client"

export const dynamic = "force-dynamic"

export default async function AdminPlanesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const plans = await prisma.membershipPlan.findMany({
    orderBy: { priorityLevel: "asc" },
  })

  return (
    <AdminCRUDClient
      title="Membresías / Planes"
      description="Gestiona los planes de membresía de la plataforma"
      apiBase="/api/admin/planes"
      items={JSON.parse(JSON.stringify(plans))}
      columns={[
        { key: "name", label: "Nombre" },
        { key: "monthlyPrice", label: "Precio" },
        { key: "maxListings", label: "Máx. Anuncios" },
        { key: "priorityLevel", label: "Prioridad" },
      ]}
      formFields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug", required: true },
        { name: "monthlyPrice", label: "Precio Mensual", type: "number" },
        { name: "maxListings", label: "Máximo Anuncios", type: "number" },
        { name: "priorityLevel", label: "Nivel Prioridad", type: "number" },
      ]}
      statCards={[{ label: "Total", value: plans.length }]}
    />
  )
}
