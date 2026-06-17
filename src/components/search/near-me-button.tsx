"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Navigation, Loader2, X } from "lucide-react"
import { toast } from "sonner"

// Clave para recordar la última ubicación concedida (se reutiliza sin volver a pedir permiso).
const GEO_KEY = "guiazmg:geo"

interface NearMeButtonProps {
  // Texto de búsqueda a conservar al ir a /search (útil desde el hero del inicio).
  query?: string
  className?: string
  size?: "sm" | "default" | "lg"
}

export function NearMeButton({ query, className = "", size = "sm" }: NearMeButtonProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const active = !!(searchParams.get("lat") && searchParams.get("lng"))

  function goTo(lat: number, lng: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (query !== undefined && query.trim()) params.set("q", query.trim())
    params.set("lat", lat.toFixed(6))
    params.set("lng", lng.toFixed(6))
    params.set("sort", "distance")
    params.delete("page")
    router.push(`/search?${params.toString()}`)
  }

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Tu navegador no soporta ubicación")
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          localStorage.setItem(GEO_KEY, JSON.stringify({ lat: latitude, lng: longitude }))
        } catch {}
        setLoading(false)
        goTo(latitude, longitude)
      },
      (err) => {
        setLoading(false)
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Activa el permiso de ubicación para buscar cerca de ti"
            : "No pudimos obtener tu ubicación"
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("lat")
    params.delete("lng")
    if (params.get("sort") === "distance") params.delete("sort")
    params.delete("page")
    router.push(`/search?${params.toString()}`)
  }

  if (active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">
        <Navigation className="h-4 w-4" />
        Cerca de ti
        <button
          type="button"
          onClick={clear}
          aria-label="Quitar ubicación"
          className="ml-1 rounded p-0.5 hover:bg-green-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={locate}
      disabled={loading}
      className={className}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
      Cerca de mí
    </Button>
  )
}
