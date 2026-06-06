import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search as SearchIcon, User, Store, FileText, Users } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const params = await searchParams
  const query = params.q?.trim() || ""

  if (!query) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Búsqueda global</h1>
          <p className="text-sm text-slate-500">Ingresa un término para buscar usuarios, negocios y más</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <SearchIcon className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No hay término de búsqueda</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  try {
    // Search across multiple entities
    const [users, profiles, listings] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          image: true,
        },
        take: 10,
      }),
      prisma.profile.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          logoUrl: true,
          category: { select: { name: true } },
        },
        take: 10,
      }),
      prisma.listing.findMany({
        where: {
          title: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          business: { select: { name: true } },
        },
        take: 10,
      }),
    ])

    const totalResults = users.length + profiles.length + listings.length

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Búsqueda global</h1>
          <p className="text-sm text-slate-500">
            Resultados para: <span className="font-medium">"{query}"</span>
            {totalResults > 0 && <span className="ml-2">({totalResults} resultados)</span>}
          </p>
        </div>

        {totalResults === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <SearchIcon className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500">No se encontraron resultados</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Users */}
            {users.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Usuarios ({users.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.map((user) => (
                      <Link
                        key={user.id}
                        href={`/admin/usuarios/${user.id}`}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{user.name || "—"}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profiles/Businesses */}
            {profiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Negocios ({profiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profiles.map((profile) => (
                      <Link
                        key={profile.id}
                        href={`/admin/negocios/${profile.id}`}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{profile.name}</p>
                          <p className="text-sm text-slate-500">{profile.category?.name}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline">{profile.status}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Listings */}
            {listings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Anuncios ({listings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {listings.map((listing) => (
                      <Link
                        key={listing.id}
                        href={`/admin/anuncios`}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{listing.title}</p>
                          <p className="text-sm text-slate-500">{listing.business.name}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline">{listing.status}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    )
  } catch (error) {
    console.error("[ADMIN_SEARCH_ERROR]", error)
    throw error
  }
}
