"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Check } from "@/lib/icons"

export function ClaimForm({ businessId, businessName, businessSlug }: { businessId: string; businessName: string; businessSlug: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claim-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, businessName, message: "Solicito reclamar este negocio" }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setDone(true)
      toast.success("Solicitud enviada. Revisaremos tu petición.")
    } catch { toast.error("Error al enviar") }
    finally { setLoading(false) }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <Check className="h-12 w-12 text-green-500 mx-auto" />
          <p className="font-medium">Solicitud enviada</p>
          <p className="text-sm text-gray-500">Revisaremos tu solicitud y te notificaremos cuando sea aprobada.</p>
            <Button variant="outline" onClick={() => router.push(`/perfil/${businessSlug}`)}>
            Volver al perfil
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            Al reclamar este perfil, podrás editar su información, responder reseñas y acceder al dashboard.
          </div>
        <div className="space-y-2 text-sm">
          <p><strong>Perfil:</strong> {businessName}</p>
          <p className="text-gray-500 text-xs">Tu solicitud será revisada por nuestro equipo. Te notificaremos por correo electrónico.</p>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {loading ? "Enviando..." : "Solicitar reclamación"}
        </Button>
      </CardContent>
    </Card>
  )
}
