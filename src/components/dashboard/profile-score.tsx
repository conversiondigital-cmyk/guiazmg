"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "@/lib/icons"

interface ProfileScoreCardProps {
  business: {
    name?: string
    description?: string | null
    shortDescription?: string | null
    logo?: string | null
    coverImage?: string | null
    phone?: string | null
    whatsapp?: string | null
    email?: string | null
    websiteUrl?: string | null
    facebookUrl?: string | null
    instagramUrl?: string | null
    addressText?: string | null
    latitude?: number | null
    longitude?: number | null
    hours?: { id: string }[]
    images?: { id: string }[]
  } | null
}

export function ProfileScoreCard({ business }: ProfileScoreCardProps) {
  if (!business) return null

  const checks = [
    { label: "Logo / Portada", ok: !!(business.logo || business.coverImage) },
    { label: "Descripción", ok: !!business.description },
    { label: "Teléfono", ok: !!business.phone },
    { label: "WhatsApp", ok: !!business.whatsapp },
    { label: "Email", ok: !!business.email },
    { label: "Sitio web / Redes", ok: !!(business.websiteUrl || business.facebookUrl || business.instagramUrl) },
    { label: "Dirección", ok: !!business.addressText },
    { label: "Ubicación (mapa)", ok: !!(business.latitude && business.longitude) },
    { label: "Horarios", ok: !!(business.hours && business.hours.length > 0) },
    { label: "Galería de imágenes", ok: !!(business.images && business.images.length > 0) },
  ]

  const completed = checks.filter((c) => c.ok).length
  const total = checks.length
  const percentage = Math.round((completed / total) * 100)

  const getColor = () => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 50) return "text-amber-600"
    return "text-red-600"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Score del Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center">
          <span className={`text-3xl font-bold ${getColor()}`}>{percentage}%</span>
          <p className="text-xs text-gray-500 mt-1">
            {percentage >= 80
              ? "¡Perfil completo!"
              : percentage >= 50
              ? "Vas por buen camino"
              : "Completa tu perfil"}
          </p>
        </div>
        <div className="space-y-1.5">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{c.label}</span>
              {c.ok ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <X className="h-3.5 w-3.5 text-gray-300" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
