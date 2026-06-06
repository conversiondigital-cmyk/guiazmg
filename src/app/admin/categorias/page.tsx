import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Edit2 } from "lucide-react"

export const dynamic = "force-dynamic"

async function getCategories() {
  const categories = await prisma.category.findMany({
    include: {
      subcategories: {
        select: { id: true, name: true },
      },
      _count: { select: { businesses: true } },
    },
    orderBy: { name: "asc" },
  })
  return JSON.parse(JSON.stringify(categories))
}

export default async function AdminCategoriasPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const categories = await getCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Categorías</h1>
          <p className="text-sm text-slate-500">
            Gestiona las categorías principales del directorio
          </p>
        </div>
        <Button className="gap-2 bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Total: {categories.length} categorías
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay categorías registradas
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Nombre
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Slug
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Subcategorías
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Negocios
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat: any) => (
                      <tr
                        key={cat.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{cat.icon}</span>
                            <span className="font-medium text-slate-900">
                              {cat.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{cat.slug}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {cat.subcategories.length}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            {cat._count.businesses}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              className="p-2 hover:bg-slate-200 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </button>
                            <button
                              className="p-2 hover:bg-slate-200 rounded transition-colors"
                              title="Eliminar"
                            >
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
