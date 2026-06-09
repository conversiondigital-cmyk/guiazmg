"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const POPULAR = ["Restaurantes", "Plomeros", "Clínicas", "Salones de belleza", "Talleres"]

const SLIDES = [
  {
    title: "Encuentra negocios,\nservicios y productos",
    highlight: "cerca de ti",
    sub: "Conectamos personas con los mejores negocios locales.\nBusca, compara y elige lo que necesitas.",
    bg: "from-green-900 via-green-800 to-emerald-900",
    img: "/guadalajara.jpg",
    badge: { value: "+2,500", label: "Negocios verificados", sub: "en toda la ZMG" },
  },
  {
    title: "Descubre los mejores\nnegocios de",
    highlight: "Guadalajara ZMG",
    sub: "Restaurantes, clínicas, talleres y más.\nTodo lo que necesitas en un solo lugar.",
    bg: "from-emerald-900 via-teal-800 to-green-900",
    img: "/zapopan.jpg",
    badge: { value: "+250k", label: "Usuarios activos", sub: "en la plataforma" },
  },
  {
    title: "Promociones exclusivas\npara la comunidad",
    highlight: "Ahorra con Guía ZMG",
    sub: "Ofertas especiales, descuentos y beneficios\nque solo encuentras aquí.",
    bg: "from-green-800 via-emerald-700 to-teal-900",
    img: "/tlaquepaque.jpg",
    badge: { value: "+50k", label: "Reseñas reales", sub: "de clientes verificados" },
  },
]

export function HeroCarousel() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [current, setCurrent] = useState(0)
  const [imgError, setImgError] = useState<Record<number, boolean>>({})

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), [])
  const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)

  useEffect(() => {
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next])

  const handleSearch = (q: string) => {
    const t = (q || query).trim()
    if (!t) return
    router.push(`/search?q=${encodeURIComponent(t)}`)
  }

  const slide = SLIDES[current]
  const titleLines = slide.title.split("\n")

  return (
    <section className="bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[520px] py-16">

          {/* Left — Text + Search */}
          <div className="flex flex-col gap-6">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
              Descubre lo mejor de la Zona Metropolitana de Guadalajara
            </p>

            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight transition-all duration-500">
              {titleLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < titleLines.length - 1 && <br />}
                </span>
              ))}{" "}
              <span className="text-green-700">{slide.highlight}</span>
            </h1>

            <p className="text-gray-500 text-lg leading-relaxed max-w-md">
              {slide.sub.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </p>

            {/* Search form */}
            <div className="flex gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-md max-w-xl">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-5 w-5 shrink-0 text-gray-400" />
                <input
                  type="text"
                  placeholder="¿Qué estás buscando?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch("")}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="hidden sm:flex items-center gap-1.5 border-l border-gray-100 pl-3 pr-2">
                <MapPin className="h-4 w-4 text-green-700" />
                <span className="text-sm text-gray-600 whitespace-nowrap">Guadalajara, Jalisco</span>
              </div>
              <Button
                onClick={() => handleSearch("")}
                className="rounded-xl bg-green-800 px-5 text-white hover:bg-green-900"
              >
                Buscar
              </Button>
            </div>

            {/* Popular searches */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Búsquedas populares:</span>
              {POPULAR.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:border-green-700 hover:text-green-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Carousel indicators — visible below search on mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? "w-6 bg-green-700" : "w-2 bg-gray-300"
                  }`}
                  aria-label={`Ir a slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right — Carousel */}
          <div className="relative hidden lg:flex items-center justify-center">
            {/* Main carousel image */}
            <div className={`relative h-[420px] w-full overflow-hidden rounded-3xl bg-gradient-to-br ${slide.bg} shadow-2xl`}>
              {/* Background image */}
              {!imgError[current] && (
                <img
                  key={slide.img}
                  src={slide.img}
                  alt="Guadalajara ZMG"
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                  onError={() => setImgError((prev) => ({ ...prev, [current]: true }))}
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Location chip at bottom */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-white" />
                <span className="text-xs font-semibold text-white">Zona Metropolitana de Guadalajara</span>
              </div>

              {/* Carousel controls */}
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Slide indicators */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current ? "w-5 bg-white" : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Float stats card */}
            <div className="absolute bottom-6 right-[-12px] rounded-2xl bg-white p-4 shadow-xl border border-gray-100 min-w-[180px] transition-all duration-500">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
                  <BadgeCheck className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{slide.badge.label}</p>
                  <p className="text-2xl font-black text-green-800">{slide.badge.value}</p>
                  <p className="text-xs text-gray-400">{slide.badge.sub}</p>
                  <a href="/search" className="mt-1 text-xs text-green-700 font-semibold hover:underline">
                    Conócelos todos →
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
