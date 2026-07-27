import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminCRUDClient } from "../admin-crud-client"

export const dynamic = "force-dynamic"

export default async function AdminZonasPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const [zones, municipalities] = await Promise.all([
    prisma.zone.findMany({
      include: {
        municipality: { select: { name: true, slug: true } },
        _count: { select: { neighborhoods: true } },
      },
      orderBy: [{ municipality: { name: "asc" } }, { priority: "desc" }, { name: "asc" }],
    }),
    prisma.municipality.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])

  const munOptions = municipalities.map((m) => ({ value: m.id, label: m.name }))

  return (
    <AdminCRUDClient
      title="Zonas"
      description="Zonas hiperlocales para SEO (agrupan colonias). La imagen de cada zona va en public/zonas/{municipio}/{slug}.jpg o en 'URL de imagen'."
      apiBase="/api/admin/zonas"
      items={JSON.parse(JSON.stringify(zones))}
      columns={[
        { key: "name", label: "Zona" },
        { key: "municipality.name", label: "Municipio" },
        { key: "priority", label: "Prioridad" },
        { key: "isSeoIndexable", label: "Indexable" },
        { key: "isActive", label: "Activa" },
        { key: "_count.neighborhoods", label: "Colonias" },
      ]}
      formFields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug (sin acentos, con guiones)", required: true },
        { name: "municipalityId", label: "Municipio", type: "select", options: munOptions, required: true },
        { name: "description", label: "Descripción / intro de la landing", type: "textarea" },
        { name: "heroImageUrl", label: "URL de imagen (opcional; si vacío usa public/zonas/…)", type: "url" },
        { name: "priority", label: "Prioridad (mayor = primero)", type: "number" },
        { name: "isActive", label: "Activa", type: "toggle" },
        { name: "isSeoIndexable", label: "Indexable en Google", type: "toggle" },
        { name: "nearbyZoneSlugs", label: "Zonas cercanas (slugs separados por coma)" },
        { name: "seoTitle", label: "SEO Title (opcional)" },
        { name: "seoDescription", label: "SEO Description (opcional)", type: "textarea" },
      ]}
      statCards={[
        { label: "Zonas", value: zones.length },
        { label: "Indexables", value: zones.filter((z) => z.isSeoIndexable).length },
        { label: "Colonias enlazadas", value: zones.reduce((n, z) => n + z._count.neighborhoods, 0) },
      ]}
    />
  )
}
