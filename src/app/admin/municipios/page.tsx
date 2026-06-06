import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Edit2 } from "lucide-react"

export const dynamic = "force-dynamic"

async function getMunicipalities() {
  const municipalities = await prisma.municipality.findMany({
    include: {
      neighborhoods: { select: { id: true, name: true } },
      _count: { select: { neighborhoods: true, businesses: true } },
    },
    orderBy: { name: "asc" },
  })
  return JSON.parse(JSON.stringify(municipalities))
}

export default async function AdminMunicipiosPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const municipalities = await getMunicipalities()
  const total = municipalities.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Municipios</h1>
          <p className="text-sm text-slate-500">Gestiona los municipios del ZMG</p>
        </div>
        <Button className="gap-2 bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Nuevo Municipio
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-950">{total}</div>
              <p className="text-sm text-slate-500 mt-1">Municipios totales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado de Municipios</CardTitle>
        </CardHeader>
        <CardContent>
          {municipalities.length === 0 ? (
            <p className="text-sm text-slate-500">No hay municipios registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-900">Nombre</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Slug</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Colonias</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Negocios</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {municipalities.map((m: any) => (
                    <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                      <td className="px-4 py-3 text-slate-600">{m.slug}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {m._count.neighborhoods}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {m._count.businesses}
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
