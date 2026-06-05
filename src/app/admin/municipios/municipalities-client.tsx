"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Plus, Edit3, Eye, EyeOff } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { slugify } from "@/lib/utils"

type MunicipalityRow = {
  id: string
  name: string
  slug: string
  state: string
  isActive: boolean
  sortOrder: number
  _count: { neighborhoods: number; businesses: number }
}

type FormData = {
  name: string
  slug: string
  state: string
  sortOrder: number
  isActive: boolean
}

const emptyForm: FormData = { name: "", slug: "", state: "Jalisco", sortOrder: 0, isActive: true }

export function MunicipalitiesClient({
  municipalities: initial,
  stats,
}: {
  municipalities: MunicipalityRow[]
  stats: { total: number; active: number }
}) {
  const router = useRouter()
  const [municipalities] = useState(initial)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MunicipalityRow | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setForm(emptyForm)
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (m: MunicipalityRow) => {
    setForm({
      name: m.name,
      slug: m.slug,
      state: m.state,
      sortOrder: m.sortOrder,
      isActive: m.isActive,
    })
    setEditing(m)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        await fetch("/api/admin/municipalities", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        })
      } else {
        const res = await fetch("/api/admin/municipalities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error("Error")
      }
      setDialogOpen(false)
      router.refresh()
    } catch {
      console.error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch("/api/admin/municipalities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleActive", id }),
      })
      if (!res.ok) throw new Error("Error")
      router.refresh()
    } catch {
      console.error("Toggle failed")
    }
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Municipios</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo Municipio
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Municipios</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <MapPin className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Colonias</TableHead>
              <TableHead className="text-center">Negocios</TableHead>
              <TableHead className="text-center w-20">Orden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {municipalities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No hay municipios
                </TableCell>
              </TableRow>
            ) : (
              municipalities.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.slug}</TableCell>
                  <TableCell>{m.state}</TableCell>
                  <TableCell className="text-center">{m._count.neighborhoods}</TableCell>
                  <TableCell className="text-center">{m._count.businesses}</TableCell>
                  <TableCell className="text-center">{m.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={m.isActive ? "default" : "secondary"}>
                      {m.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(m)} title="Editar">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleToggleActive(m.id)} title={m.isActive ? "Desactivar" : "Activar"}>
                        {m.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar municipio" : "Nuevo municipio"}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">Orden</Label>
              <Input
                id="sortOrder"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.slug}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
