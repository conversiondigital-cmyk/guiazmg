// Hub "Agenda": fusiona Eventos + Promociones en una sola entrada de menú.
// Las páginas /eventos y /promociones siguen existiendo con sus filtros y deep-links;
// aquí se muestra un resumen de ambas. ISR 5 min.
export const revalidate = 300

import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { prisma } from "@/lib/prisma"
import { getUpcomingEvents } from "@/lib/events"
import { getMunicipalities } from "@/lib/queries"
import { CalendarDays, MapPin, Ticket, Tag, Clock, Gift, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Agenda",
  description:
    "Eventos y promociones en la Zona Metropolitana de Guadalajara: qué hacer cerca de ti y las mejores ofertas de negocios locales.",
}

function fmtDateTime(d: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d))
}
const fmtDate = (d: Date) => new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "long" })

type PromoCard = {
  id: string
  title: string
  description: string | null
  code: string | null
  endDate: Date | null
  profile: { name: string; slug: string; category: { name: string } | null }
}

export default async function AgendaPage() {
  const now = new Date()

  const [events, municipalities, promotions] = await Promise.all([
    getUpcomingEvents({ take: 6 }).catch(() => [] as Awaited<ReturnType<typeof getUpcomingEvents>>),
    getMunicipalities().catch(() => [] as Awaited<ReturnType<typeof getMunicipalities>>),
    prisma.coupon
      .findMany({
        where: {
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gte: now } }],
          profile: { status: "ACTIVE", deletedAt: null },
        },
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          endDate: true,
          profile: { select: { name: true, slug: true, category: { select: { name: true } } } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 6,
      })
      .catch(() => [] as PromoCard[]),
  ])

  const muniById = new Map(
    (municipalities as { id: string; name: string; slug: string }[]).map((m) => [m.id, m.name]),
  )

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f8f9ff]">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#003527] via-[#064e3b] to-[#006c49] py-14 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#7ff0c0]">Agenda</p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Eventos y promociones cerca de ti
            </h1>
            <p className="mt-2 max-w-2xl text-white/85">
              Qué hacer en la Zona Metropolitana y las mejores ofertas de los negocios locales, en un solo lugar.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="#eventos"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/25 transition-colors"
              >
                <CalendarDays className="h-4 w-4" /> Eventos
              </a>
              <a
                href="#promociones"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/25 transition-colors"
              >
                <Tag className="h-4 w-4" /> Promociones
              </a>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* ===== Eventos ===== */}
          <section id="eventos" className="scroll-mt-20">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                  <CalendarDays className="h-6 w-6 text-green-700" /> Eventos
                </h2>
                <p className="mt-1 text-sm text-gray-500">Conciertos, cultura, talleres y actividades —muchas gratuitas.</p>
              </div>
              <Link
                href="/eventos"
                className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-900 sm:flex"
              >
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
                <CalendarDays className="mx-auto h-9 w-9 text-gray-300" />
                <p className="mt-3 text-gray-500">Aún no hay eventos próximos. Vuelve pronto.</p>
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
                        <img src={ev.coverImageUrl} alt={ev.title} loading="lazy" className="h-full w-full object-cover" />
                      )}
                      <span
                        className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          ev.isFree ? "bg-[#4edea3] text-[#003527]" : "bg-white/90 text-gray-800"
                        }`}
                      >
                        {ev.isFree ? "Gratis" : ev.priceText || "De pago"}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-green-700">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {fmtDateTime(ev.startAt)}
                      </div>
                      <h3 className="mt-1 line-clamp-2 font-bold text-gray-900 group-hover:text-green-800">{ev.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        {ev.venueName && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {ev.venueName}
                          </span>
                        )}
                        {ev.municipalityId && muniById.get(ev.municipalityId) && (
                          <span>{muniById.get(ev.municipalityId)}</span>
                        )}
                        {ev.category && (
                          <span className="inline-flex items-center gap-1">
                            <Ticket className="h-3.5 w-3.5" />
                            {ev.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 sm:hidden">
              <Link
                href="/eventos"
                className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-900"
              >
                Ver todos los eventos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* ===== Promociones ===== */}
          <section id="promociones" className="mt-14 scroll-mt-20">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                  <Tag className="h-6 w-6 text-amber-500" /> Promociones y ofertas
                </h2>
                <p className="mt-1 text-sm text-gray-500">Cupones y ofertas reales de negocios registrados en Guía ZMG.</p>
              </div>
              <Link
                href="/promociones"
                className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-900 sm:flex"
              >
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {promotions.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
                <Tag className="mx-auto h-9 w-9 text-gray-300" />
                <p className="mt-3 text-gray-500">Aún no hay promociones activas. Vuelve pronto.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(promotions as PromoCard[]).map((promo) => (
                  <div
                    key={promo.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {promo.profile.category?.name && (
                            <span className="mb-2 inline-flex rounded-full bg-green-700 px-2.5 py-0.5 text-[11px] font-bold text-white">
                              {promo.profile.category.name}
                            </span>
                          )}
                          <h3 className="text-base font-bold text-gray-900">{promo.title}</h3>
                          <p className="mt-0.5 text-sm font-semibold text-gray-700">{promo.profile.name}</p>
                        </div>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                          <Tag className="h-5 w-5 text-amber-600" />
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      {promo.description && <p className="text-sm text-gray-600">{promo.description}</p>}
                      {promo.code && (
                        <div className="mt-3">
                          <span className="text-xs text-gray-500">Código: </span>
                          <code className="rounded bg-amber-100 px-2 py-0.5 font-mono text-sm text-amber-800">
                            {promo.code}
                          </code>
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-4 w-4" />
                        {promo.endDate ? `Válido hasta ${fmtDate(promo.endDate)}` : "Sin fecha límite"}
                      </div>
                      <Link
                        href={`/perfil/${promo.profile.slug}`}
                        className="mt-4 block rounded-lg bg-green-800 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-green-900"
                      >
                        Ver negocio
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 sm:hidden">
              <Link
                href="/promociones"
                className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-900"
              >
                Ver todas las promociones <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* CTA negocios */}
          <section className="mt-14">
            <Link
              href="/promociones/registro"
              className="group flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#006c49] to-[#00583b] p-6 shadow-lg transition-shadow hover:shadow-xl"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                  <Gift className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-lg font-bold text-white sm:text-xl">¿Tienes un negocio? Pruébalo 60 días gratis</p>
                  <p className="mt-0.5 text-sm text-white/80">
                    Publica tus eventos y promociones para llegar a más clientes de tu zona.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#006c49] transition-transform group-hover:translate-x-0.5">
                Ver promoción <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
