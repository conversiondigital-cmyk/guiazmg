"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const TESTIMONIALS = [
  {
    quote: "Encontré el mejor restaurante italiano gracias a Guía ZMG. La información es súper completa y confiable.",
    name: "María González",
    location: "Guadalajara, Jalisco",
    initials: "MG",
    color: "bg-green-100 text-green-800",
    role: "Usuaria",
  },
  {
    quote: "He conseguido muchos clientes para mi negocio desde que estoy en Guía ZMG. 100% recomendaría la plataforma.",
    name: "Carlos Ramírez",
    location: "Zapopan, Jalisco",
    initials: "CR",
    color: "bg-blue-100 text-blue-800",
    role: "Dueño de negocio",
  },
  {
    quote: "Me encanta que pueda encontrar todo lo que necesito en un solo lugar. ¡Es súper fácil de usar!",
    name: "Ana López",
    location: "Tlaquepaque, Jalisco",
    initials: "AL",
    color: "bg-amber-100 text-amber-800",
    role: "Usuaria",
  },
  {
    quote: "En tres meses con Guía ZMG duplicamos la cantidad de clientes que llegan por recomendación en línea.",
    name: "Roberto Mendoza",
    location: "Tonalá, Jalisco",
    initials: "RM",
    color: "bg-rose-100 text-rose-800",
    role: "Dueño de taller",
  },
  {
    quote: "La sección de promociones es increíble. Ahorro dinero cada semana con las ofertas de negocios cerca de mí.",
    name: "Laura Vega",
    location: "Zapopan, Jalisco",
    initials: "LV",
    color: "bg-purple-100 text-purple-800",
    role: "Usuaria",
  },
]

export function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const goTo = useCallback((index: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrent(index)
    setTimeout(() => setIsAnimating(false), 400)
  }, [isAnimating])

  const next = useCallback(() => goTo((current + 1) % TESTIMONIALS.length), [current, goTo])
  const prev = () => goTo((current - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)

  useEffect(() => {
    const t = setInterval(next, 6000)
    return () => clearInterval(t)
  }, [next])

  // Show 3 on desktop, 1 on mobile
  const getVisible = () => {
    const items: typeof TESTIMONIALS = []
    for (let i = 0; i < 3; i++) {
      items.push(TESTIMONIALS[(current + i) % TESTIMONIALS.length])
    }
    return items
  }

  const visible = getVisible()

  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
            Lo que dicen nuestros usuarios
          </p>
          <h2 className="text-3xl font-black text-gray-900">
            Historias reales de nuestra comunidad
          </h2>
        </div>

        {/* Cards — desktop shows 3, mobile shows 1 */}
        <div className="relative">
          {/* Desktop: 3 columns */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {visible.map((t, idx) => (
              <div
                key={`${t.name}-${current}-${idx}`}
                className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4 transition-all duration-500 ${
                  idx === 0 ? "opacity-100" : idx === 1 ? "opacity-100" : "opacity-90"
                }`}
              >
                <span className="text-5xl font-black text-green-100 leading-none select-none">"</span>
                <p className="text-gray-600 leading-relaxed text-sm -mt-4">{t.quote}</p>
                <div className="mt-auto flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.location} · {t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: 1 card */}
          <div className="md:hidden">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
              <span className="text-5xl font-black text-green-100 leading-none select-none">"</span>
              <p className="text-gray-600 leading-relaxed text-sm -mt-4">{TESTIMONIALS[current].quote}</p>
              <div className="mt-auto flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${TESTIMONIALS[current].color}`}>
                  {TESTIMONIALS[current].initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{TESTIMONIALS[current].name}</p>
                  <p className="text-xs text-gray-400">{TESTIMONIALS[current].location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls + dots */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={prev}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:border-green-600 hover:text-green-700 transition-colors shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-green-700" : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Ir al testimonio ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:border-green-600 hover:text-green-700 transition-colors shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
