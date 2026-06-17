export const dynamic = "force-dynamic"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { getUpcomingEvents } from "@/lib/events"
import { getMunicipalities } from "@/lib/queries"
import { CalendarDays, MapPin, Ticket } from "lucide-react"

interface EventosPageProps {
  searchParams: Promise<{ municipio?: string; gratis?: string }>
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d)
}

export default async function EventosPage({ searchParams }: EventosPageProps) {
  const { municipio, gratis } = await searchParams
  const municipalities = await getMunicipalities().catch(() => [] as Awaited<ReturnType<typeof getMunicipalities>>)
  const muniById = new Map((municipalities as { id: string; name: string; slug: string }[]).map((m) => [m.id, m.name]))
  const muniBySlug = new Map((municipalities as { id: string; name: string; slug: string }[]).map((m) => [m.slug, m.id]))

  const municipalityId = municipio ? muniBySlug.get(municipio) : undefined
  const freeOnly = gratis === "1"
  const events = await getUpcomingEvents({ municipalityId, freeOnly })

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f8f9ff]" style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}>
        <section className="bg-gradient-to-br from-[#003527] via-[#064e3b] to-[#006c49] py-14 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Eventos en la Zona Metropolitana</h1>
            <p className="mt-2 max-w-2xl text-white/85">
              Descubre qué hacer cerca de ti: conciertos, cultura, talleres y actividades —muchas gratuitas— en Guadalajara y municipios.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Filtros */}
          <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Municipio</label>
              <select name="municipio" defaultValue={municipio || ""} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="">Todos</option>
                {(municipalities as { id: string; name: string; slug: string }[]).map((m) => (
                  <option key={m.id} value={m.slug}>{m.name}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              <input type="checkbox" name="gratis" value="1" defaultChecked={freeOnly} />
              Solo gratuitos
            </label>
            <button type="submit" className="rounded-lg bg-[#003527] px-5 py-2 text-sm font-semibold text-white hover:opacity-95">
              Filtrar
            </button>
          </form>

          {events.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-gray-500">No hay eventos próximos con estos filtros. Vuelve pronto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/eventos/${ev.slug}`}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-[#064e3b] to-[#006c49]">
                    {ev.coverImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ev.coverImageUrl} alt={ev.title} className="h-full w-full object-cover" />
                    )}
                    <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold ${ev.isFree ? "bg-[#4edea3] text-[#003527]" : "bg-white/90 text-gray-800"}`}>
                      {ev.isFree ? "Gratis" : ev.priceText || "De pago"}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-700">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {fmtDate(ev.startAt)}
                    </div>
                    <h3 className="mt-1 line-clamp-2 font-bold text-gray-900 group-hover:text-green-800">{ev.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      {ev.venueName && (
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{ev.venueName}</span>
                      )}
                      {ev.municipalityId && muniById.get(ev.municipalityId) && (
                        <span>{muniById.get(ev.municipalityId)}</span>
                      )}
                      {ev.category && (
                        <span className="inline-flex items-center gap-1"><Ticket className="h-3.5 w-3.5" />{ev.category}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
