import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AdminCRUDClient } from "../admin-crud-client"

export const dynamic = "force-dynamic"

export default async function AdminEtiquetasPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const tags = await prisma.tag.findMany({
    include: { _count: { select: { businesses: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <AdminCRUDClient
      title="Etiquetas / Tags"
      description="Etiquetas que se asignan a perfiles comerciales para mejorar la clasificación"
      apiBase="/api/admin/etiquetas"
      items={JSON.parse(JSON.stringify(tags))}
      columns={[
        { key: "name", label: "Nombre" },
        { key: "slug", label: "Slug" },
        { key: "icon", label: "Icono" },
        { key: "_count.businesses", label: "Perfiles" },
        { key: "isActive", label: "Activa" },
      ]}
      formFields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug (opcional, se genera del nombre)" },
        { name: "icon", label: "Icono (emoji opcional)" },
      ]}
      statCards={[
        { label: "Total etiquetas", value: tags.length },
        { label: "Activas", value: tags.filter((t) => t.isActive).length },
      ]}
    />
  )
}
