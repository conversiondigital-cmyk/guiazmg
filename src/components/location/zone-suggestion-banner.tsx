"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MapPin, X } from "@/lib/icons"

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
    <div className="relative z-30 bg-[#006c49] text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
        <p className="flex-1 leading-tight">
          ¿Estás en <b>{data.name}</b>?{" "}
          <Link
            href={`/${data.muni}`}
            onClick={dismiss}
            className="font-semibold underline underline-offset-2 hover:opacity-90"
          >
            Ver negocios de tu zona
          </Link>
        </p>
        <Link
          href="/zonas"
          className="hidden shrink-0 text-white/85 underline underline-offset-2 hover:text-white sm:inline"
        >
          otra zona
        </Link>
        <button
          onClick={dismiss}
          aria-label="Cerrar sugerencia de zona"
          className="shrink-0 rounded p-1 transition-colors hover:bg-white/15"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
