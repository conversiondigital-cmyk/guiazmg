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

  const hasCarousel = images.length > 0

  // Auto-avance del carrusel.
  useEffect(() => {
    if (images.length < 2) return
    const t = setInterval(() => setCurrent((c) => (c + 1) % images.length), config.intervalMs)
    return () => clearInterval(t)
  }, [images.length, config.intervalMs])

  const handleSearch = (q?: string) => {
    const text = [(q ?? query).trim(), location.trim()].filter(Boolean).join(" ")
    if (!text) {
      router.push("/search")
      return
    }
    router.push(`/search?q=${encodeURIComponent(text)}`)
  }

  return (
    <section className="relative flex items-center justify-center overflow-hidden py-24 sm:py-28">
      {/* Fondo: carrusel de imágenes (admin) o imagen por defecto */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#003527] via-[#064e3b] to-[#006c49]">
        {hasCarousel ? (
          images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
            />
          ))
        ) : (
          !imgError && (
            <img
              src="/guadalajara.jpg"
              alt="Guadalajara"
              className="h-full w-full object-cover brightness-[0.4]"
              onError={() => setImgError(true)}
            />
          )
        )}
        {/* Overlay verde semitransparente (la transparencia sobre las imágenes) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#003527]/85 via-[#003527]/55 to-[#003527]/65" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 text-center">
        <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
          {config.titlePrefix}{" "}
          {config.titleHighlight && (
            <>
              <br className="hidden sm:block" />
              <span className="text-[#4edea3]">{config.titleHighlight}</span>
            </>
          )}
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">{config.subtitle}</p>

        {/* Buscador glass */}
        <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-md md:flex-row">
          <div className="flex flex-grow items-center rounded-xl bg-white px-4 py-3">
            <Search className="mr-3 h-5 w-5 shrink-0 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="¿Qué estás buscando?"
              className="w-full border-none bg-transparent p-0 text-[#0b1c30] outline-none placeholder:text-gray-400 focus:ring-0"
            />
          </div>
          <div className="flex items-center rounded-xl bg-white px-4 py-3 md:w-64">
            <MapPin className="mr-3 h-5 w-5 shrink-0 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Ubicación"
              className="w-full border-none bg-transparent p-0 text-[#0b1c30] outline-none placeholder:text-gray-400 focus:ring-0"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#003527] px-8 py-3 font-semibold text-white transition-all hover:opacity-95 active:scale-95"
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
          <span className="text-xs font-medium text-white/70">Populares:</span>
          {config.popular.map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s)}
              className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Indicadores del carrusel */}
        {images.length > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setCurrent(i)}
                aria-label={`Imagen ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
