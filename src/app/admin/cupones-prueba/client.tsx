"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Gift, Loader2 } from "@/lib/icons"

type Plan = { id: string; name: string }
type Coupon = {
  id: string
  code: string
  days: number
  maxRedemptions: number | null
  redemptionCount: number
  expiresAt: string | null
  isActive: boolean
  note: string | null
  plan: { name: string }
}

export function MembershipCouponsClient({
  plans,
  initialCoupons,
}: {
  plans: Plan[]
  initialCoupons: Coupon[]
}) {
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: "",
    planId: plans[0]?.id ?? "",
    days: "30",
    maxRedemptions: "",
    expiresAt: "",
    note: "",
  })

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.planId) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/membership-coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          planId: form.planId,
          days: form.days,
          maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
          expiresAt: form.expiresAt || null,
          note: form.note || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success("Cupón creado")
        setForm((f) => ({ ...f, code: "", note: "" }))
        router.refresh()
        setCoupons((c) => [{ ...data.coupon, plan: { name: plans.find((p) => p.id === form.planId)?.name ?? "" } }, ...c])
      } else {
        toast.error(data.error ?? "No se pudo crear")
      }
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (c: Coupon) => {
    const next = !c.isActive
    setCoupons((list) => list.map((x) => (x.id === c.id ? { ...x, isActive: next } : x)))
    await fetch("/api/admin/membership-coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, isActive: next }),
    }).catch(() => {})
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Gift className="h-6 w-6 text-[#0f7a52]" /> Cupones de prueba
        </h1>
        <p className="text-sm text-gray-500">
          Códigos canjeables que activan un plan por N días sin pago. Reemplazan al tier gratuito.
        </p>
      </div>

      {/* Crear */}
      <form onSubmit={create} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Crear cupón</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="code">Código</Label>
            <Input id="code" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="PRUEBA30" className="uppercase" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="planId">Plan</Label>
            <select id="planId" value={form.planId} onChange={(e) => set("planId", e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#006c49]">
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="days">Días</Label>
            <Input id="days" type="number" min={1} max={3650} value={form.days} onChange={(e) => set("days", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max">Usos máximos (vacío = ilimitado)</Label>
            <Input id="max" type="number" min={1} value={form.maxRedemptions} onChange={(e) => set("maxRedemptions", e.target.value)} placeholder="Ilimitado" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp">Expira (opcional)</Label>
            <Input id="exp" type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Nota (opcional)</Label>
            <Input id="note" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Campaña, socio…" />
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={saving} className="bg-[#006c49] text-white hover:bg-[#00583b]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cupón"}
          </Button>
        </div>
      </form>

      {/* Lista */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Días</th>
                <th className="px-4 py-3">Usos</th>
                <th className="px-4 py-3">Expira</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Aún no hay cupones. Crea el primero arriba.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900">{c.code}</td>
                    <td className="px-4 py-3 text-gray-600">{c.plan.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.days}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.redemptionCount}
                      {c.maxRedemptions !== null ? ` / ${c.maxRedemptions}` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("es-MX") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggle(c)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.isActive ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
