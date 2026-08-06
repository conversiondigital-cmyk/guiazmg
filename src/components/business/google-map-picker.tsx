"use client"

import { useEffect, useRef, useState } from "react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"

// Centro por defecto: Guadalajara.
const GDL = { lat: 20.6597, lng: -103.3496 }

interface Props {
  apiKey: string
  lat?: number | null
  lng?: number | null
  onChange: (lat: number, lng: number) => void
  // Al mover el pin, devuelve también la dirección (reverse-geocoding) para
  // actualizar el campo de dirección de arriba.
  onAddress?: (address: string) => void
}

export function GoogleMapPicker({ apiKey, lat, lng, onChange, onAddress }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onAddressRef = useRef(onAddress)
  onAddressRef.current = onAddress
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
          // "greedy": el scroll hace zoom directo, sin tener que presionar Ctrl.
          gestureHandling: "greedy",
        })
        const marker = new g.maps.Marker({ position: center, map, draggable: true })
        mapRef.current = map
        markerRef.current = marker
        if (g.maps.Geocoder) geocoderRef.current = new g.maps.Geocoder()
        const emit = (pos: any) => {
          const la = pos.lat()
          const lo = pos.lng()
          onChangeRef.current(la, lo)
          // Reverse-geocoding: al mover el pin, actualiza la dirección de arriba.
          if (geocoderRef.current && onAddressRef.current) {
            geocoderRef.current.geocode({ location: { lat: la, lng: lo } }, (res: any, status: string) => {
              if (status === "OK" && res?.[0]?.formatted_address) {
                onAddressRef.current?.(res[0].formatted_address)
              }
            })
          }
        }
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
