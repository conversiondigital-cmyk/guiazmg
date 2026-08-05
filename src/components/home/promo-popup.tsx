"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Gift, X, ArrowRight } from "@/lib/icons"

// Popup de la promo de 60 días en el home. Aparece tras un breve retraso y solo si
// el visitante no lo cerró antes (persistido en localStorage). Es client, así que
// NO rompe el cacheo ISR de la página: se hidrata en el navegador.
const DISMISS_KEY = "promo-registro-60-v1"

export function PromoPopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return
    } catch {
      // localStorage no disponible (modo privado): mostrar de todos modos.
    }
    const t = setTimeout(() => setOpen(true), 1500)
    return () => clearTimeout(t)
  }, [])

  const close = () => {
    setOpen(false)
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* ignore */
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-title"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-[#006c49] to-[#00583b] px-6 py-8 text-center text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <Gift className="h-3.5 w-3.5" />
            Promoción de lanzamiento
          </span>
          <h2 id="promo-title" className="mt-3 text-2xl font-bold">
            60 días gratis
          </h2>
          <p className="mt-1 text-sm text-white/90">
            Registra tu negocio y prueba tu plan Emprendedor o Negocio sin pagar los primeros 60
            días con tu código.
          </p>
        </div>

        <div className="space-y-3 p-6">
          <Link
            href="/promociones/registro"
            onClick={close}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#006c49] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#00583b]"
          >
            Ver la promoción <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/registrar-negocio"
            onClick={close}
            className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Registrar mi negocio
          </Link>
          <button
            type="button"
            onClick={close}
            className="block w-full text-center text-xs text-gray-400 hover:text-gray-600"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  )
}
