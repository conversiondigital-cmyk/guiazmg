// Loader ÚNICO de Google Maps para todo el sitio (mapa general, mapa de ficha,
// selector de pin y autocompletado de dirección).
//
// Usa el BOOTSTRAP OFICIAL de Google (inline loader), que define
// `google.maps.importLibrary` de forma SÍNCRONA e idempotente. Antes inyectábamos
// el <script> a mano con loading=async y esperábamos al onload; en algunos móviles
// `importLibrary` no quedaba expuesto a tiempo → "Google Maps no expuso
// importLibrary" / "Map is not a constructor". El bootstrap oficial evita esa
// carrera (no depende del onload) y también dedupe (si importLibrary ya existe,
// no vuelve a inyectar el script). No-op en SSR.
// Ref: https://developers.google.com/maps/documentation/javascript/load-maps-js-api
let mapsPromise: Promise<void> | null = null

type GWin = {
  google?: { maps?: { Map?: unknown; importLibrary?: (n: string) => Promise<unknown> } }
}

function bootstrap(apiKey: string): void {
  /* eslint-disable */
  // @ts-nocheck-block: bootstrap oficial de Google, transcrito con tipos `any`.
  ;((g: any) => {
    var h: any,
      a: any,
      k: any,
      p = "The Google Maps JavaScript API",
      c = "google",
      l = "importLibrary",
      q = "__ib__",
      m = document,
      b: any = window
    b = b[c] || (b[c] = {})
    var d = b.maps || (b.maps = {}),
      r = new Set<string>(),
      e = new URLSearchParams(),
      u = () =>
        h ||
        (h = new Promise<void>(async (f: any, n: any) => {
          await (a = m.createElement("script"))
          e.set("libraries", [...r] + "")
          for (k in g) e.set(k.replace(/[A-Z]/g, (t: string) => "_" + t[0].toLowerCase()), g[k])
          e.set("callback", c + ".maps." + q)
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e
          d[q] = f
          a.onerror = () => (h = n(Error(p + " could not load.")))
          a.nonce = (m.querySelector("script[nonce]") as any)?.nonce || ""
          m.head.append(a)
        }))
    d[l]
      ? 0
      : (d[l] = (f: any, ...n: any[]) => r.add(f) && u().then(() => d[l](f, ...n)))
  })({ key: apiKey, v: "weekly", language: "es", region: "MX" })
  /* eslint-enable */
}

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  const w = window as unknown as GWin

  // Ya listo: camino rápido.
  if (w.google?.maps?.Map) return Promise.resolve()
  if (mapsPromise) return mapsPromise

  mapsPromise = (async () => {
    try {
      // El bootstrap define importLibrary de inmediato (idempotente: si ya existe,
      // no reinyecta nada).
      if (typeof w.google?.maps?.importLibrary !== "function") bootstrap(apiKey)
      const imp = w.google?.maps?.importLibrary
      if (typeof imp !== "function") throw new Error("No se pudo iniciar Google Maps")

      // La primera llamada dispara la carga real del API; resuelve cuando está lista.
      await Promise.all([imp("maps"), imp("places")])
      if (!w.google?.maps?.Map) throw new Error("La librería de mapas no cargó")
    } catch (err) {
      mapsPromise = null // limpia el cache para permitir reintento en el próximo montaje
      throw err instanceof Error ? err : new Error("No se pudo cargar Google Maps")
    }
  })()
  return mapsPromise
}
