"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CreditCard } from "@/lib/icons"

interface Props {
  businessId: string
  initialCancelAtPeriodEnd: boolean
  periodEnd: string // fecha ya formateada (es-MX)
}

// Gestión de la suscripción. El interruptor "Cancelar al final del período" marca
// que NO se renueve (se refleja en Stripe); el negocio sigue activo hasta la fecha
// de término. El botón abre el portal de Stripe para cambiar la tarjeta o cancelar.
export function CancelMembershipToggle({ businessId, initialCancelAtPeriodEnd, periodEnd }: Props) {
  const router = useRouter()
  const [checked, setChecked] = useState(initialCancelAtPeriodEnd)
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const onToggle = async (next: boolean) => {
    setChecked(next) // optimista
    setLoading(true)
    try {
      const res = await fetch("/api/dashboard/membership/cancel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, cancelAtPeriodEnd: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast.success(
          next
            ? "Tu suscripción no se renovará al terminar el período."
            : "Tu suscripción seguirá renovándose.",
        )
        router.refresh()
      } else {
        setChecked(!next) // revertir
        toast.error(data.error ?? "No se pudo actualizar la membresía")
      }
    } catch {
      setChecked(!next)
      toast.error("No se pudo actualizar la membresía")
    } finally {
      setLoading(false)
    }
  }

  // Abre el portal de facturación de Stripe (cambiar tarjeta, ver recibos, cancelar).
  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/payments/stripe/portal", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error ?? "No se pudo abrir el portal de facturación")
        setPortalLoading(false)
      }
    } catch {
      toast.error("No se pudo abrir el portal de facturación")
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white/60 p-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <Switch checked={checked} onCheckedChange={onToggle} disabled={loading} className="mt-0.5" />
        <span className="text-sm">
          <span className="font-medium text-gray-700">Cancelar al final del período</span>
          <span className="mt-0.5 block text-xs text-gray-500">
            {checked
              ? `No se renovará. Tu plan permanece activo hasta el ${periodEnd}.`
              : `Se renueva automáticamente. Próximo cobro previsto el ${periodEnd}.`}
          </span>
        </span>
      </label>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openPortal}
        disabled={portalLoading}
        className="w-full"
      >
        {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Administrar suscripción (tarjeta / cancelar)
      </Button>
    </div>
  )
}
