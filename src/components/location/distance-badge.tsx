"use client"

import { MapPin, Loader2 } from "lucide-react"
import { useUserLocation } from "@/components/location/user-location"
import { haversineKm, formatDistance } from "@/lib/geo"

interface DistanceBadgeProps {
  lat?: number | null
  lng?: number | null
  // Si true, muestra un botón "Ver distancia" cuando aún no hay ubicación.
  interactive?: boolean
  className?: string
}

export function DistanceBadge({ lat, lng, interactive = false, className = "" }: DistanceBadgeProps) {
  const { coords, loading, requestLocation } = useUserLocation()

  if (lat == null || lng == null) return null

  if (coords) {
    const km = haversineKm(coords.lat, coords.lng, lat, lng)
    return (
      <span className={`inline-flex items-center gap-1 font-medium text-green-700 ${className}`}>
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        {formatDistance(km)}
      </span>
    )
  }

  if (!interactive) return null

  return (
    <button
      type="button"
      onClick={requestLocation}
      disabled={loading}
      className={`inline-flex items-center gap-1 font-medium text-green-700 hover:underline disabled:opacity-60 ${className}`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
      Ver distancia
    </button>
  )
}
