// Loader ÚNICO de Google Maps para todo el sitio (mapa general, mapa de ficha,
// selector de pin y autocompletado). Antes cada componente tenía su propio loader:
// se inyectaba el script por duplicado y, con loading=async, un `.catch(()=>resolve())`
// resolvía aunque `importLibrary` fallara → `new google.maps.Map` daba
// "Map is not a constructor" (sobre todo en móvil, por red más lenta) y el promise
// quedaba cacheado como resuelto, dejando el mapa roto hasta recargar.
//
// Este loader: (1) dedupe GLOBAL por atributo del <script> (no solo por el promise
// del módulo); (2) resuelve SOLO cuando `google.maps.Map` existe; (3) ante cualquier
// fallo, rechaza y limpia el cache para permitir reintento. No-op en SSR.
let mapsPromise: Promise<void> | null = null

type GWin = {
  google?: { maps?: { Map?: unknown; importLibrary?: (n: string) => Promise<unknown> } }
}

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  const w = window as unknown as GWin

  // Ya cargado y listo: camino rápido.
  if (w.google?.maps?.Map) return Promise.resolve()
  if (mapsPromise) return mapsPromise

  mapsPromise = new Promise<void>((resolve, reject) => {
    const fail = (msg: string) => {
      mapsPromise = null // permite reintentar en el siguiente montaje
      reject(new Error(msg))
    }

    // Importa las librerías necesarias y resuelve SOLO si la clase Map quedó lista.
    const finish = () => {
      const imp = w.google?.maps?.importLibrary
      if (typeof imp !== "function") {
        // API cargada sin importLibrary (versión clásica): si Map ya existe, ok.
        return w.google?.maps?.Map ? resolve() : fail("Google Maps no expuso importLibrary")
      }
      Promise.all([imp("maps"), imp("places")])
        .then(() => {
          if (w.google?.maps?.Map) resolve()
          else fail("La librería de mapas no cargó")
        })
        .catch(() => fail("No se pudo inicializar Google Maps"))
    }

    // Dedupe GLOBAL: si algún componente ya inyectó el script, no metemos otro
    // (dos bootstraps con loading=async se pisan). Esperamos a que cargue.
    const existing = document.querySelector<HTMLScriptElement>('script[data-gmaps="1"]')
    if (existing) {
      if (w.google?.maps?.importLibrary || w.google?.maps?.Map) finish()
      else {
        existing.addEventListener("load", finish, { once: true })
        existing.addEventListener("error", () => fail("No se pudo cargar Google Maps"), { once: true })
      }
      return
    }

    const s = document.createElement("script")
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&libraries=places&language=es&region=MX&loading=async`
    s.async = true
    s.dataset.gmaps = "1"
    s.onload = finish
    s.onerror = () => fail("No se pudo cargar Google Maps. Revisa la API key.")
    document.head.appendChild(s)
  })
  return mapsPromise
}
