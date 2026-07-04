"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin } from "lucide-react"
import type { HeroConfig } from "@/lib/hero-config"
import { NearMeButton } from "@/components/search/near-me-button"

export function HeroCarousel({ images = [], config }: { images?: string[]; config: HeroConfig }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [imgError, setImgError] = useState(false)
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  // Qué imágenes del carrusel ya se pueden descargar. Empieza solo con la 1ª (el LCP);
  // las demás están apiladas en el viewport, así que loading="lazy" NO las difiere y se
  // bajaban las 4 de golpe. Se cargan bajo demanda: la actual y la siguiente.
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]))

  const hasCarousel = images.length > 0

  // Respeta prefers-reduced-motion: sin auto-avance ni disolvencia.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // Auto-avance del carrusel (pausa al pasar el cursor/enfocar y con movimiento reducido).
  useEffect(() => {
    if (images.length < 2 || paused || reduceMotion) return
    const t = setInterval(() => setCurrent((c) => (c + 1) % images.length), config.intervalMs)
    return () => clearInterval(t)
  }, [images.length, config.intervalMs, paused, reduceMotion])

  // Precarga la imagen actual y la siguiente (para que la transición no parpadee),
  // dejando el resto para cuando el carrusel llegue a ellas.
  useEffect(() => {
    if (images.length < 2) return
    setLoaded((prev) => {
      if (prev.has(current) && prev.has((current + 1) % images.length)) return prev
      const next = new Set(prev)
      next.add(current)
      next.add((current + 1) % images.length)
      return next
    })
  }, [current, images.length])

  const handleSearch = (q?: string) => {
    const text = [(q ?? query).trim(), location.trim()].filter(Boolean).join(" ")
    if (!text) {
      router.push("/search")
      return
    }
    router.push(`/search?q=${encodeURIComponent(text)}`)
  }

  return (
    <section
      className="relative flex min-h-[440px] items-center justify-center overflow-hidden py-14 sm:min-h-[500px] sm:py-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Fondo: carrusel de imágenes (admin) o imagen por defecto */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#003527] via-[#064e3b] to-[#006c49]">
        {hasCarousel ? (
          images.map((src, i) => (
            <img
              key={src}
              // Solo se asigna src cuando la imagen entra en la ventana de precarga
              // (actual + siguiente); así la 1ª es el LCP y las demás no se bajan de golpe.
              src={loaded.has(i) ? src : undefined}
              alt=""
              aria-hidden
              fetchPriority={i === 0 ? "high" : "low"}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity motion-reduce:transition-none ${
                reduceMotion ? "duration-0" : "duration-700"
              } ${i === current ? "opacity-100" : "opacity-0"}`}
            />
          ))
        ) : (
          !imgError && (
            <img
              src="/guadalajara.jpg"
              alt="Guadalajara"
              fetchPriority="high"
              className="h-full w-full object-cover object-center brightness-[0.4]"
              onError={() => setImgError(true)}
            />
          )
        )}
        {/* Overlay verde semitransparente (la transparencia sobre las imágenes) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#003527]/85 via-[#003527]/60 to-[#003527]/70" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 text-center [text-shadow:0_1px_10px_rgba(0,20,14,0.35)]">
        <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
          {config.titlePrefix}{" "}
          {config.titleHighlight && (
            <>
              <br className="hidden sm:block" />
              <span className="text-[#4edea3]">{config.titleHighlight}</span>
            </>
          )}
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-white/95">{config.subtitle}</p>

        {/* Buscador glass */}
        <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-md [text-shadow:none] md:flex-row">
          <div className="flex flex-grow items-center rounded-xl bg-white px-4 py-3 ring-[#4edea3] transition-shadow focus-within:ring-2">
            <Search className="mr-3 h-5 w-5 shrink-0 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="¿Qué estás buscando?"
              aria-label="¿Qué estás buscando?"
              className="w-full border-none bg-transparent p-0 text-[#0b1c30] outline-none placeholder:text-gray-400 focus:ring-0"
            />
          </div>
          <div className="flex items-center rounded-xl bg-white px-4 py-3 ring-[#4edea3] transition-shadow focus-within:ring-2 md:w-64">
            <MapPin className="mr-3 h-5 w-5 shrink-0 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Ubicación"
              aria-label="Ubicación o zona"
              className="w-full border-none bg-transparent p-0 text-[#0b1c30] outline-none placeholder:text-gray-400 focus:ring-0"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#003527] px-8 py-3 font-semibold text-white outline-none transition-all hover:opacity-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#003527] active:scale-95"
          >
            Buscar
          </button>
        </div>

        {/* Cerca de mí */}
        <div className="mt-3 flex justify-center">
          <NearMeButton
            query={query}
            className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
          />
        </div>

        {/* Populares */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-medium text-white/85">Populares:</span>
          {config.popular.map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s)}
              className="rounded-full border border-white/30 bg-white/10 px-3.5 py-2 text-[13px] text-white outline-none backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Indicadores del carrusel */}
        {images.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-1">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setCurrent(i)}
                aria-label={`Ir a la imagen ${i + 1} de ${images.length}`}
                aria-current={i === current}
                className="group flex h-10 items-center px-1.5 outline-none"
              >
                <span
                  className={`h-1.5 rounded-full transition-all group-focus-visible:ring-2 group-focus-visible:ring-white group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-transparent ${
                    i === current ? "w-6 bg-white" : "w-1.5 bg-white/50 group-hover:bg-white/80"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
