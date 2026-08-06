import Link from "next/link"
import NextImage from "next/image"
import { MapPin, Phone, MessageCircle, Globe, Navigation, Star } from "@/lib/icons"
import { getWhatsAppLink, getMapsLink } from "@/lib/utils"

// Forma mínima común que necesita la tarjeta. Tanto los resultados de búsqueda
// como los negocios destacados encajan estructuralmente en esto.
export type BusinessCardData = {
  id: string
  slug: string
  name: string
  shortDescription?: string | null
  coverImageUrl?: string | null
  logoUrl?: string | null
  phone?: string | null
  whatsapp?: string | null
  websiteUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  isVerified?: boolean | null
  avgRating?: number | string | null
  category?: { name: string; icon?: string | null } | null
  municipality?: { name: string } | null
  neighborhood?: { name: string } | null
  hours?: Array<{ dayOfWeek: number; isClosed: boolean; opensAt: string | null; closesAt: string | null }>
  _count?: { reviews?: number } | null
}

function isOpenNow(hours: BusinessCardData["hours"]): boolean | null {
  if (!hours?.length) return null
  const now = new Date()
  const day = now.getDay()
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  const today = hours.find((h) => h.dayOfWeek === day)
  if (!today || today.isClosed || !today.opensAt || !today.closesAt) return false
  return today.opensAt <= time && time <= today.closesAt
}

// Un botón de acción (icono arriba, etiqueta abajo). Sin dato → gris deshabilitado
// para conservar la retícula de 4.
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
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={`${base} ${style}`}>
      <Icon className="h-4 w-4" />
      {label}
    </a>
  )
}

// Tarjeta de negocio ÚNICA del sitio: se usa en búsqueda, destacados (home/cuenta)
// y landings de zona para que el diseño sea consistente en todos lados.
export function BusinessCard({ business }: { business: BusinessCardData }) {
  const open = isOpenNow(business.hours)
  const img = business.coverImageUrl || business.logoUrl || null
  const rating = Number(business.avgRating) || 0
  const reviews = business._count?.reviews ?? 0

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
