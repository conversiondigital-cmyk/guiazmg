import Link from "next/link"
import { MapPin, BadgeCheck } from "lucide-react"
import { DistanceBadge } from "@/components/location/distance-badge"
import type { Business } from "@/types"

interface FeaturedBusinessesProps {
  businesses: Business[]
}

const CARD =
  "business-card group block overflow-hidden rounded-2xl border border-[#bfc9c3]/20 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-10px_rgba(0,53,39,0.18)]"

function Cover({ biz, className }: { biz: Business; className: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {biz.coverImageUrl ? (
        <img src={biz.coverImageUrl} alt={biz.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#064e3b] to-[#006c49]">
          <span className="text-5xl font-black text-white/30">{biz.name.charAt(0)}</span>
        </div>
      )}
    </div>
  )
}

// Distintivo honesto basado en datos reales (verificación), no en un rating inventado.
function VerifiedPill() {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-lg bg-[#6cf8bb]/20 px-2 py-1">
      <BadgeCheck className="h-3.5 w-3.5 text-[#006c49]" />
      <span className="text-xs font-bold text-[#006c49]">Verificado</span>
    </span>
  )
}

export function FeaturedBusinesses({ businesses }: FeaturedBusinessesProps) {
  if (!businesses.length) return null
  const [hero, ...rest] = businesses
  const smalls = rest.slice(0, 4)

  return (
    <section className="bg-[#eff4ff] py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#003527] sm:text-[32px]">Negocios Destacados</h2>
          <p className="mx-auto max-w-2xl text-[#404944]">
            Los establecimientos más recomendados por la comunidad tapatía por su calidad y servicio.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Hero card */}
          <Link href={`/perfil/${hero.slug}`} className={`${CARD} md:col-span-7`}>
            <div className="relative">
              <Cover biz={hero} className="aspect-[16/9]" />
              <span className="absolute right-4 top-4 rounded-full bg-[#003527]/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                Top Destacado
              </span>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  {hero.category && (
                    <span className="text-xs font-bold uppercase text-[#006c49]">{hero.category.name}</span>
                  )}
                  <h3 className="text-2xl font-semibold text-[#003527]">{hero.name}</h3>
                </div>
                {hero.isVerified && <VerifiedPill />}
              </div>
              {hero.shortDescription && (
                <p className="mb-6 line-clamp-2 text-[#404944]">{hero.shortDescription}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-[#404944]">
                {hero.municipality && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {hero.municipality.name}, Jalisco
                  </span>
                )}
                <DistanceBadge lat={hero.latitude} lng={hero.longitude} interactive />
              </div>
            </div>
          </Link>

          {/* Small wide card */}
          {smalls[0] && (
            <Link href={`/perfil/${smalls[0].slug}`} className={`${CARD} md:col-span-5`}>
              <Cover biz={smalls[0]} className="aspect-[16/9]" />
              <div className="p-6">
                {smalls[0].category && (
                  <span className="text-xs font-bold uppercase text-[#006c49]">{smalls[0].category.name}</span>
                )}
                <h3 className="mb-2 text-2xl font-semibold text-[#003527]">{smalls[0].name}</h3>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {smalls[0].isVerified && <VerifiedPill />}
                  <DistanceBadge lat={smalls[0].latitude} lng={smalls[0].longitude} className="text-sm" />
                </div>
                <span className="mt-4 block w-full rounded-xl border border-[#003527] py-2 text-center text-sm font-semibold text-[#003527] transition-colors group-hover:bg-[#003527]/5">
                  Ver Detalles
                </span>
              </div>
            </Link>
          )}

          {/* Three small cards */}
          {smalls.slice(1).map((biz) => (
            <Link key={biz.id} href={`/perfil/${biz.slug}`} className={`${CARD} md:col-span-4`}>
              <Cover biz={biz} className="aspect-[16/9]" />
              <div className="p-6">
                {biz.category && (
                  <span className="text-xs font-bold uppercase text-[#006c49]">{biz.category.name}</span>
                )}
                <h3 className="text-2xl font-semibold text-[#003527]">{biz.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {biz.isVerified && <VerifiedPill />}
                  <DistanceBadge lat={biz.latitude} lng={biz.longitude} className="text-sm" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl bg-[#003527] px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-95"
          >
            Ver todos los negocios →
          </Link>
        </div>
      </div>
    </section>
  )
}
