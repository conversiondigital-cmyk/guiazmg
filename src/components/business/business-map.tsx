"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useRef, useState } from "react"
import { MapPin, Navigation } from "@/lib/icons"
import { useUserLocation } from "@/components/location/user-location"
import { trackEvent } from "@/lib/analytics/track"

// Mapa embebido en la ficha del negocio (Leaflet + OpenStreetMap, sin API key ni
// iframe → respeta la CSP: tiles como <img>, JS bundled). Muestra el negocio y,
// si el usuario ya concedió su ubicación (hook compartido useUserLocation), su
// posición. Solo se SALE del sitio a Google Maps cuando el usuario pide la ruta
// ("Cómo llegar"), y ahí se registra la métrica MAP_CLICK.
export function BusinessMap({
  lat,
  lng,
  name,
  businessId,
}: {
  lat: number
  lng: number
  name: string
  businessId: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Leaflet se tipa laxo (any): el import dinámico + export CommonJS complica los
  // tipos y no aporta seguridad real aquí.
  const mapRef = useRef<any>(null)
  const LRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const { coords, loading, requestLocation } = useUserLocation()

  // Inicializa el mapa una sola vez (carga diferida de Leaflet: nunca corre en SSR).
  useEffect(() => {
    let cancelled = false
    import("leaflet").then((mod) => {
      const L = (mod as any).default ?? mod
      if (cancelled || !containerRef.current || mapRef.current) return
      LRef.current = L
      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView([lat, lng], 15)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map)
      const bizIcon = L.divIcon({
        className: "",
        html:
          '<svg width="30" height="30" viewBox="0 0 24 24" fill="#16a34a" stroke="#fff" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#fff" stroke="none"/></svg>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      })
      L.marker([lat, lng], { icon: bizIcon }).addTo(map).bindPopup(name)
      mapRef.current = map
      setReady(true)
    })
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [lat, lng, name])

  // Marca la ubicación del usuario y encuadra ambos puntos cuando esté disponible.
  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map || !coords) return
    const userIcon = L.divIcon({
      className: "",
      html:
        '<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 2px rgba(37,99,235,.4)"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([coords.lat, coords.lng])
    } else {
      userMarkerRef.current = L.marker([coords.lat, coords.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup("Tu ubicación")
    }
    map.fitBounds(
      L.latLngBounds([
        [lat, lng],
        [coords.lat, coords.lng],
      ]),
      { padding: [40, 40], maxZoom: 16 }
    )
  }, [coords, lat, lng, ready])

  // Único punto donde se sale del sitio: el usuario pidió la ruta.
  const openRoute = () => {
    trackEvent("MAP_CLICK", { businessId })
    const dest = `${lat},${lng}`
    const url = coords
      ? `https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${dest}`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}`
    window.open(url, "_blank", "noopener,noreferrer")
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
        <button
          type="button"
          onClick={openRoute}
          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800"
        >
          <Navigation className="h-4 w-4" />
          Cómo llegar
        </button>
      </div>
    </div>
  )
}
