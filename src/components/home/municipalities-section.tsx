import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Building2 } from "@/lib/icons"
import type { Municipality, Neighborhood } from "@/types"

interface MunicipalitiesSectionProps {
  municipalities: (Municipality & { neighborhoods: Neighborhood[] })[]
}

export function MunicipalitiesSection({ municipalities }: MunicipalitiesSectionProps) {
  if (!municipalities.length) return null

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Municipios de la ZMG</h2>
          <p className="mt-2 text-gray-600">
            Busca negocios cerca de ti en cualquier municipio del área metropolitana
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {municipalities.map((municipio) => (
            <Link key={municipio.id} href={`/search?municipio=${municipio.slug}`}>
              <Card className="group h-full transition-all hover:shadow-md hover:border-blue-200 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {municipio.name}
                    </h3>
                  </div>
                  {municipio.neighborhoods.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {municipio.neighborhoods.slice(0, 6).map((n) => (
                        <span
                          key={n.id}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                        >
                          {n.name}
                        </span>
                      ))}
                      {municipio.neighborhoods.length > 6 && (
                        <span className="text-xs text-gray-400">
                          +{municipio.neighborhoods.length - 6} más
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
