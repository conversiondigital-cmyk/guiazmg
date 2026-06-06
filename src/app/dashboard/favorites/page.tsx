export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin } from "@/lib/icons"

export default async function FavoritesPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      business: {
        include: { municipality: true, category: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Favoritos</h1>
        <p className="text-gray-500">Perfiles que has guardado</p>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Sin favoritos</h2>
            <p className="mt-2 text-sm text-gray-500">
              Guarda perfiles que te interesen para encontrarlos rápido
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            if (!fav.business) return null
            const biz = fav.business
            return (
              <Link key={fav.id} href={`/perfil/${biz.slug}`}>
                <Card className="group h-full transition-all hover:shadow-md cursor-pointer">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                      {biz.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {biz.municipality?.name || "ZMG"}
                      {biz.category && <span>· {biz.category.name}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
