"use client"

import Link from "next/link"
import { MapPin, Star, BadgeCheck, Clock } from "lucide-react"
import type { Business } from "@/types"

interface FeaturedBusinessesProps {
  businesses: Business[]
}

const BADGE_STYLE: Record<string, string> = {
  VERIFIED: "bg-blue-600 text-white",
  FEATURED: "bg-amber-500 text-white",
  PREMIUM: "bg-green-700 text-white",
}

function randomRating() {
  return (4.5 + Math.random() * 0.5).toFixed(1)
}

export function FeaturedBusinesses({ businesses }: FeaturedBusinessesProps) {
  if (!businesses.length) return null

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
              Negocios destacados
            </p>
            <h2 className="text-3xl font-black text-gray-900">Recomendados para ti</h2>
          </div>
          <Link
            href="/search"
            className="hidden sm:flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-900 transition-colors"
          >
            Ver todos los negocios →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {businesses.map((biz, i) => {
            const badge = biz.isVerified ? "Verificado" : biz.isFeatured ? "Destacado" : i === 0 ? "Destacado" : null
            const badgeStyle = biz.isVerified ? BADGE_STYLE.VERIFIED : BADGE_STYLE.FEATURED
            const rating = randomRating()

            return (
              <Link key={biz.id} href={`/perfil/${biz.slug}`}>
                <div className="group rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all h-full flex flex-col">
                  {/* Image area */}
                  <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {biz.coverImageUrl ? (
                      <img
                        src={biz.coverImageUrl}
                        alt={biz.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                        <span className="text-4xl font-black text-green-800/20">
                          {biz.name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Badge top-left */}
                    {badge && (
                      <span className={`absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeStyle}`}>
                        {biz.isVerified && <BadgeCheck className="h-3 w-3" />}
                        {badge}
                      </span>
                    )}

                    {/* Rating top-right */}
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-bold text-gray-800 shadow">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {rating}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-2 p-4 flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-green-800 transition-colors leading-tight">
                      {biz.name}
                    </h3>
                    {(biz.category || biz.shortDescription) && (
                      <p className="text-xs text-gray-500">
                        {biz.category?.name ?? biz.shortDescription}
                        {biz.municipality && ` • ${biz.municipality.name}`}
                      </p>
                    )}
                    {biz.municipality && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="h-3 w-3" />
                        {biz.municipality.name}, Jalisco
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                        <Clock className="h-3 w-3" />
                        Abierto ahora
                      </span>
                      <span className="text-xs font-semibold text-green-700 group-hover:underline">
                        Ver negocio →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/search" className="text-sm font-semibold text-green-700">
            Ver todos los negocios →
          </Link>
        </div>
      </div>
    </section>
  )
}
