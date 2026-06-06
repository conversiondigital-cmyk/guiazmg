import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminCRUDClient } from "../admin-crud-client"

export const dynamic = "force-dynamic"

export default async function AdminColoniasPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const neighborhoods = await prisma.neighborhood.findMany({
    include: {
      municipality: { select: { name: true } },
      _count: { select: { businesses: true } },
    },
    orderBy: [{ municipality: { name: "asc" } }, { name: "asc" }],
  })

  return (
    <AdminCRUDClient
      title="Colonias"
      description="Gestiona los barrios y colonias del ZMG"
      apiBase="/api/admin/colonias"
      items={JSON.parse(JSON.stringify(neighborhoods))}
      columns={[
        { key: "name", label: "Colonia" },
        { key: "municipality.name", label: "Municipio" },
        { key: "_count.businesses", label: "Negocios" },
      ]}
      formFields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug", required: true },
        { name: "municipalityId", label: "Municipio ID", required: true },
      ]}
      statCards={[{ label: "Total", value: neighborhoods.length }]}
    />
  )
}
