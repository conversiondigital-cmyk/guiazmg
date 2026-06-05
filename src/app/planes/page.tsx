export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Star, TrendingUp, Briefcase, Crown, Zap } from "@/lib/icons"
import Link from "next/link"
import { MEMBERSHIP_PLANS } from "@/lib/constants"

const comparisonRows = [
  { label: "Perfiles comerciales", gratuito: "1", emprendedor: "1", negocio: "1", premium: "1" },
  { label: "Productos en catálogo", gratuito: "10", emprendedor: "100", negocio: "100", premium: "200" },
  { label: "Servicios en catálogo", gratuito: "—", emprendedor: "20", negocio: "100", premium: "200" },
  { label: "Promociones activas", gratuito: "1", emprendedor: "3", negocio: "10", premium: true },
  { label: "Botón de WhatsApp", gratuito: true, emprendedor: true, negocio: true, premium: true },
  { label: "Botón de llamada", gratuito: true, emprendedor: true, negocio: true, premium: true },
  { label: "Galería de fotos", gratuito: "3", emprendedor: "15", negocio: "30", premium: "50" },
  { label: "Redes sociales", gratuito: false, emprendedor: true, negocio: true, premium: true },
  { label: "Sitio web propio", gratuito: false, emprendedor: false, negocio: true, premium: true },
  { label: "Reseñas habilitadas", gratuito: false, emprendedor: false, negocio: true, premium: true },
  { label: "Estadísticas", gratuito: "Básicas", emprendedor: "Básicas", negocio: "Completas", premium: "Avanzadas" },
  { label: "Verificación de negocio", gratuito: false, emprendedor: false, negocio: true, premium: true },
  { label: "Insignia premium", gratuito: false, emprendedor: false, negocio: false, premium: true },
  { label: "Soporte prioritario", gratuito: false, emprendedor: false, negocio: false, premium: true },
  { label: "Boost adicional", gratuito: "Desde $49", emprendedor: "Desde $49", negocio: "Desde $49", premium: "Desde $49" },
]

type CellVal = boolean | string

function CellValue({ value }: { value: CellVal }) {
  if (value === true) return <Check className="h-5 w-5 text-green-500 mx-auto" />
  if (value === false) return <X className="h-5 w-5 text-gray-300 mx-auto" />
  return <span className="text-sm text-gray-700">{value}</span>
}

const planIcons = {
  GRATUITO: Star,
  EMPRENDEDOR: TrendingUp,
  NEGOCIO: Briefcase,
  PREMIUM: Crown,
}

const planColors = {
  GRATUITO: "text-gray-500",
  EMPRENDEDOR: "text-blue-500",
  NEGOCIO: "text-indigo-600",
  PREMIUM: "text-amber-500",
}

export default function PlansPage() {
  const plans = Object.entries(MEMBERSHIP_PLANS) as [keyof typeof MEMBERSHIP_PLANS, typeof MEMBERSHIP_PLANS[keyof typeof MEMBERSHIP_PLANS]][]

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">Planes para tu negocio</h1>
            <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
              Desde emprendedores que venden desde casa hasta negocios locales establecidos.
              Hay un plan para cada uno.
            </p>
          </div>
        </section>

        {/* Boost banner */}
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-sm text-amber-800">
            <Zap className="h-4 w-4 shrink-0" />
            <span>
              <strong>Boost adicional</strong> — Aparece primero en tu zona por $49 (7 días), $99 (15 días) o $149 (30 días). Disponible en todos los planes.
            </span>
          </div>
        </div>

        {/* Pricing cards */}
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map(([key, plan]) => {
                const Icon = planIcons[key]
                const iconColor = planColors[key]
                const isRecommended = key === "NEGOCIO"
                return (
                  <Card
                    key={key}
                    className={`relative flex flex-col ${
                      isRecommended ? "border-blue-500 shadow-xl ring-2 ring-blue-500" : ""
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white px-4 py-1 text-xs">Más popular</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                      </div>
                      <p className="text-xs text-gray-500">{plan.tagline}</p>
                      <div className="mt-4">
                        {plan.price === 0 ? (
                          <span className="text-3xl font-bold text-gray-900">Gratis</span>
                        ) : (
                          <>
                            <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                            <span className="text-gray-500 text-sm ml-1">MXN/mes</span>
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <ul className="space-y-2.5 flex-1">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={plan.price === 0 ? "/auth/register" : `/checkout?plan=${plan.slug}`}
                        className="mt-6 block"
                      >
                        <Button
                          className={`w-full ${
                            isRecommended
                              ? "bg-blue-600 hover:bg-blue-700"
                              : plan.price === 0
                              ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                              : "bg-gray-900 hover:bg-gray-800"
                          }`}
                          variant={plan.price === 0 ? "outline" : "default"}
                        >
                          {plan.price === 0 ? "Crear cuenta gratis" : `Empezar por $${plan.price}/mes`}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-2">Compara todos los planes</h2>
            <p className="text-center text-gray-500 text-sm mb-10">Sin contratos. Cancela cuando quieras.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-4 pr-4 text-sm font-semibold text-gray-900 w-2/5">Característica</th>
                    {plans.map(([key, plan]) => (
                      <th key={key} className="py-4 px-3 text-center text-sm font-semibold text-gray-900">
                        {plan.name}
                        {plan.price > 0 && (
                          <div className="text-xs font-normal text-gray-400">${plan.price}/mes</div>
                        )}
                        {plan.price === 0 && (
                          <div className="text-xs font-normal text-gray-400">Gratis</div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-3 pr-4 text-sm text-gray-700 font-medium">{row.label}</td>
                      <td className="py-3 px-3 text-center"><CellValue value={row.gratuito} /></td>
                      <td className="py-3 px-3 text-center"><CellValue value={row.emprendedor} /></td>
                      <td className="py-3 px-3 text-center"><CellValue value={row.negocio} /></td>
                      <td className="py-3 px-3 text-center"><CellValue value={row.premium} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-blue-600">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white">¿Listo para empezar?</h2>
            <p className="mt-3 text-blue-100 text-lg">
              Crea tu perfil gratis y empieza a aparecer en la ZMG hoy mismo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                  Crear cuenta gratis
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                  Ver Emprendedor $49/mes
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
