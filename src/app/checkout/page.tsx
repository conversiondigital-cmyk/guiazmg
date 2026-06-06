"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check, ArrowRight } from "@/lib/icons"
import { MEMBERSHIP_PLANS } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)

  const plan = searchParams.get("plan")
  const businessId = searchParams.get("businessId")

  const membershipPlan = plan ? MEMBERSHIP_PLANS[plan as keyof typeof MEMBERSHIP_PLANS] : null

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=/checkout?plan=${plan || ""}&businessId=${businessId || ""}`)
    }
  }, [status, router, plan, businessId])

  const handlePayment = async () => {
    setLoading(true)
    try {
      const body: Record<string, unknown> = {}

      if (membershipPlan) {
        body.type = "membership"
        body.plan = plan
        if (businessId) body.businessId = businessId
      } else {
        return
      }

      const res = await fetch("/api/payments/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Error al procesar el pago")
        return
      }

      const data = await res.json()
      if (data.initPoint) {
        window.location.href = data.initPoint
      }
    } catch {
      alert("Error al procesar el pago")
    } finally {
      setLoading(false)
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
        <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-white">Confirmar compra</h1>
            <p className="mt-4 text-xl text-blue-100">
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

                <Button
                  className="w-full bg-green-700 hover:bg-green-800"
                  size="lg"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Pagar con Mercado Pago
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-400">
                  Al hacer clic en &quot;Pagar&quot; serás redirigido a Mercado Pago para completar
                  el pago de forma segura.
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
