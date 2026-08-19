"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Navigation } from "@/lib/icons"
import { useUserLocation } from "@/components/location/user-location"
import { trackEvent } from "@/lib/analytics/track"

// Carga la API JS de Google Maps una sola vez (compartida entre instancias). La
// key es de cliente y va restringida por dominio en Google Cloud (la CSP ya
// permite maps.googleapis.com). Sin key el componente cae a un fallback sin mapa.
let gmapsPromise: Promise<void> | null = null
function loadGoogleMaps(key: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  const w = window as unknown as { google?: { maps?: unknown } }
  if (w.google?.maps) return Promise.resolve()
  if (gmapsPromise) return gmapsPromise
  gmapsPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script")
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=es&region=MX&loading=async`
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => {
      gmapsPromise = null
      reject(new Error("No se pudo cargar Google Maps"))
    }
    document.head.appendChild(s)
  })
  return gmapsPromise
}

// Mapa embebido en la ficha del negocio con Google Maps. Muestra el negocio y,
// si el usuario ya concedió su ubicación (hook compartido useUserLocation), su
// posición, encuadrando ambos. Solo se SALE del sitio a Google Maps cuando el
// usuario pide la ruta ("Cómo llegar"), registrando la métrica MAP_CLICK.
export function BusinessMap({
  lat,
  lng,
  name,
  businessId,
  apiKey,
}: {
  lat: number
  lng: number
  name: string
  businessId: string
  apiKey: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const [failed, setFailed] = useState(false)
  const { coords, loading, requestLocation } = useUserLocation()

  // Inicializa el mapa (carga diferida: la API solo corre en el cliente).
  useEffect(() => {
    if (!apiKey || !containerRef.current) return
    let cancelled = false
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return
        const g = (window as any).google
        const map = new g.maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          // "greedy": el zoom/desplazamiento es directo, sin pedir la tecla Ctrl
          // (en móvil no existe). Consistente con el mapa general y el selector.
          gestureHandling: "greedy",
        })
        new g.maps.Marker({ position: { lat, lng }, map, title: name })
        mapRef.current = map
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [apiKey, lat, lng, name])

  // Marca la ubicación del usuario y encuadra ambos puntos cuando esté disponible.
  useEffect(() => {
    const g = (window as any).google
    const map = mapRef.current
    if (!g || !map || !coords) return
    const pos = { lat: coords.lat, lng: coords.lng }
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(pos)
    } else {
      userMarkerRef.current = new g.maps.Marker({
        position: pos,
        map,
        title: "Tu ubicación",
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })
    }
    const bounds = new g.maps.LatLngBounds()
    bounds.extend({ lat, lng })
    bounds.extend(pos)
    map.fitBounds(bounds, 60)
  }, [coords, lat, lng])

  // Único punto donde se sale del sitio: el usuario pidió la ruta.
  const openRoute = () => {
    trackEvent("MAP_CLICK", { businessId })
    const dest = `${lat},${lng}`
    const url = coords
      ? `https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${dest}`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const routeButton = (
    <button
      type="button"
      onClick={openRoute}
      className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800"
    >
      <Navigation className="h-4 w-4" />
      Cómo llegar
    </button>
  )

  // Sin key o si la carga falló: fallback sin mapa (solo el botón de ruta).
  if (!apiKey || failed) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white p-4">
        <span className="text-sm text-gray-600">Ubicación del negocio</span>
        {routeButton}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div ref={containerRef} className="h-64 w-full bg-gray-100" aria-label={`Mapa de ${name}`} />
      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
        {coords ? (
          <span className="text-xs text-gray-500">Tu ubicación aparece en el mapa</span>
        ) : (
          <button
            type="button"
            onClick={requestLocation}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800 disabled:opacity-60"
          >
            <MapPin className="h-4 w-4" />
            {loading ? "Ubicando…" : "Mostrar mi ubicación"}
          </button>
        )}
        {routeButton}
      </div>
    </div>
  )
}
