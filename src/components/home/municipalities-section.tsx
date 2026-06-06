import Link from "next/link"
import { MapPin } from "lucide-react"
import type { Municipality, Neighborhood } from "@/types"

interface MunicipalitiesSectionProps {
  municipalities: (Municipality & { neighborhoods: Neighborhood[] })[]
}

export function MunicipalitiesSection({ municipalities }: MunicipalitiesSectionProps) {
  if (!municipalities.length) return null

  return (
    <section className="py-14 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
            Cobertura local
          </p>
          <h2 className="text-3xl font-black text-gray-900">Municipios de la ZMG</h2>
          <p className="mt-2 text-gray-500">
            Busca negocios cerca de ti en cualquier municipio del área metropolitana
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {municipalities.map((mun) => (
            <Link key={mun.id} href={`/search?municipio=${mun.slug}`}>
              <div className="group rounded-2xl border border-gray-100 bg-white p-5 hover:border-green-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 group-hover:bg-green-800 transition-colors">
                    <MapPin className="h-4 w-4 text-green-800 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-green-800 transition-colors">
                    {mun.name}
                  </h3>
                </div>
                {mun.neighborhoods.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {mun.neighborhoods.slice(0, 5).map((n) => (
                      <span key={n.id} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-500">
                        {n.name}
                      </span>
                    ))}
                    {mun.neighborhoods.length > 5 && (
                      <span className="text-[11px] text-gray-400">
                        +{mun.neighborhoods.length - 5} más
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
