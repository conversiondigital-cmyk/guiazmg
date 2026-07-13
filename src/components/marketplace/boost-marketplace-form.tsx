"use client"

import { useState } from "react"
import { Loader2, Rocket } from "@/lib/icons"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

interface BoostOption {
  id: string
  name: string
  durationDays: number
  price: number
}

export function BoostMarketplaceForm({
  listingId,
  options,
}: {
  listingId: string
  options: BoostOption[]
}) {
  const [selected, setSelected] = useState(options[0]?.id ?? "")
  const [loading, setLoading] = useState<"STRIPE" | "MERCADO_PAGO" | null>(null)

  const pay = async (provider: "STRIPE" | "MERCADO_PAGO") => {
    if (!selected) {
      toast.error("Elige una duración")
      return
    }
    setLoading(provider)
    try {
      const res = await fetch("/api/payments/marketplace-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boostDefinitionId: selected, marketplaceListingId: listingId, provider }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        toast.error(data.error || "No se pudo iniciar el pago")
        return
      }
      window.location.href = data.url
    } catch {
      toast.error("Error de conexión")
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
              selected === o.id ? "border-amber-400 bg-amber-50/50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="boost"
                checked={selected === o.id}
                onChange={() => setSelected(o.id)}
                className="h-4 w-4"
              />
              <span className="font-medium text-gray-900">{o.name}</span>
              <span className="text-sm text-gray-500">{o.durationDays} días</span>
            </div>
            <span className="font-semibold text-gray-900">{formatCurrency(o.price)}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => pay("STRIPE")}
          disabled={loading !== null}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
        >
          {loading === "STRIPE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          Pagar con tarjeta (Stripe)
        </button>
        <button
          onClick={() => pay("MERCADO_PAGO")}
          disabled={loading !== null}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          {loading === "MERCADO_PAGO" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          Pagar con Mercado Pago
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        Tu publicación aparecerá primero y con la etiqueta &ldquo;Destacado&rdquo; mientras dure el boost.
      </p>
    </div>
  )
}
