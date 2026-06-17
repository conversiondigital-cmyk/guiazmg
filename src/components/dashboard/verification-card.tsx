"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">Verificación del negocio</CardTitle>
        {badge}
      </CardHeader>
      <CardContent className="space-y-3">
        {verified && (
          <p className="text-sm text-muted-foreground">
            Tu negocio muestra la insignia de Verificado en su perfil público. Genera más confianza en
            los clientes.
          </p>
        )}
        {pending && (
          <p className="text-sm text-muted-foreground">
            Tu solicitud está en revisión. Te notificaremos en cuanto el equipo la apruebe o rechace.
          </p>
        )}
        {!verified && !pending && mode === "manual" && (
          <p className="text-sm text-muted-foreground">
            {rejected
              ? "Tu solicitud anterior fue rechazada. Revisa que tus datos (nombre, dirección, teléfono) sean correctos y vuelve a solicitarla."
              : "Solicita la verificación para mostrar la insignia de Verificado y generar más confianza."}
          </p>
        )}
        {!verified && mode === "quick" && (
          <p className="text-sm text-muted-foreground">
            El equipo de Guía ZMG verifica los negocios. Mantén tu información completa y actualizada
            para agilizar el proceso.
          </p>
        )}
        {canRequest && (
          <Button onClick={request} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            {rejected ? "Volver a solicitar" : "Solicitar verificación"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
