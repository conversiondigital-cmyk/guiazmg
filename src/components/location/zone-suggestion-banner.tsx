"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MapPin, X, ArrowRight } from "@/lib/icons"

// Banner que SUGIERE (no fuerza) la landing de la zona del visitante, detectada
// por IP en el borde (/api/public/geo). Nunca redirige solo; es descartable y se
// recuerda en localStorage. No aparece si no hay match, si ya estás en tu zona, o
// en páginas privadas/utilitarias.
const DISMISS_KEY = "zoneSuggestDismissed"
const HIDDEN_PREFIXES = [
  "/admin", "/dashboard", "/editor", "/agente", "/cuenta",
  "/auth", "/onboarding", "/checkout", "/registrar-negocio",
]

export function ZoneSuggestionBanner() {
  const pathname = usePathname()
  const [data, setData] = useState<{ muni: string; name: string } | null>(null)
  const [ready, setReady] = useState(false)
  const [enter, setEnter] = useState(false)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1"
    } catch {
      /* localStorage no disponible */
    }
    if (dismissed) {
      setReady(true)
      return
    }
    let cancel = false
    fetch("/api/public/geo")
      .then((r) => r.json())
      .then((d) => {
        if (!cancel && d?.muni && d?.name) setData({ muni: d.muni, name: d.name })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancel) setReady(true)
      })
    return () => {
      cancel = true
    }
  }, [])

  // Entrada suave (fade + leve deslizamiento) cuando aparece la sugerencia.
  useEffect(() => {
    if (!data) return
    const id = requestAnimationFrame(() => setEnter(true))
    return () => cancelAnimationFrame(id)
  }, [data])

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* noop */
    }
    setData(null)
  }

  if (!ready || !data) return null
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null
  if (pathname === `/${data.muni}`) return null // ya estás en tu zona

  return (
    <div
      className={`relative z-30 border-b border-black/10 bg-[#006c49] text-white shadow-sm transition-all duration-300 ease-out ${
        enter ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
          <MapPin className="h-4 w-4" aria-hidden />
        </span>

        <p className="min-w-0 flex-1 text-sm leading-tight">
          <span className="text-white/80">¿Estás en</span>{" "}
          <b className="font-semibold">{data.name}</b>
          <span className="text-white/80">?</span>
          <span className="hidden text-white/70 sm:inline"> Mira los negocios cerca de ti.</span>
        </p>

        <Link
          href={`/${data.muni}`}
          onClick={dismiss}
          className="group inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#006c49] shadow-sm transition hover:bg-emerald-50"
        >
          Ver mi zona
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>

        <Link
          href="/zonas"
          className="hidden shrink-0 text-xs text-white/75 underline underline-offset-2 transition-colors hover:text-white sm:inline"
        >
          otra zona
        </Link>

        <button
          onClick={dismiss}
          aria-label="Cerrar sugerencia de zona"
          className="shrink-0 rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
