import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Navigation, Clock, AlertTriangle, ChevronDown } from "@/lib/icons"
import { BusinessCard } from "@/components/business/business-card"
import type { SearchResponse } from "@/lib/search/search-engine"

type SearchBusiness = SearchResponse["businesses"][number]

interface SearchResultsProps {
  results: SearchResponse
  query?: string
  municipio?: string
  category?: string
  sort?: string
}

const SORT_LABELS: Record<string, string> = {
  relevance: "Relevancia",
  distance: "Más cercano",
  rating: "Mejor valorado",
  newest: "Más reciente",
}

export function SearchResults({ results, query, municipio, sort }: SearchResultsProps) {
  const { businesses, total, page, totalPages, interpretation } = results
  const currentSort = SORT_LABELS[sort ?? ""] ?? "Relevancia"
  const qParam = query ? `&q=${encodeURIComponent(query)}` : ""

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {query ? (
            <>
              Resultados para <span className="text-green-700">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Todos los perfiles"
          )}
        </h1>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-800">
              {total} resultado{total !== 1 ? "s" : ""}
            </span>
            <span className="text-gray-500">
              · Mostrando negocios en {municipio ? municipio : "la Zona Metropolitana de Guadalajara"}
            </span>
          </div>

          {/* Orden (dropdown nativo con <details>, sin JS) */}
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {currentSort}
              <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <Link
                  key={value}
                  href={`/search?sort=${value}&page=1${qParam}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                >
                  {label}
                </Link>
              ))}
            </div>
          </details>
        </div>

        {interpretation && (
          <div className="mt-3 flex flex-wrap gap-2">
            {interpretation.isUrgency && (
              <Badge className="border-red-200 bg-red-100 text-red-700">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Urgente
              </Badge>
            )}
            {interpretation.isProximity && (
              <Badge className="border-green-200 bg-green-100 text-green-700">
                <Navigation className="mr-1 h-3 w-3" />
                Cerca de ti
              </Badge>
            )}
            {interpretation.isOpenNow && (
              <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
                <Clock className="mr-1 h-3 w-3" />
                Abierto ahora
              </Badge>
            )}
          </div>
        )}
      </div>

      {businesses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Sin resultados</h2>
          <p className="mt-2 text-gray-500">No encontramos perfiles con esos criterios. Intenta con otra búsqueda.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {businesses.flatMap((business: SearchBusiness, i: number) => {
            const card = <BusinessCard key={business.id} business={business} />
            // Banner destacado a mitad de la retícula (tras la 2ª tarjeta).
            if (i === 1) {
              return [
                card,
                <Link
                  key="featured-banner"
                  href="/mapa"
                  className="relative flex min-h-[180px] flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-green-800 to-emerald-600 p-7 text-white sm:col-span-2"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Explora la ZMG</span>
                  <h3 className="mt-2 max-w-md text-2xl font-bold leading-tight">
                    Descubre negocios cerca de ti en el mapa interactivo
                  </h3>
                  <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-green-800">
                    <Navigation className="h-4 w-4" />
                    Ver mapa
                  </span>
                </Link>,
              ]
            }
            return [card]
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/search?page=${page - 1}${qParam}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              ‹
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p >= page - 2 && p <= page + 2)
            .map((p) => (
              <Link
                key={p}
                href={`/search?page=${p}${qParam}`}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium ${
                  p === page ? "border-green-800 bg-green-800 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </Link>
            ))}
          {page < totalPages && (
            <Link
              href={`/search?page=${page + 1}${qParam}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              ›
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
