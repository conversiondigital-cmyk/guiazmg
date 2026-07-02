"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

// Misma clave que usa el botón "Cerca de mí", para reutilizar la ubicación concedida.
const GEO_KEY = "guiazmg:geo"
const GEO_EVENT = "guiazmg:geo-updated"

type Coords = { lat: number; lng: number } | null
interface Ctx {
  coords: Coords
  loading: boolean
  requestLocation: () => void
}

const LocationContext = createContext<Ctx>({ coords: null, loading: false, requestLocation: () => {} })

function readCache(): Coords {
  try {
    const raw = localStorage.getItem(GEO_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (typeof p?.lat === "number" && typeof p?.lng === "number") return { lat: p.lat, lng: p.lng }
  } catch {
    // ignore
  }
  return null
}

export function UserLocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coords>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setCoords(readCache())
    const onUpdate = () => setCoords(readCache())
    window.addEventListener(GEO_EVENT, onUpdate)
    window.addEventListener("storage", onUpdate)
    return () => {
      window.removeEventListener(GEO_EVENT, onUpdate)
      window.removeEventListener("storage", onUpdate)
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        try {
          localStorage.setItem(GEO_KEY, JSON.stringify(c))
        } catch {
          // ignore
        }
        setCoords(c)
        setLoading(false)
        window.dispatchEvent(new Event(GEO_EVENT))
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  return (
    <LocationContext.Provider value={{ coords, loading, requestLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useUserLocation() {
  return useContext(LocationContext)
}
