"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin, Loader2 } from "@/lib/icons"
import { SearchAutocomplete } from "@/components/search/search-autocomplete"
import { Button } from "@/components/ui/button"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { SEARCH_SUGGESTIONS } from "@/lib/constants"

export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [geoLoading, setGeoLoading] = useState(false)

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const handleGeoSearch = () => {
    setGeoLoading(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          router.push(
            `/search?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&q=cerca de mí`
          )
        },
        () => setGeoLoading(false)
      )
    } else {
      setGeoLoading(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.h1 variants={staggerItem} className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Encuentra lo que necesitas
            <span className="block text-blue-200">en la Zona Metropolitana de Guadalajara</span>
          </motion.h1>
          <motion.p variants={staggerItem} className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            El buscador hiperlocal más rápido. Encuentra negocios, servicios y profesionales
            en Guadalajara, Zapopan, Tlaquepaque, Tonalá y Tlajomulco.
          </motion.p>

          <motion.form
            variants={staggerItem}
            onSubmit={handleSubmit}
            className="mx-auto mt-8 max-w-2xl"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl">
              <div className="relative flex-1">
                <SearchAutocomplete
                  value={query}
                  onChange={setQuery}
                  onSubmit={handleSearch}
                  autoFocus={false}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="rounded-xl bg-blue-600 px-8 py-6 text-white hover:bg-blue-700 transition-colors"
              >
                Buscar
              </Button>
            </div>
          </motion.form>

          <motion.div
            variants={staggerItem}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={handleGeoSearch}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {geoLoading ? "Buscando ubicación..." : "Cerca de mí"}
            </button>
            {SEARCH_SUGGESTIONS.slice(0, 6).map((s) => (
              <button
                key={s}
                onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-blue-100 hover:bg-white/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
