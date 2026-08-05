"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check, ArrowRight, CreditCard } from "@/lib/icons"
import { getPlanBySlug } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [loading, setLoading] = useState<"STRIPE" | "MERCADO_PAGO" | null>(null)

  const plan = searchParams.get("plan")
  const businessId = searchParams.get("businessId")

  const membershipPlan = getPlanBySlug(plan)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=/checkout?plan=${plan || ""}&businessId=${businessId || ""}`)
    }
  }, [status, router, plan, businessId])

  // Un solo handler para ambos proveedores. Stripe y Mercado Pago comparten el
  // mismo externalReference (membership:plan:userId:businessId) y el mismo
  // fulfillment vía webhook; solo cambia a qué endpoint se pide la sesión y qué
  // campo trae la URL de redirección (Stripe: `url`; MP: `initPoint`).
  const pay = async (provider: "STRIPE" | "MERCADO_PAGO") => {
    if (!membershipPlan) return
    setLoading(provider)
    try {
      if (provider === "STRIPE") {
        const res = await fetch("/api/payments/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, businessId }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.url) {
          toast.error(data.error || "Error al procesar el pago")
          return
        }
        window.location.href = data.url
        return
      }

      const res = await fetch("/api/payments/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "membership", plan, ...(businessId ? { businessId } : {}) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Error al procesar el pago")
        return
      }
      const data = await res.json()
      if (data.initPoint) {
        window.location.href = data.initPoint
      }
    } catch {
      toast.error("Error al procesar el pago")
    } finally {
      setLoading(null)
    }
  }

  if (status === "loading") {
    return (
      <>
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
        </main>
        <Footer />
      </>
    )
  }

  if (!membershipPlan) {
    return (
      <>
        <Header />
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
          <h1 className="text-2xl font-bold">Selección inválida</h1>
          <p className="text-gray-500">No se encontró el plan o paquete seleccionado.</p>
          <Link href="/planes">
            <Button>Ver planes</Button>
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <section className="bg-gradient-to-br from-[#003527] via-[#064e3b] to-[#006c49] py-20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-white">Confirmar compra</h1>
            <p className="mt-4 text-xl text-white/85">
              Revisa los detalles antes de continuar
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle>
                  {membershipPlan
                    ? `Plan ${membershipPlan.name}`
                    : "Selección inválida"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {membershipPlan && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Precio mensual</span>
                      <span className="text-2xl font-bold">{formatCurrency(membershipPlan.price)}</span>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Incluye:</p>
                      <ul className="space-y-2">
                        {membershipPlan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    className="w-full bg-slate-900 hover:bg-slate-800"
                    size="lg"
                    onClick={() => pay("STRIPE")}
                    disabled={loading !== null}
                  >
                    {loading === "STRIPE" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pagar con tarjeta
                      </>
                    )}
                  </Button>
                  <Button
                    className="w-full bg-sky-600 hover:bg-sky-700"
                    size="lg"
                    onClick={() => pay("MERCADO_PAGO")}
                    disabled={loading !== null}
                  >
                    {loading === "MERCADO_PAGO" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Mercado Pago
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-400">
                  Serás redirigido a la pasarela segura del método que elijas
                  (tarjeta con Stripe, o Mercado Pago) para completar el pago.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
        </main>
        <Footer />
      </>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
