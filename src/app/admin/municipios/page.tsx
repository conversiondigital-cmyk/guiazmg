import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminCRUDClient } from "../admin-crud-client"

export const dynamic = "force-dynamic"

export default async function AdminMunicipiosPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const municipalities = await prisma.municipality.findMany({
    include: {
      _count: { select: { neighborhoods: true, businesses: true } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <AdminCRUDClient
      title="Municipios"
      description="Gestiona los municipios del ZMG"
      apiBase="/api/admin/municipios"
      items={JSON.parse(JSON.stringify(municipalities))}
      columns={[
        { key: "name", label: "Nombre" },
        { key: "slug", label: "Slug" },
        { key: "_count.neighborhoods", label: "Colonias" },
        { key: "_count.businesses", label: "Negocios" },
      ]}
      formFields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug", required: true },
      ]}
      statCards={[{ label: "Total", value: municipalities.length }]}
    />
  )
}
