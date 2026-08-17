"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CreditCard } from "@/lib/icons"

// Abre el portal de facturación de Stripe (historial de facturas + PDF, tarjeta,
// cancelar). Reutilizable en Pagos y en Membresía. Requiere que el usuario tenga
// una suscripción de pago (cliente de Stripe guardado); si no, el endpoint responde
// con un mensaje claro.
export function BillingPortalButton({
  label = "Ver recibos y facturas",
  className,
}: {
  label?: string
  className?: string
}) {
  const [loading, setLoading] = useState(false)

  const open = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/payments/stripe/portal", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error ?? "No se pudo abrir el portal de facturación")
        setLoading(false)
      }
    } catch {
      toast.error("No se pudo abrir el portal de facturación")
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={open} disabled={loading} className={className}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      {label}
    </Button>
  )
}
