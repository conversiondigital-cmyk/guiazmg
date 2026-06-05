import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, MessageCircle, Globe, Navigation, Clock, AlertTriangle } from "@/lib/icons"
import { truncate, formatPhone, getWhatsAppLink, getMapsLink } from "@/lib/utils"
import type { SearchResponse } from "@/lib/search/search-engine"

type SearchBusiness = SearchResponse["businesses"][number]
type BusinessHour = {
  dayOfWeek: number
  isClosed: boolean
  opensAt: string | null
  closesAt: string | null
}

interface SearchResultsProps {
  results: SearchResponse
  query?: string
  municipio?: string
  category?: string
}

function isOpenNow(hours: BusinessHour[] | undefined): boolean | null {
  if (!hours?.length) return null
  const now = new Date()
  const day = now.getDay()
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  const today = hours.find((h) => h.dayOfWeek === day)
  if (!today || today.isClosed || !today.opensAt || !today.closesAt) return false
  return today.opensAt <= time && time <= today.closesAt
}

export function SearchResults({ results, query }: SearchResultsProps) {
  const { businesses, total, page, totalPages, interpretation } = results

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {query ? (
            <>
              Resultados para <span className="text-blue-600">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Todos los perfiles"
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} perfil{total !== 1 ? "es" : ""} encontrado{total !== 1 ? "s" : ""}
        </p>
        {interpretation && (
          <div className="mt-2 flex flex-wrap gap-2">
            {interpretation.isUrgency && (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Urgente
              </Badge>
            )}
            {interpretation.isProximity && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <Navigation className="h-3 w-3 mr-1" />
                Cerca de ti
              </Badge>
            )}
            {interpretation.isOpenNow && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <Clock className="h-3 w-3 mr-1" />
                Abierto ahora
              </Badge>
            )}
          </div>
        )}
      </div>

      {businesses.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Sin resultados</h2>
          <p className="mt-2 text-gray-500">
            No encontramos perfiles con esos criterios. Intenta con otra búsqueda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map((business: SearchBusiness) => {
            const openStatus = isOpenNow(business.hours)
            const activeMembership = business.memberships?.find((m) => m.status === "ACTIVE")

            return (
              <Card key={business.id} className="overflow-hidden transition-all hover:shadow-md">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                            href={`/perfil/${business.slug}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {business.name}
                            </Link>
                            {business.isVerified && (
                              <Badge className="bg-blue-600 text-white text-xs">Verificado</Badge>
                            )}
                            {activeMembership && (
                              <Badge className="bg-amber-500 text-white text-xs">Premium</Badge>
                            )}
                            {openStatus === true && (
                              <Badge className="bg-emerald-500 text-white text-xs">Abierto</Badge>
                            )}
                            {openStatus === false && (
                              <Badge variant="secondary" className="text-xs">Cerrado</Badge>
                            )}
                          </div>
                          {business.shortDescription && (
                            <p className="mt-1 text-sm text-gray-500">
                              {truncate(business.shortDescription, 150)}
                            </p>
                          )}
                        </div>
                        {business.score && (
                          <div className="text-right ml-4 shrink-0">
                            <div className="text-xs text-gray-400">Relevancia</div>
                            <div className="text-lg font-bold text-blue-600">
                              {Math.round(business.score)}%
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {business.municipality && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {business.municipality.name}
                            {business.neighborhood && ` - ${business.neighborhood.name}`}
                          </span>
                        )}
                        {business.distance !== undefined && (
                          <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                            <Navigation className="h-3 w-3" />
                            {business.distance.toFixed(1)} km
                          </span>
                        )}
                        {business.category && (
                          <Badge variant="secondary" className="text-xs">
                            {business.category.name}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {business.phone && (
                          <a
                            href={`tel:${business.phone}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-background px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {formatPhone(business.phone)}
                          </a>
                        )}
                        {business.whatsapp && (
                          <a
                            href={getWhatsAppLink(business.whatsapp, `Hola, vi tu perfil en Guía ZMG`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        )}
                        {business.websiteUrl && (
                          <a
                            href={business.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            Sitio web
                          </a>
                        )}
                        {business.latitude && business.longitude && (
                          <a
                            href={getMapsLink(business.latitude, business.longitude)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            Cómo llegar
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/search?page=${page - 1}&q=${query || ""}`}
              className="inline-flex items-center rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Anterior
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p >= page - 2 && p <= page + 2)
            .map((p) => (
              <Link
                key={p}
                href={`/search?page=${p}&q=${query || ""}`}
                className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm ${
                  p === page ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"
                }`}
              >
                {p}
              </Link>
            ))}
          {page < totalPages && (
            <Link
              href={`/search?page=${page + 1}&q=${query || ""}`}
              className="inline-flex items-center rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Siguiente
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
