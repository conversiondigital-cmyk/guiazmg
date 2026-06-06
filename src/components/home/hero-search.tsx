"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const POPULAR = ["Restaurantes", "Plomeros", "Clínicas", "Salones de belleza", "Talleres"]

export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  const handleSearch = (q: string) => {
    const t = (q || query).trim()
    if (!t) return
    router.push(`/search?q=${encodeURIComponent(t)}`)
  }

  return (
    <section className="bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[520px] py-16">

          {/* Left — Text + Search */}
          <div className="flex flex-col gap-6">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
              Descubre lo mejor de la Zona Metropolitana de Guadalajara
            </p>

            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
              Encuentra negocios,<br />
              servicios y productos{" "}
              <span className="text-green-700">cerca de ti</span>
            </h1>

            <p className="text-gray-500 text-lg leading-relaxed max-w-md">
              Conectamos personas con los mejores negocios locales.
              Busca, compara y elige lo que necesitas.
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
          </div>

          {/* Right — Image + Float card */}
          <div className="relative hidden lg:flex items-center justify-center">
            {/* Cathedral image */}
            <div className="relative h-[420px] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 shadow-2xl">
              {/* Try to load local image, fallback to gradient */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/guadalajara.jpg')" }}
              />
              {/* Overlay for fallback visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent" />

              {/* Fallback text if no image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/20 select-none">
                  <MapPin className="h-24 w-24 mx-auto mb-4" />
                  <p className="text-2xl font-bold">Guadalajara, ZMG</p>
                </div>
              </div>
            </div>

            {/* Float stats card */}
            <div className="absolute bottom-6 right-6 rounded-2xl bg-white p-4 shadow-xl border border-gray-100 min-w-[180px]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
                  <BadgeCheck className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Negocios verificados</p>
                  <p className="text-2xl font-black text-green-800">+2,500</p>
                  <p className="text-xs text-gray-400">en toda la ZMG</p>
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
