"use client"

import { useEffect, useRef, useState } from "react"

// Carga el script de Google Maps una sola vez por página.
let mapsPromise: Promise<void> | null = null
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  const w = window as unknown as { google?: { maps?: unknown } }
  if (w.google?.maps) return Promise.resolve()
  if (!mapsPromise) {
    mapsPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script")
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error("No se pudo cargar Google Maps. Revisa la API key."))
      document.head.appendChild(s)
    })
  }
  return mapsPromise
}

// Centro por defecto: Guadalajara.
const GDL = { lat: 20.6597, lng: -103.3496 }

interface Props {
  apiKey: string
  lat?: number | null
  lng?: number | null
  onChange: (lat: number, lng: number) => void
}

export function GoogleMapPicker({ apiKey, lat, lng, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [error, setError] = useState("")

  useEffect(() => {
    if (!apiKey) return
    let cancelled = false
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !ref.current) return
        const g = (window as any).google
        const center = lat != null && lng != null ? { lat, lng } : GDL
        const map = new g.maps.Map(ref.current, {
          center,
          zoom: lat != null ? 16 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        const marker = new g.maps.Marker({ position: center, map, draggable: true })
        mapRef.current = map
        markerRef.current = marker
        const emit = (pos: any) => onChangeRef.current(pos.lat(), pos.lng())
        marker.addListener("dragend", () => emit(marker.getPosition()))
        map.addListener("click", (e: any) => {
          marker.setPosition(e.latLng)
          emit(e.latLng)
        })
      })
      .catch((e) => setError(e?.message || "Error al cargar el mapa"))
    return () => {
      cancelled = true
    }
    // Solo se inicializa cuando cambia la key (lat/lng se sincronizan abajo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  // Si la lat/lng cambian desde fuera (p. ej. otro input), mueve el pin.
  useEffect(() => {
    if (markerRef.current && lat != null && lng != null) {
      const p = { lat, lng }
      markerRef.current.setPosition(p)
      mapRef.current?.panTo(p)
    }
  }, [lat, lng])

  if (!apiKey) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-muted-foreground">
        El mapa aún no está configurado. Un administrador debe agregar la API key de Google Maps en
        <span className="font-medium"> Configuración → Google Maps</span>. Mientras tanto, puedes ingresar la
        latitud y longitud manualmente abajo.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div ref={ref} className="h-64 w-full rounded-xl border border-gray-200" />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Haz clic en el mapa o arrastra el pin para marcar la ubicación exacta de tu negocio.
        </p>
      )}
    </div>
  )
}
