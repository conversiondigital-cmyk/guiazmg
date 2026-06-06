import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Edit2 } from "lucide-react"

export const dynamic = "force-dynamic"

async function getSubcategories() {
  const subcategories = await prisma.subcategory.findMany({
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { businesses: true } },
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  })
  return JSON.parse(JSON.stringify(subcategories))
}

export default async function AdminSubcategoriasPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const subcategories = await getSubcategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Subcategorías</h1>
          <p className="text-sm text-slate-500">Gestiona las subcategorías del directorio</p>
        </div>
        <Button className="gap-2 bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Nueva Subcategoría
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-950">{subcategories.length}</div>
              <p className="text-sm text-slate-500 mt-1">Subcategorías totales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado de Subcategorías</CardTitle>
        </CardHeader>
        <CardContent>
          {subcategories.length === 0 ? (
            <p className="text-sm text-slate-500">No hay subcategorías registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-900">Subcategoría</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Categoría</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Slug</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Negocios</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {subcategories.map((sub: any) => (
                    <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{sub.name}</td>
                      <td className="px-4 py-3 text-slate-600">{sub.category.name}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{sub.slug}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {sub._count.businesses}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-slate-200 rounded">
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </button>
                          <button className="p-2 hover:bg-slate-200 rounded">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
