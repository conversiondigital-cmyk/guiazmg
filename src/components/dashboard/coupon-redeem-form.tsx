"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Gift, Loader2 } from "@/lib/icons"

type Business = { id: string; name: string }

export function CouponRedeemForm({ businesses }: { businesses: Business[] }) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "")
  const [loading, setLoading] = useState(false)

  if (businesses.length === 0) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !businessId) return
    setLoading(true)
    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), businessId }),
      })
      const data = await res.json().catch(() => ({}))
      // Se gatea en data.success (no en res.ok): si la sesión expiró, el proxy
      // redirige a la página de login (200 HTML) y res.ok sería true sin haber canjeado.
      if (res.ok && data.success) {
        toast.success(`¡Listo! Se activó ${data.planName} por ${data.days} días.`)
        setCode("")
        router.refresh()
      } else {
        toast.error(data.error ?? "No se pudo canjear el cupón")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-[#006c49]/20 bg-white p-5 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d8f0e6]">
          <Gift className="h-5 w-5 text-[#0f7a52]" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">¿Tienes un cupón de prueba?</h3>
          <p className="text-xs text-gray-500">Actívalo para probar un plan gratis por tiempo limitado.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {businesses.length > 1 && (
          <select
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            aria-label="Negocio"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#006c49] sm:w-52"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CÓDIGO"
          autoCapitalize="characters"
          className="flex-1 uppercase"
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#006c49] text-white hover:bg-[#00583b]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Canjear"}
        </Button>
      </div>
    </form>
  )
}
