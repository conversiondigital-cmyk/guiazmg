"use client"

import { Fragment, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Gift, Loader2, ChevronDown } from "@/lib/icons"

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

type Redemption = {
  id: string
  days: number
  redeemedAt: string
  userName: string | null
  userEmail: string | null
  businessName: string | null
  businessSlug: string | null
}

export function MembershipCouponsClient({
  plans,
  initialCoupons,
}: {
  plans: Plan[]
  initialCoupons: Coupon[]
}) {
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

  // Detalle de "quién canjeó" por cupón: se carga bajo demanda al desplegar.
  const [openId, setOpenId] = useState<string | null>(null)
  const [reds, setReds] = useState<Record<string, Redemption[]>>({})
  const [loadingReds, setLoadingReds] = useState<string | null>(null)

  const toggleDetail = async (c: Coupon) => {
    if (openId === c.id) {
      setOpenId(null)
      return
    }
    setOpenId(c.id)
    if (reds[c.id]) return // ya cargado
    setLoadingReds(c.id)
    try {
      const res = await fetch(`/api/admin/membership-coupons/${c.id}/redemptions`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error()
      setReds((m) => ({ ...m, [c.id]: data.redemptions ?? [] }))
    } catch {
      toast.error("No se pudo cargar quién canjeó")
      setOpenId((cur) => (cur === c.id ? null : cur))
    } finally {
      setLoadingReds(null)
    }
  }

  const fmtDate = (s: string) =>
    new Date(s).toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

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
      // Gatea en data.coupon (no en res.ok): un redirect de auth (200 HTML) haría
      // res.ok true e insertaría una fila fantasma con data.coupon undefined.
      if (res.ok && data.coupon) {
        toast.success("Cupón creado")
        setForm((f) => ({ ...f, code: "", note: "" }))
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
    try {
      const res = await fetch("/api/admin/membership-coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, isActive: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revierte el cambio optimista si el server no lo aplicó (evita que la UI mienta).
      setCoupons((list) => list.map((x) => (x.id === c.id ? { ...x, isActive: c.isActive } : x)))
      toast.error("No se pudo actualizar el cupón")
    }
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
                coupons.map((c) => {
                  const isOpen = openId === c.id
                  const usable = c.redemptionCount > 0
                  const list = reds[c.id] ?? []
                  return (
                    <Fragment key={c.id}>
                      <tr className={`border-b border-gray-50 last:border-0 ${isOpen ? "bg-[#f5faf8]" : ""}`}>
                        <td className="px-4 py-3 font-mono font-semibold text-gray-900">{c.code}</td>
                        <td className="px-4 py-3 text-gray-600">{c.plan.name}</td>
                        <td className="px-4 py-3 text-gray-600">{c.days}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {usable ? (
                            <button
                              type="button"
                              onClick={() => toggleDetail(c)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-[#0f7a52] transition-colors hover:bg-[#e6f4ee]"
                              title="Ver quién canjeó"
                            >
                              {c.redemptionCount}
                              {c.maxRedemptions !== null ? ` / ${c.maxRedemptions}` : ""}
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                          ) : (
                            <span>
                              {c.redemptionCount}
                              {c.maxRedemptions !== null ? ` / ${c.maxRedemptions}` : ""}
                            </span>
                          )}
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
                      {isOpen && (
                        <tr className="border-b border-gray-100 bg-[#f5faf8]">
                          <td colSpan={6} className="px-4 py-3">
                            {loadingReds === c.id ? (
                              <p className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 className="h-4 w-4 animate-spin" /> Cargando canjes…
                              </p>
                            ) : list.length === 0 ? (
                              <p className="text-sm text-gray-500">Sin canjes registrados.</p>
                            ) : (
                              <div className="overflow-hidden rounded-lg border border-[#006c49]/15 bg-white">
                                <p className="border-b border-gray-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Quién canjeó {c.code} ({list.length})
                                </p>
                                <ul className="divide-y divide-gray-50">
                                  {list.map((r) => (
                                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-sm">
                                      <span className="min-w-0">
                                        <span className="font-medium text-gray-900">{r.userName ?? "—"}</span>
                                        {r.userEmail && <span className="text-gray-500"> · {r.userEmail}</span>}
                                      </span>
                                      <span className="text-gray-600">
                                        {r.businessSlug ? (
                                          <a
                                            href={`/perfil/${r.businessSlug}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-[#0f7a52] hover:underline"
                                          >
                                            {r.businessName ?? "negocio"}
                                          </a>
                                        ) : (
                                          r.businessName ?? "—"
                                        )}
                                      </span>
                                      <span className="text-xs text-gray-400">{fmtDate(r.redeemedAt)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
