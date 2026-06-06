import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminCRUDClient } from "../admin-crud-client"

export const dynamic = "force-dynamic"

export default async function AdminSubcategoriasPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const subcategories = await prisma.subcategory.findMany({
    include: {
      category: { select: { name: true } },
      _count: { select: { businesses: true } },
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  })

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
        {
          key: "_count.businesses",
          label: "Negocios",
          render: (v: any) => (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              {v}
            </span>
          ),
        },
      ]}
      formFields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug", required: true },
        { name: "categoryId", label: "Categoría ID", required: true },
      ]}
      statCards={[{ label: "Total", value: subcategories.length }]}
    />
  )
}
