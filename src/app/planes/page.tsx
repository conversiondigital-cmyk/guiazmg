export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, TrendingUp, Briefcase, Zap, Gift } from "@/lib/icons"
import Link from "next/link"
import { MEMBERSHIP_PLANS, BOOSTS } from "@/lib/constants"

type CellVal = boolean | string
const comparisonRows: { label: string; emprendimiento: CellVal; negocio: CellVal }[] = [
  { label: "Perfiles comerciales", emprendimiento: "1", negocio: "1" },
  { label: "Productos en catálogo", emprendimiento: "100", negocio: "100" },
  { label: "Servicios en catálogo", emprendimiento: "20", negocio: "100" },
  { label: "Promociones activas", emprendimiento: "3", negocio: "10" },
  { label: "WhatsApp y teléfono", emprendimiento: true, negocio: true },
  { label: "Ubicación", emprendimiento: "Colonia/municipio", negocio: "Dirección exacta" },
  { label: "Horarios y zona de cobertura", emprendimiento: false, negocio: true },
  { label: "Redes sociales", emprendimiento: false, negocio: true },
  { label: "Sitio web propio", emprendimiento: false, negocio: true },
  { label: "Galería de fotos", emprendimiento: "Básica", negocio: "Ampliada" },
  { label: "Reseñas", emprendimiento: false, negocio: true },
  { label: "Estadísticas", emprendimiento: "Básicas", negocio: "Completas + leads" },
  { label: "Verificación de negocio", emprendimiento: false, negocio: true },
  { label: "Posicionamiento", emprendimiento: "Estándar", negocio: "Prioritario" },
  { label: "Boost disponible", emprendimiento: "Desde $49", negocio: "Desde $49" },
]

const planMeta = {
  EMPRENDIMIENTO: { icon: TrendingUp, color: "text-[#0f7a52]" },
  NEGOCIO: { icon: Briefcase, color: "text-[#003527]" },
} as const

function Cell({ value }: { value: CellVal }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-green-600" />
  if (value === false) return <X className="mx-auto h-5 w-5 text-gray-300" />
  return <span className="text-sm text-gray-700">{value}</span>
}

export default function PlansPage() {
  const plans = Object.entries(MEMBERSHIP_PLANS) as [
    keyof typeof MEMBERSHIP_PLANS,
    (typeof MEMBERSHIP_PLANS)[keyof typeof MEMBERSHIP_PLANS],
  ][]

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#003527] via-[#064e3b] to-[#006c49] py-20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">Planes para tu negocio</h1>
            <p className="mx-auto mt-4 max-w-2xl text-xl text-white/85">
              Desde quien vende por su cuenta hasta negocios establecidos. Dos planes, sin
              complicaciones.
            </p>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="bg-[#f8f9ff] py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {plans.map(([key, plan]) => {
                const meta = planMeta[key]
                const Icon = meta.icon
                const isRecommended = key === "NEGOCIO"
                return (
                  <Card
                    key={key}
                    className={`relative flex flex-col ${
                      isRecommended ? "border-[#006c49] shadow-xl ring-2 ring-[#006c49]" : ""
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-[#006c49] px-4 py-1 text-xs text-white">Más popular</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                      </div>
                      <p className="text-xs text-gray-500">{plan.tagline}</p>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                        <span className="ml-1 text-sm text-gray-500">MXN/mes</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col">
                      <ul className="flex-1 space-y-2.5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            <span className="text-sm text-gray-600">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href={`/checkout?plan=${plan.slug}`} className="mt-6 block">
                        <Button
                          className={`w-full text-white ${
                            isRecommended
                              ? "bg-[#006c49] hover:bg-[#00583b]"
                              : "bg-[#003527] hover:bg-[#00281e]"
                          }`}
                        >
                          Empezar por ${plan.price}/mes
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Cupón de prueba (se canjea al registrar el negocio) */}
            <div className="mx-auto mt-6 flex max-w-xl items-center justify-center gap-2 rounded-xl border border-[#006c49]/20 bg-white px-4 py-3 text-center text-sm text-[#003527]">
              <Gift className="h-4 w-4 shrink-0 text-[#006c49]" />
              <span>
                ¿Tienes un <strong>cupón de prueba</strong>? Aplícalo al registrar tu negocio para
                activar un plan gratis por tiempo limitado.
              </span>
            </div>
          </div>
        </section>

        {/* Boost */}
        <section className="border-y border-amber-200 bg-amber-50 py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                <Zap className="h-4 w-4" /> BOOST
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Aparece más arriba cuando lo necesites</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
                Pago único por duración. Aplica a perfil, producto, servicio o promoción. Sin
                créditos ni saldo interno.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {BOOSTS.map((b) => (
                <div key={b.days} className="rounded-2xl border border-amber-200 bg-white p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{b.name}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">${b.price}</p>
                  <p className="text-xs text-gray-500">{b.days} días</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-2 text-center text-2xl font-bold">Compara los planes</h2>
            <p className="mb-10 text-center text-sm text-gray-500">Sin contratos. Cancela cuando quieras.</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="w-2/5 py-4 pr-4 text-sm font-semibold text-gray-900">Característica</th>
                    {plans.map(([key, plan]) => (
                      <th key={key} className="px-3 py-4 text-center text-sm font-semibold text-gray-900">
                        {plan.name}
                        <div className="text-xs font-normal text-gray-400">${plan.price}/mes</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-3 pr-4 text-sm font-medium text-gray-700">{row.label}</td>
                      <td className="px-3 py-3 text-center"><Cell value={row.emprendimiento} /></td>
                      <td className="px-3 py-3 text-center"><Cell value={row.negocio} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#003527] py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white">¿Listo para aparecer en la ZMG?</h2>
            <p className="mt-3 text-lg text-white/80">Registra tu negocio y elige tu plan hoy mismo.</p>
            <div className="mt-8">
              <Link href="/registrar-negocio">
                <Button size="lg" className="bg-[#6ffbbe] px-8 font-bold text-[#003527] hover:bg-[#4edea3]">
                  Registrar mi negocio
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
