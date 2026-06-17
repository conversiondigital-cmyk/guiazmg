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

const EMPTY = {
  businessId: "",
  categoryId: "",
  title: "",
  price: "",
  description: "",
  status: "ACTIVE",
}

/**
 * Botón + diálogo para que un admin cree un anuncio (producto o servicio)
 * en nombre de un negocio. Usado en /admin/anuncios y /admin/servicios.
 */
export function AdminListingCreate({
  profiles,
  categories,
  buttonLabel = "Nuevo",
  dialogTitle = "Nuevo anuncio",
}: {
  profiles: Opt[]
  categories: Opt[]
  buttonLabel?: string
  dialogTitle?: string
}) {
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
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "Error al crear el anuncio")
      }
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear el anuncio")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button onClick={openDialog} className="gap-2 bg-green-600 hover:bg-green-700">
        <Plus className="h-4 w-4" />
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>Se publica en nombre del negocio seleccionado.</DialogDescription>
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
              <Label>Categoría</Label>
              <select
                className={SELECT_CLS}
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="al-title">Título</Label>
              <Input
                id="al-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="al-price">Precio (opcional)</Label>
              <Input
                id="al-price"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="al-desc">Descripción (opcional)</Label>
              <Input
                id="al-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <select
                className={SELECT_CLS}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Activo</option>
                <option value="PENDING_REVIEW">Pendiente de revisión</option>
                <option value="DRAFT">Borrador</option>
              </select>
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
              disabled={saving || !form.businessId || !form.categoryId || !form.title.trim()}
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
