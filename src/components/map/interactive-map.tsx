"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal, Star, Plus, Minus, LocateFixed, Store, MapPin } from "lucide-react"

// Carga el script de Google Maps una sola vez por página (compartido con el picker).
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

export interface MapPoint {
  id: string
  name: string
  slug: string
  lat: number
  lng: number
  image: string | null
  rating: number | null
  categoryName: string
  categorySlug: string
  icon: string
  location: string
  featured: boolean
}

export interface MapCategory {
  slug: string
  name: string
  icon: string
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function InteractiveMap({
  apiKey,
  points,
  categories,
}: {
  apiKey: string
  points: MapPoint[]
  categories: MapCategory[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)

  const filtered = useMemo(() => {
    let p = points
    if (activeCat) p = p.filter((x) => x.categorySlug === activeCat)
    const q = query.trim().toLowerCase()
    if (q) {
      p = p.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          x.categoryName.toLowerCase().includes(q) ||
          x.location.toLowerCase().includes(q)
      )
    }
    return p
  }, [points, activeCat, query])

  const featured = useMemo(
    () =>
      [...filtered]
        .sort(
          (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating ?? 0) - (a.rating ?? 0)
        )
        .slice(0, 12),
    [filtered]
  )

  // Inicializa el mapa una vez.
  useEffect(() => {
    if (!apiKey) return
    let cancelled = false
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !ref.current) return
        const g = (window as any).google
        const map = new g.maps.Map(ref.current, {
          center: GDL,
          zoom: 12,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        })
        mapRef.current = map
        setReady(true)
      })
      .catch((e) => setError(e?.message || "Error al cargar el mapa"))
    return () => {
      cancelled = true
    }
  }, [apiKey])

  // Redibuja marcadores cuando cambia el filtro.
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const g = (window as any).google
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    const bounds = new g.maps.LatLngBounds()
    filtered.forEach((p) => {
      const marker = new g.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapRef.current,
        title: p.name,
        label: { text: p.icon || "📍", fontSize: "14px" },
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: "#0b5e3b",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })
      marker.addListener("click", () => {
        window.location.href = `/perfil/${p.slug}`
      })
      markersRef.current.push(marker)
      bounds.extend({ lat: p.lat, lng: p.lng })
    })
    if (filtered.length > 1) mapRef.current.fitBounds(bounds, 90)
    else if (filtered.length === 1) {
      mapRef.current.setCenter({ lat: filtered[0].lat, lng: filtered[0].lng })
      mapRef.current.setZoom(15)
    }
  }, [filtered, ready])

  const zoomBy = (d: number) => {
    const m = mapRef.current
    if (m) m.setZoom((m.getZoom() || 12) + d)
  }
  const locate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setUserPos(p)
      mapRef.current?.panTo(p)
      mapRef.current?.setZoom(14)
    })
  }
  const focusOn = (p: MapPoint) => {
    mapRef.current?.panTo({ lat: p.lat, lng: p.lng })
    mapRef.current?.setZoom(16)
  }

  if (!apiKey) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <h2 className="mb-2 text-lg font-bold text-gray-900">Mapa no configurado</h2>
          <p className="text-sm text-gray-600">
            Un administrador debe agregar la API key de Google Maps en{" "}
            <span className="font-medium">Admin → Configuración → Google Maps</span> para activar el
            mapa interactivo.
          </p>
        </div>
      </div>
    )
  }

  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
      active
        ? "border-[#0b5e3b] bg-[#0b5e3b] text-white"
        : "border-gray-200 bg-white text-gray-700 hover:border-[#0b5e3b]/40 hover:text-[#0b5e3b]"
    }`

  return (
    <div className="relative h-[calc(100vh-4rem)] min-h-[560px] w-full overflow-hidden bg-gray-100">
      <div ref={ref} className="absolute inset-0" />

      {error && (
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white px-5 py-4 text-sm text-red-600 shadow-lg">
          {error}
        </div>
      )}

      {/* Buscador + chips (arriba al centro) */}
      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 px-4">
        <div className="pointer-events-auto mx-auto w-full max-w-2xl">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 shadow-lg">
            <Search className="h-5 w-5 shrink-0 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar negocios, servicios o lugares..."
              className="w-full border-none bg-transparent p-0 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0"
            />
            <SlidersHorizontal className="h-5 w-5 shrink-0 text-gray-400" />
          </div>
          <div className="mt-3 flex flex-nowrap gap-2 overflow-x-auto pb-1 md:flex-wrap md:justify-center md:overflow-visible">
            <button onClick={() => setActiveCat(null)} className={chip(activeCat === null)}>
              Todos
            </button>
            {categories.slice(0, 7).map((c) => (
              <button
                key={c.slug}
                onClick={() => setActiveCat(activeCat === c.slug ? null : c.slug)}
                className={chip(activeCat === c.slug)}
              >
                <span>{c.icon}</span> {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel "Destacados" (derecha) */}
      <div className="absolute right-4 top-4 z-10 hidden max-h-[calc(100%-2rem)] w-80 flex-col rounded-2xl border border-gray-100 bg-white/95 shadow-xl backdrop-blur md:flex">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">Destacados</h2>
          <span className="rounded-full bg-[#d8f0e6] px-2.5 py-1 text-xs font-semibold text-[#0f7a52]">
            Top Rated
          </span>
        </div>
        <div className="space-y-3 overflow-y-auto p-3">
          {featured.length === 0 && (
            <p className="px-1 py-6 text-center text-sm text-gray-500">
              No hay negocios que coincidan con tu búsqueda.
            </p>
          )}
          {featured.map((p) => (
            <div
              key={p.id}
              onClick={() => focusOn(p)}
              className="cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative h-28 w-full bg-gray-100">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <Store className="h-8 w-8" />
                  </div>
                )}
                {p.categoryName && (
                  <span className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                    {p.categoryName}
                  </span>
                )}
              </div>
              <div className="p-3">
                <Link
                  href={`/perfil/${p.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="block truncate text-sm font-bold text-gray-900 hover:text-[#0b5e3b]"
                >
                  {p.name}
                </Link>
                <p className="mt-0.5 truncate text-xs text-gray-500">{p.location || "Guadalajara"}</p>
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {p.rating ? p.rating.toFixed(1) : "—"}
                  </span>
                  {userPos && (
                    <span className="text-gray-400">
                      {distanceKm(userPos, { lat: p.lat, lng: p.lng }).toFixed(1)} km
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controles (abajo a la izquierda) */}
      <div className="absolute bottom-6 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={locate}
          aria-label="Mi ubicación"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition-colors hover:text-[#0b5e3b]"
        >
          <LocateFixed className="h-5 w-5" />
        </button>
        <button
          onClick={() => zoomBy(1)}
          aria-label="Acercar"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition-colors hover:text-[#0b5e3b]"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          onClick={() => zoomBy(-1)}
          aria-label="Alejar"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition-colors hover:text-[#0b5e3b]"
        >
          <Minus className="h-5 w-5" />
        </button>
      </div>

      {/* Contador (abajo al centro) */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium text-gray-600 shadow-md backdrop-blur">
        {filtered.length} {filtered.length === 1 ? "negocio" : "negocios"} en el mapa
      </div>
    </div>
  )
}
