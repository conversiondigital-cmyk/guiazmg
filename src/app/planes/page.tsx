export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, ArrowRight, Star, TrendingUp, Crown } from "@/lib/icons"
import Link from "next/link"
import { MEMBERSHIP_PLANS } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"

const comparisonRows = [
  { label: "Perfil de negocio", free: true, basic: true, professional: true },
  { label: "Fotos del negocio", free: "3", basic: "10", professional: "Ilimitadas" },
  { label: "Enlace a WhatsApp", free: true, basic: true, professional: true },
  { label: "Enlace a redes sociales", free: true, basic: true, professional: true },
  { label: "Horarios de atención", free: true, basic: true, professional: true },
  { label: "Ubicación en mapa", free: true, basic: true, professional: true },
  { label: "Prioridad en búsquedas", free: false, basic: "Media", professional: "Alta" },
  { label: "Destacado en homepage", free: false, basic: "1 día/mes", professional: "7 días/mes" },
  { label: "Estadísticas de negocio", free: false, basic: true, professional: true },
  { label: "Soporte prioritario", free: false, basic: false, professional: true },
  { label: "Sin marca de agua", free: false, basic: true, professional: true },
  { label: "Badge verificado", free: false, basic: true, professional: true },
  { label: "Cupones y promociones", free: false, basic: true, professional: true },
  { label: "Múltiples sucursales", free: false, basic: false, professional: true },
]

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-green-500 mx-auto" />
    ) : (
      <X className="h-5 w-5 text-gray-300 mx-auto" />
    )
  }
  return <span className="text-sm text-gray-700">{value}</span>
}

export default function PlansPage() {
  const plans = Object.entries(MEMBERSHIP_PLANS)

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-white">Planes para tu negocio</h1>
            <p className="mt-4 text-xl text-blue-100">
              Elige el plan ideal para hacer crecer tu negocio en la ZMG
            </p>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {plans.map(([key, plan]) => (
                <Card key={key} className={`relative ${key === "PROFESSIONAL" ? "border-blue-500 shadow-lg scale-105" : ""}`}>
                  {key === "PROFESSIONAL" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1">Recomendado</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      {key === "FREE" && <Star className="h-5 w-5 text-gray-400" />}
                      {key === "BASIC" && <TrendingUp className="h-5 w-5 text-blue-500" />}
                      {key === "PROFESSIONAL" && <Crown className="h-5 w-5 text-amber-500" />}
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                    </div>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                      <span className="text-gray-500 ml-1">/mes</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={`/checkout?plan=${key}`} className="mt-6 block">
                      <Button
                        className={`w-full ${
                          key === "PROFESSIONAL"
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-900 hover:bg-gray-800"
                        }`}
                      >
                        Seleccionar plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-10">Compara todos los planes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-4 pr-4 text-sm font-semibold text-gray-900 w-1/3">Característica</th>
                    {plans.map(([key, plan]) => (
                      <th key={key} className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-3 pr-4 text-sm text-gray-700 font-medium">{row.label}</td>
                      <td className="py-3 px-4 text-center"><CellValue value={row.free} /></td>
                      <td className="py-3 px-4 text-center"><CellValue value={row.basic} /></td>
                      <td className="py-3 px-4 text-center"><CellValue value={row.professional} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
