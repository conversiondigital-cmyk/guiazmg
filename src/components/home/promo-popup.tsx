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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-title"
      onClick={close}
    >
      <div
        className="promo-pop relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/30"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#0a8f61] via-[#006c49] to-[#00432f] px-8 py-10 text-center text-white">
          {/* Adornos radiales */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 20%, white 1.5px, transparent 1.5px), radial-gradient(circle at 85% 75%, white 1.5px, transparent 1.5px)",
              backgroundSize: "42px 42px",
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wide">
              <Gift className="h-4 w-4" />
              Promoción de lanzamiento
            </span>
            <p className="mt-5 text-6xl font-black leading-none tracking-tight sm:text-7xl">60</p>
            <p className="mt-1 text-xl font-bold">días gratis</p>
            <p className="mx-auto mt-3 max-w-sm text-sm text-white/90">
              Registra tu <strong>negocio</strong> y llévate 60 días gratis en tu plan Emprendedor o
              Negocio. El código se aplica <strong>solo</strong> al registrarte, sin pagar.
            </p>
          </div>
        </div>

        <div className="space-y-3 p-6 sm:p-7">
          <Link
            href="/promociones/registro"
            onClick={close}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006c49] px-4 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-[#00583b] hover:shadow-lg"
          >
            Ver la promoción <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/registrar-negocio?promo=1"
            onClick={close}
            className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center font-semibold text-gray-700 transition-colors hover:border-[#006c49]/40 hover:bg-gray-50"
          >
            Registrar mi negocio
          </Link>
          <button
            type="button"
            onClick={close}
            className="block w-full pt-1 text-center text-sm text-gray-400 hover:text-gray-600"
          >
            Ahora no
          </button>
        </div>
      </div>

      <style>{`
        @keyframes promoPopIn {
          0% { opacity: 0; transform: translateY(16px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .promo-pop { animation: promoPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  )
}
