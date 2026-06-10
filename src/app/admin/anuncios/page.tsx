import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Edit2, Eye } from "lucide-react"

export const dynamic = "force-dynamic"

async function getListings(searchParams: Record<string, string | string[] | undefined>) {
  const page = Math.max(1, Number(searchParams.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.limit) || 20))
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined
  const search = typeof searchParams.search === "string" ? searchParams.search.trim() : undefined

  const where: Prisma.ListingWhereInput = {
    deletedAt: null,
  }

  if (status && status !== "todos") {
    const statusMap: Record<string, string> = {
      activos: "ACTIVE",
      pendientes: "PENDING_REVIEW",
      pausados: "DRAFT",
      archivados: "ARCHIVED",
    }
    where.status = statusMap[status] as any
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { profile: { name: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        profile: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { leads: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ])

  const [totalCount, activeCount, pendingCount] = await Promise.all([
    prisma.listing.count({ where: { deletedAt: null } }),
    prisma.listing.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.listing.count({ where: { deletedAt: null, status: "PENDING_REVIEW" } }),
  ])

  return {
    listings: JSON.parse(JSON.stringify(listings)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: { total: totalCount, active: activeCount, pending: pendingCount },
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "bg-green-100", text: "text-green-800" },
  PENDING_REVIEW: { bg: "bg-yellow-100", text: "text-yellow-800" },
  DRAFT: { bg: "bg-gray-100", text: "text-gray-800" },
  ARCHIVED: { bg: "bg-slate-100", text: "text-slate-800" },
}

export default async function AdminAnunciosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role ?? "")) {
    redirect("/auth/login")
  }

  const params = await searchParams
  const { listings, stats } = await getListings(params)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Anuncios / Productos</h1>
          <p className="text-sm text-slate-500">
            Gestiona los anuncios y productos publicados
          </p>
        </div>
        <Button className="gap-2 bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Nuevo Anuncio
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-950">
                {stats.total}
              </div>
              <p className="text-sm text-slate-500 mt-1">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.active}
              </div>
              <p className="text-sm text-slate-500 mt-1">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <p className="text-sm text-slate-500 mt-1">Pendientes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Listado de Anuncios ({listings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <p className="text-sm text-slate-500">No hay anuncios</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-900">
                      Título
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900">
                      Negocio
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900">
                      Categoría
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900">
                      Estado
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900">
                      Leads
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing: any) => (
                    <tr
                      key={listing.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                        {listing.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {listing.profile.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {listing.category.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[listing.status]?.bg || "bg-gray-100"} ${STATUS_COLORS[listing.status]?.text || "text-gray-800"}`}
                        >
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600">
                          {listing._count.leads}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-slate-200 rounded">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </button>
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
