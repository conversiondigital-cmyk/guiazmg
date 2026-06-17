import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminCRUDClient } from "../admin-crud-client"

export const dynamic = "force-dynamic"

export default async function AdminSubcategoriasPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const [subcategories, categories] = await Promise.all([
    prisma.subcategory.findMany({
      include: {
        category: { select: { name: true } },
        _count: { select: { businesses: true } },
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <AdminCRUDClient
      title="Subcategorías"
      description="Gestiona las subcategorías del directorio"
      apiBase="/api/admin/subcategorias"
      items={JSON.parse(JSON.stringify(subcategories))}
      columns={[
        { key: "name", label: "Subcategoría" },
        { key: "category.name", label: "Categoría" },
        { key: "slug", label: "Slug" },
        { key: "_count.businesses", label: "Negocios" },
      ]}
      formFields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug", required: true },
        {
          name: "categoryId",
          label: "Categoría",
          type: "select",
          required: true,
          options: categories.map((c) => ({ value: c.id, label: c.name })),
        },
      ]}
      statCards={[{ label: "Total", value: subcategories.length }]}
    />
  )
}
