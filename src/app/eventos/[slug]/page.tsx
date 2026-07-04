// ISR: detalle de evento cacheado, regenerado cada 5 min; las ediciones del
// evento lo revalidan al instante (revalidatePath en la API de eventos).
export const revalidate = 300

import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { getEventBySlug } from "@/lib/events"
import { prisma } from "@/lib/prisma"
import { getMapsLink } from "@/lib/utils"
import { CalendarDays, MapPin, Ticket, ArrowLeft, ExternalLink, Building2 } from "lucide-react"

interface EventDetailProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: EventDetailProps) {
  const { slug } = await params
  const ev = await getEventBySlug(slug)
  if (!ev) return { title: "Evento no encontrado" }
  return {
    title: `${ev.title} | Eventos Guía ZMG`,
    description: ev.description?.slice(0, 160) || `Evento en la Zona Metropolitana de Guadalajara.`,
  }
}

function fmtRange(start: Date, end: Date | null): string {
  const d = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(start)
  const t = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(start)
  const te = end ? new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(end) : null
  return `${d} · ${t}${te ? ` – ${te}` : ""}`
}

export default async function EventDetailPage({ params }: EventDetailProps) {
  const { slug } = await params
  const ev = await getEventBySlug(slug)
  if (!ev || !ev.isPublished) notFound()

  const muni = ev.municipalityId
    ? await prisma.municipality.findUnique({ where: { id: ev.municipalityId }, select: { name: true } }).catch(() => null)
    : null

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f8f9ff]" style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/eventos" className="mb-6 inline-flex items-center gap-1.5 text-sm text-green-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Volver a eventos
          </Link>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="relative aspect-[21/9] bg-gradient-to-br from-[#003527] via-[#064e3b] to-[#006c49]">
              {ev.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ev.coverImageUrl} alt={ev.title} fetchPriority="high" className="h-full w-full object-cover" />
              )}
              <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-sm font-bold ${ev.isFree ? "bg-[#4edea3] text-[#003527]" : "bg-white/90 text-gray-800"}`}>
                {ev.isFree ? "Gratis" : ev.priceText || "De pago"}
              </span>
            </div>

            <div className="p-6 sm:p-8">
              {ev.category && <span className="text-xs font-bold uppercase tracking-wide text-green-700">{ev.category}</span>}
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">{ev.title}</h1>

              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-green-700" />
                  <span>{fmtRange(ev.startAt, ev.endAt)}</span>
                </div>
                {(ev.venueName || muni?.name || ev.addressText) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
                    <span>
                      {[ev.venueName, ev.addressText, muni?.name].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                )}
                {ev.organizer && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-green-700" />
                    <span>{ev.organizer}</span>
                  </div>
                )}
              </div>

              {ev.description && (
                <p className="mt-5 whitespace-pre-line text-gray-700">{ev.description}</p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {ev.ticketUrl && (
                  <a href={ev.ticketUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#003527] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95">
                    <Ticket className="h-4 w-4" /> Más información / Boletos
                  </a>
                )}
                {ev.latitude != null && ev.longitude != null && (
                  <a href={getMapsLink(ev.latitude, ev.longitude)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-gray-50">
                    <MapPin className="h-4 w-4" /> Cómo llegar
                  </a>
                )}
                {ev.sourceUrl && !ev.ticketUrl && (
                  <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-gray-50">
                    <ExternalLink className="h-4 w-4" /> Fuente
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
