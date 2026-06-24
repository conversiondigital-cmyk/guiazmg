"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Gift } from "lucide-react"

interface Option {
  id: string
  name: string
}
interface BoostOption extends Option {
  durationDays: number
}

export function GrantBenefitForm({
  businesses,
  plans,
  boosts,
}: {
  businesses: Option[]
  plans: Option[]
  boosts: BoostOption[]
}) {
  const [businessId, setBusinessId] = useState("")
  const [type, setType] = useState<"plan" | "boost">("plan")
  const [planId, setPlanId] = useState(plans[0]?.id ?? "")
  const [days, setDays] = useState(30)
  const [boostDefinitionId, setBoostDefinitionId] = useState(boosts[0]?.id ?? "")
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!businessId) {
      toast.error("Selecciona un negocio")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/benefits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, type, planId, days, boostDefinitionId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Beneficio aplicado: ${data.summary}`)
        setBusinessId("")
      } else {
        toast.error(data.error || "No se pudo aplicar el beneficio")
      }
    } catch {
      toast.error("Error de red al aplicar el beneficio")
    } finally {
      setLoading(false)
    }
  }

  const selectCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
  const tab = (active: boolean) =>
    `flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
      active ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-muted"
    }`

  return (
    <div className="max-w-lg space-y-4 rounded-xl border bg-card p-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Negocio</label>
        <select className={selectCls} value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
          <option value="">Selecciona un negocio…</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo de beneficio</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setType("plan")} className={tab(type === "plan")}>
            Plan gratis
          </button>
          <button type="button" onClick={() => setType("boost")} className={tab(type === "boost")}>
            Boost de regalo
          </button>
        </div>
      </div>

      {type === "plan" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Plan</label>
            <select className={selectCls} value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Días</label>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className={selectCls}
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Boost</label>
          <select
            className={selectCls}
            value={boostDefinitionId}
            onChange={(e) => setBoostDefinitionId(e.target.value)}
          >
            {boosts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.durationDays} días
              </option>
            ))}
          </select>
        </div>
      )}

      <Button onClick={submit} disabled={loading}>
        <Gift className="size-4" />
        {loading ? "Aplicando…" : "Otorgar beneficio"}
      </Button>
    </div>
  )
}
