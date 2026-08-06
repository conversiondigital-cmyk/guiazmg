"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BadgeCheck, Clock, ShieldX, ShieldQuestion, Loader2 } from "lucide-react"
import type { VerificationMode } from "@/lib/verification-config"

interface VerificationCardProps {
  businessId: string
  status: string
  isVerified: boolean
  mode: VerificationMode
}

export function VerificationCard({ businessId, status, isVerified, mode }: VerificationCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const verified = isVerified || status === "VERIFIED"
  const pending = status === "PENDING"
  const rejected = status === "REJECTED"

  async function request() {
    setLoading(true)
    try {
      const res = await fetch("/api/business/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo enviar la solicitud")
        return
      }
      toast.success("Solicitud enviada. Te avisaremos cuando se revise.")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const badge = verified ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
      <BadgeCheck className="h-4 w-4" /> Verificado
    </span>
  ) : pending ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
      <Clock className="h-4 w-4" /> En revisión
    </span>
  ) : rejected ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
      <ShieldX className="h-4 w-4" /> Rechazada
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
      <ShieldQuestion className="h-4 w-4" /> Sin verificar
    </span>
  )

  const canRequest = mode === "manual" && !verified && !pending

  // Contenido compacto según el estado (icono + título + subtítulo en una fila).
  const view = verified
    ? { Icon: BadgeCheck, iconCls: "bg-green-100 text-green-700", title: "Negocio verificado", text: "Tu insignia de Verificado aparece en tu perfil público y genera más confianza." }
    : pending
      ? { Icon: Clock, iconCls: "bg-amber-100 text-amber-700", title: "Verificación en revisión", text: "Te avisaremos en cuanto el equipo la apruebe o rechace." }
      : rejected
        ? { Icon: ShieldX, iconCls: "bg-red-100 text-red-700", title: "Verificación rechazada", text: "Revisa que tus datos (nombre, dirección, teléfono) sean correctos y vuelve a solicitarla." }
        : { Icon: ShieldQuestion, iconCls: "bg-gray-100 text-gray-600", title: "Negocio sin verificar", text: mode === "manual" ? "Solicita la verificación para mostrar la insignia de Verificado y generar más confianza." : "El equipo de Guía ZMG verifica los negocios. Mantén tu información completa para agilizar el proceso." }
  const { Icon } = view

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${view.iconCls}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{view.title}</p>
            <p className="text-xs text-muted-foreground">{view.text}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
          {badge}
          {canRequest && (
            <Button size="sm" onClick={request} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
              {rejected ? "Volver a solicitar" : "Solicitar verificación"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
