import Link from "next/link"
import { BusinessCard, type BusinessCardData } from "@/components/business/business-card"
import type { Business } from "@/types"

interface FeaturedBusinessesProps {
  businesses: Business[]
  /** Variante compacta sin la banda de fondo y el header centrado del home.
   * Se usa dentro de contenedores ya acolchados como /cuenta. */
  bare?: boolean
}

export function FeaturedBusinesses({ businesses, bare = false }: FeaturedBusinessesProps) {
  if (!businesses.length) return null
  const list = businesses.slice(0, 6)

  return (
    <section className={bare ? "" : "bg-[#eff4ff] py-20"}>
      <div className={bare ? "" : "mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10"}>
        {bare ? (
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#003527]">Negocios Destacados</h2>
            <p className="text-sm text-[#404944]">Los más recomendados por la comunidad tapatía.</p>
          </div>
        ) : (
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold text-[#003527] md:text-3xl">Negocios Destacados</h2>
            <p className="mx-auto max-w-2xl text-[#404944]">
              Los establecimientos más recomendados por la comunidad tapatía por su calidad y servicio.
            </p>
          </div>
        )}

        {/* Misma tarjeta que en la búsqueda: diseño consistente en todo el sitio. */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((biz) => (
            <BusinessCard key={biz.id} business={biz as unknown as BusinessCardData} />
          ))}
        </div>

        <div className={bare ? "mt-5" : "mt-12 text-center"}>
          <Link
            href="/search"
            className={
              bare
                ? "text-sm font-semibold text-[#006c49] hover:underline"
                : "inline-flex items-center gap-2 rounded-xl bg-[#003527] px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-95"
            }
          >
            Ver todos los negocios →
          </Link>
        </div>
      </div>
    </section>
  )
}
