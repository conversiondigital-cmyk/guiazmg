"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface Props {
  businessId: string
  initialCancelAtPeriodEnd: boolean
  periodEnd: string // fecha ya formateada (es-MX)
}

// Interruptor "Cancelar al final del período". Como las membresías son de pago
// único (sin renovación automática), activarlo solo registra la intención de no
// renovar y ajusta el mensaje; el negocio sigue activo hasta la fecha de término.
export function CancelMembershipToggle({ businessId, initialCancelAtPeriodEnd, periodEnd }: Props) {
  const router = useRouter()
  const [checked, setChecked] = useState(initialCancelAtPeriodEnd)
  const [loading, setLoading] = useState(false)

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
            ? "Tu membresía no se renovará al terminar el período."
            : "Tu membresía seguirá activa.",
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

  return (
    <div className="rounded-lg border border-gray-200 bg-white/60 p-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <Switch checked={checked} onCheckedChange={onToggle} disabled={loading} className="mt-0.5" />
        <span className="text-sm">
          <span className="font-medium text-gray-700">Cancelar al final del período</span>
          <span className="mt-0.5 block text-xs text-gray-500">
            {checked
              ? `No se renovará. Tu plan permanece activo hasta el ${periodEnd}.`
              : `Tu plan seguirá disponible. Renovación prevista el ${periodEnd}.`}
          </span>
        </span>
      </label>
    </div>
  )
}
