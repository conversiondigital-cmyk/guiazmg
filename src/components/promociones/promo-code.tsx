"use client"

import { useState } from "react"
import { Check, ClipboardList } from "@/lib/icons"

// Muestra un código de regalo (cupón de membresía) copiable de un toque.
// Se usa en la página pública /promociones/registro para que el código sea
// EXPLÍCITO (antes solo se decía "usa tu código de invitación" sin mostrarlo).
export function PromoCode({
  code,
  planName,
  days,
}: {
  code: string
  planName: string
  days: number
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Sin portapapeles (contexto no seguro): el código sigue visible y con select-all.
    }
  }

  return (
    <div className="flex min-w-[15rem] flex-col rounded-xl border-2 border-dashed border-[#006c49]/40 bg-white p-3 text-left shadow-sm">
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
        {planName} · {days} días gratis
      </span>
      <div className="mt-1 flex items-center gap-2">
        <code className="select-all font-mono text-lg font-black tracking-wider text-[#006c49]">
          {code}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copiar código ${code}`}
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#006c49] px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#00583b]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copiado
            </>
          ) : (
            <>
              <ClipboardList className="h-3.5 w-3.5" /> Copiar
            </>
          )}
        </button>
      </div>
    </div>
  )
}
