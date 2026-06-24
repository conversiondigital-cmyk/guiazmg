// Carga el script de Google Maps una sola vez por página, con la librería de
// Places (para autocompletado de direcciones). Lo comparten el selector de pin
// y el input de autocompletado para no inyectar el script dos veces con params
// distintos. No-op en SSR.
let mapsPromise: Promise<void> | null = null

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  const w = window as unknown as { google?: { maps?: unknown } }
  if (w.google?.maps) return Promise.resolve()
  if (!mapsPromise) {
    mapsPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script")
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        apiKey
      )}&libraries=places&language=es&region=MX`
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error("No se pudo cargar Google Maps. Revisa la API key."))
      document.head.appendChild(s)
    })
  }
  return mapsPromise
}
