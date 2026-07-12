import Link from "next/link"
import NextImage from "next/image"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, MessageCircle, Globe, Navigation, Clock, AlertTriangle, Star, ChevronDown } from "@/lib/icons"
import { getWhatsAppLink, getMapsLink } from "@/lib/utils"
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
  sort?: string
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

// Un botón de acción (icono arriba, etiqueta abajo). Si no hay dato, se ve
// deshabilitado en gris para conservar la retícula de 4.
function ActionTile({
  href, icon: Icon, label, tone = "default", external,
}: {
  href?: string
  icon: React.FC<React.SVGProps<SVGSVGElement>>
  label: string
  tone?: "default" | "whatsapp"
  external?: boolean
}) {
  const base = "flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 text-[11px] font-semibold uppercase tracking-wide transition-colors"
  if (!href) {
    return (
      <span className={`${base} cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300`}>
        <Icon className="h-4 w-4" />
        {label}
      </span>
    )
  }
  const style =
    tone === "whatsapp"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : "border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`${base} ${style}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  )
}

const SORT_LABELS: Record<string, string> = {
  relevance: "Relevancia",
  distance: "Más cercano",
  rating: "Mejor valorado",
  newest: "Más reciente",
}

function BusinessCard({ business }: { business: SearchBusiness }) {
  const open = isOpenNow(business.hours)
  const img: string | null = business.coverImageUrl || business.logoUrl || null
  const rating: number = Number(business.avgRating) || 0
  const reviews: number = business._count?.reviews ?? 0
  const activeMembership = business.memberships?.find((m: { status: string }) => m.status === "ACTIVE")

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <Link
        href={`/perfil/${business.slug}`}
        className="relative block aspect-[16/10] overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100"
      >
        {img ? (
          <NextImage
            src={img}
            alt={business.name}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">{business.category?.icon || "🏢"}</div>
        )}
        {reviews > 0 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-sm font-bold text-gray-800 shadow-sm">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </span>
        )}
        <div className="absolute bottom-3 left-3 flex gap-2">
          {business.category && (
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              {business.category.name}
            </span>
          )}
          {business.isVerified && (
            <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Verificado
            </span>
          )}
          {activeMembership && (
            <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Premium
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/perfil/${business.slug}`}
            className="text-lg font-bold leading-tight text-gray-900 transition-colors hover:text-green-700"
          >
            {business.name}
          </Link>
          {open !== null && (
            <span className={`inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold ${open ? "text-emerald-600" : "text-red-500"}`}>
              <span className={`h-2 w-2 rounded-full ${open ? "bg-emerald-500" : "bg-red-500"}`} />
              {open ? "Abierto" : "Cerrado"}
            </span>
          )}
        </div>

        {business.municipality && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="h-3 w-3" />
            {business.municipality.name}
            {business.neighborhood ? ` · ${business.neighborhood.name}` : ""}
          </p>
        )}

        {business.shortDescription && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-500">{business.shortDescription}</p>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          <ActionTile href={business.phone ? `tel:${business.phone}` : undefined} icon={Phone} label="Llamar" />
          <ActionTile
            href={business.whatsapp ? getWhatsAppLink(business.whatsapp, "Hola, vi tu perfil en Guía ZMG") : undefined}
            icon={MessageCircle}
            label="WhatsApp"
            tone="whatsapp"
            external
          />
          <ActionTile href={business.websiteUrl || undefined} icon={Globe} label="Web" external />
          <ActionTile
            href={business.latitude && business.longitude ? getMapsLink(business.latitude, business.longitude) : undefined}
            icon={Navigation}
            label="Mapa"
            external
          />
        </div>
      </div>
    </div>
  )
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
