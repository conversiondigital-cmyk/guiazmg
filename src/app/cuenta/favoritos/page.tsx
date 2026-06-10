export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Heart, MapPin, Star } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Favoritos | Guía ZMG" }

export default async function FavoritosPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = (session.user as any).id

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      profile: {
        select: {
          id: true, name: true, slug: true, shortDescription: true,
          logoUrl: true, municipalityId: true,
          municipality: { select: { name: true } },
          _count: { select: { reviews: true } },
        },
      },
    },
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
          Favoritos
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{favorites.length} negocios guardados</p>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <Heart className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Aún no tienes favoritos</p>
          <p className="text-sm text-gray-400 mt-1">Guarda negocios que te interesen para encontrarlos fácilmente</p>
          <Link href="/search" className="mt-4 inline-flex rounded-xl bg-green-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-900 transition-colors">
            Explorar negocios
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {favorites.map(({ profile: b, id }) => b == null ? null : (
            <Link key={id} href={`/negocio/${b.slug}`} className="group rounded-2xl bg-white border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 overflow-hidden">
                {b.logoUrl
                  ? <img src={b.logoUrl} alt={b.name} className="h-full w-full object-cover" />
                  : <span className="text-xl font-black text-gray-300">{b.name.charAt(0)}</span>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 group-hover:text-green-800 line-clamp-1">{b.name}</p>
                {b.shortDescription && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{b.shortDescription}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  {b.municipality && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{b.municipality.name}</span>}
                  <span className="flex items-center gap-0.5"><Star className="h-3 w-3" />{b._count.reviews} reseñas</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
