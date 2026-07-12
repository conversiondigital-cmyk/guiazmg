"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Edit3, Eye, EyeOff, Search, Download } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { slugify } from "@/lib/utils"

type Municipality = { id: string; name: string }
type NeighborhoodRow = {
  id: string
  name: string
  slug: string
  postalCode: string | null
  isActive: boolean
  sortOrder: number
  municipality: Municipality
  _count: { businesses: number }
}

type FormData = {
  name: string
  slug: string
  municipalityId: string
  postalCode: string
  sortOrder: number
  isActive: boolean
}

const emptyForm: FormData = { name: "", slug: "", municipalityId: "", postalCode: "", sortOrder: 0, isActive: true }

export function NeighborhoodsClient({
  neighborhoods: initial,
  municipalities,
}: {
  neighborhoods: NeighborhoodRow[]
  municipalities: Municipality[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Render directo desde la prop (tras guardar, router.refresh() reinyecta la
  // lista). Antes se congelaba en useState(initial) y la tabla no se refrescaba.
  const neighborhoods = initial
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")
  const filterMunId = searchParams.get("municipalityId") || "ALL"
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NeighborhoodRow | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createQueryString = useCallback(
    (params: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === "") {
          newParams.delete(key)
        } else {
          newParams.set(key, value)
        }
      }
      return newParams.toString()
    },
    [searchParams]
  )

  const handleSearch = (value: string) => {
    setSearchValue(value)
    const qs = createQueryString({ search: value || undefined, municipalityId: filterMunId === "ALL" ? undefined : filterMunId })
    router.push(`/admin/colonias?${qs}`)
  }

  const handleFilterMunicipality = (value: string | null) => {
    const nextValue = value ?? ""
    const qs = createQueryString({ municipalityId: nextValue === "ALL" ? undefined : nextValue, search: searchValue || undefined })
    router.push(`/admin/colonias?${qs}`)
  }

  const openCreate = () => {
    setForm({ ...emptyForm, municipalityId: filterMunId !== "ALL" ? filterMunId : "" })
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (n: NeighborhoodRow) => {
    setForm({
      name: n.name,
      slug: n.slug,
      municipalityId: n.municipality.id,
      postalCode: n.postalCode || "",
      sortOrder: n.sortOrder,
      isActive: n.isActive,
    })
    setEditing(n)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        await fetch("/api/admin/neighborhoods", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        })
      } else {
        const res = await fetch("/api/admin/neighborhoods", {
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
      const res = await fetch("/api/admin/neighborhoods", {
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

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    const header = lines[0].toLowerCase().split(",").map((h) => h.trim())
    const munIdx = header.indexOf("municipio")
    const colIdx = header.indexOf("colonia")
    const cpIdx = header.indexOf("codigo_postal")

    if (munIdx === -1 || colIdx === -1) {
      setImportResult("Error: El CSV debe tener columnas 'municipio', 'colonia', 'codigo_postal'")
      return
    }

    const rows = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim())
      return {
        municipio: cols[munIdx],
        colonia: cols[colIdx],
        codigo_postal: cpIdx !== -1 ? cols[cpIdx] : "",
      }
    })

    try {
      const res = await fetch("/api/admin/neighborhoods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", rows }),
      })
      const data = await res.json()
      if (data.success) {
        setImportResult(`Importación completa: ${data.created} creadas, ${data.failed} fallos`)
        router.refresh()
      } else {
        setImportResult("Error en la importación")
      }
    } catch {
      setImportResult("Error al importar")
    }

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Colonias</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportCSV}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Download className="h-4 w-4 rotate-180" />
            Importar CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva Colonia
          </Button>
        </div>
      </div>

      {importResult && (
        <div className={`rounded-md p-3 text-sm ${importResult.includes("Error") ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-800"}`}>
          {importResult}
          <Button variant="ghost" size="xs" className="ml-2" onClick={() => setImportResult(null)}>X</Button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(searchValue)
            }}
            className="pl-8"
          />
        </div>
        <Select
          value={filterMunId}
          onValueChange={handleFilterMunicipality}
          items={{ ALL: "Todos los municipios", ...Object.fromEntries(municipalities.map((m) => [m.id, m.name])) }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos los municipios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los municipios</SelectItem>
            {municipalities.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Municipio</TableHead>
              <TableHead>Código Postal</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Negocios</TableHead>
              <TableHead className="text-center w-20">Orden</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {neighborhoods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay colonias
                </TableCell>
              </TableRow>
            ) : (
              neighborhoods.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">{n.name}</TableCell>
                  <TableCell>{n.municipality.name}</TableCell>
                  <TableCell>{n.postalCode || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={n.isActive ? "default" : "secondary"}>
                      {n.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{n._count.businesses}</TableCell>
                  <TableCell className="text-center">{n.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(n)} title="Editar">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleToggleActive(n.id)} title={n.isActive ? "Desactivar" : "Activar"}>
                        {n.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
            <DialogTitle>{editing ? "Editar colonia" : "Nueva colonia"}</DialogTitle>
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
              <Label htmlFor="municipality">Municipio</Label>
              <Select
                value={form.municipalityId}
                onValueChange={(value) => setForm({ ...form, municipalityId: value ?? "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar municipio" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input
                id="postalCode"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
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
            <Button onClick={handleSave} disabled={saving || !form.name || !form.slug || !form.municipalityId}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
