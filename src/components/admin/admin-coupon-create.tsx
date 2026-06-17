"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"

type Opt = { id: string; name: string }

const SELECT_CLS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"

const EMPTY = { businessId: "", title: "", code: "", description: "", startDate: "", endDate: "" }

/**
 * Botón + diálogo para que un admin cree una promoción comercial (modelo
 * Coupon) en nombre de un negocio. Usado en /admin/promociones.
 */
export function AdminCouponCreate({ profiles }: { profiles: Opt[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })

  const openDialog = () => {
    setForm({ ...EMPTY })
    setError(null)
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "Error al crear la promoción")
      }
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la promoción")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button onClick={openDialog} className="gap-2 bg-green-600 hover:bg-green-700">
        <Plus className="h-4 w-4" />
        Nueva Promoción
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva promoción comercial</DialogTitle>
            <DialogDescription>Oferta publicada en nombre de un negocio.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Negocio</Label>
              <select
                className={SELECT_CLS}
                value={form.businessId}
                onChange={(e) => setForm({ ...form, businessId: e.target.value })}
              >
                <option value="">Seleccionar negocio...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ac-title">Título</Label>
              <Input
                id="ac-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ac-code">Código (opcional)</Label>
              <Input
                id="ac-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ac-desc">Descripción (opcional)</Label>
              <Input
                id="ac-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="ac-start">Inicio (opcional)</Label>
                <Input
                  id="ac-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ac-end">Fin (opcional)</Label>
                <Input
                  id="ac-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {profiles.length === 0 && (
              <p className="text-sm text-amber-600">No hay negocios registrados todavía.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={save}
              disabled={saving || !form.businessId || !form.title.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
