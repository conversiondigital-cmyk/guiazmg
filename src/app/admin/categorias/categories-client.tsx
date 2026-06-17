"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Tag, Plus, Edit3, Trash2, Eye, EyeOff, ChevronRight, ChevronDownIcon,
} from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
// no select controls on this screen
import { slugify } from "@/lib/utils"
import { confirmDialog } from "@/components/ui/system-dialog"

type SubcategoryRow = {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  sortOrder: number
  _count: { businesses: number; listings: number }
}

type CategoryRow = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  isActive: boolean
  sortOrder: number
  subcategories: SubcategoryRow[]
  _count: { subcategories: number; businesses: number; listings: number }
}

type FormData = {
  name: string
  slug: string
  description: string
  icon: string
  sortOrder: number
  isActive: boolean
}

const emptyForm: FormData = { name: "", slug: "", description: "", icon: "", sortOrder: 0, isActive: true }

export function CategoriesClient({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter()
  // Render directamente desde la prop: tras guardar llamamos router.refresh()
  // y el server component vuelve a inyectar la lista actualizada. (Antes se
  // congelaba en useState(initial), por eso "no se guardaban" — sí se creaban
  // en la BD pero la tabla nunca se actualizaba.)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editDialog, setEditDialog] = useState<{ open: boolean; category?: CategoryRow; subcategory?: SubcategoryRow; parentId?: string }>({ open: false })
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreateCategory = () => {
    setForm(emptyForm)
    setEditDialog({ open: true })
  }

  const openEditCategory = (cat: CategoryRow) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      icon: cat.icon || "",
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    })
    setEditDialog({ open: true, category: cat })
  }

  const openCreateSubcategory = (cat: CategoryRow) => {
    setForm(emptyForm)
    setEditDialog({ open: true, parentId: cat.id })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editDialog.subcategory) {
        await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editDialog.subcategory.id, ...form }),
        })
      } else if (editDialog.parentId) {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, categoryId: editDialog.parentId, isSubcategory: true }),
        })
        if (!res.ok) throw new Error("Error")
      } else if (editDialog.category) {
        await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editDialog.category.id, ...form }),
        })
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error("Error")
      }
      setEditDialog({ open: false })
      router.refresh()
    } catch {
      console.error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch("/api/admin/categories", {
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

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog({
      title: "Eliminar",
      description: "¿Estás seguro de eliminar?",
      destructive: true,
    }))) return
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      })
      if (!res.ok) throw new Error("Error")
      router.refresh()
    } catch {
      console.error("Delete failed")
    }
  }

  const handleSortChange = async (id: string, sortOrder: number) => {
    try {
      await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, sortOrder }),
      })
      router.refresh()
    } catch {
      console.error("Sort failed")
    }
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
        <Button onClick={openCreateCategory}>
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Icono</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Subcategorías</TableHead>
              <TableHead className="text-center">Negocios</TableHead>
              <TableHead className="text-center">Anuncios</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center w-20">Orden</TableHead>
              <TableHead className="w-[180px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  No hay categorías
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <ExpandableCategoryRow
                  key={cat.id}
                  cat={cat}
                  expanded={expanded.has(cat.id)}
                  onToggle={() => toggleExpand(cat.id)}
                  onEdit={() => openEditCategory(cat)}
                  onToggleActive={() => handleToggleActive(cat.id)}
                  onDelete={() => handleDelete(cat.id)}
                  onAddSubcategory={() => openCreateSubcategory(cat)}
                  onSortChange={(val) => handleSortChange(cat.id, val)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog(open ? editDialog : { open: false })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editDialog.subcategory ? "Editar subcategoría" :
               editDialog.parentId ? "Añadir subcategoría" :
               editDialog.category ? "Editar categoría" : "Nueva categoría"}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, slug: editDialog.category ? form.slug : slugify(e.target.value) })}
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
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="icon">Icono</Label>
              <Input
                id="icon"
                placeholder="Ej: Store, MapPin..."
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
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
            <Button variant="outline" onClick={() => setEditDialog({ open: false })}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.slug}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ExpandableCategoryRow({
  cat, expanded, onToggle, onEdit, onToggleActive, onDelete, onAddSubcategory, onSortChange,
}: {
  cat: CategoryRow
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
  onAddSubcategory: () => void
  onSortChange: (val: number) => void
}) {
  return (
    <React.Fragment key={cat.id}>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell>
          {cat.subcategories.length > 0 ? (
            expanded ? <ChevronDownIcon className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : null}
        </TableCell>
        <TableCell>{cat.icon ? <span className="text-lg">{cat.icon}</span> : <Tag className="h-4 w-4 text-muted-foreground" />}</TableCell>
        <TableCell className="font-medium">{cat.name}</TableCell>
        <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
        <TableCell className="text-center">{cat._count.subcategories}</TableCell>
        <TableCell className="text-center">{cat._count.businesses}</TableCell>
        <TableCell className="text-center">{cat._count.listings}</TableCell>
        <TableCell>
          <Badge variant={cat.isActive ? "default" : "secondary"}>
            {cat.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </TableCell>
        <TableCell>
          <Input
            type="number"
            defaultValue={cat.sortOrder}
            className="h-7 w-16 text-center"
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => onSortChange(parseInt(e.target.value) || 0)}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-xs" onClick={onEdit} title="Editar">
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onToggleActive} title={cat.isActive ? "Desactivar" : "Activar"}>
              {cat.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onDelete} title="Eliminar">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onAddSubcategory} title="Añadir subcategoría">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && cat.subcategories.map((sub) => (
        <TableRow key={sub.id} className="bg-muted/30">
          <TableCell />
          <TableCell />
          <TableCell className="pl-8 text-sm text-muted-foreground">{sub.name}</TableCell>
          <TableCell className="text-sm text-muted-foreground">{sub.slug}</TableCell>
          <TableCell className="text-center text-sm text-muted-foreground">—</TableCell>
          <TableCell className="text-center text-sm">{sub._count.businesses}</TableCell>
          <TableCell className="text-center text-sm">{sub._count.listings}</TableCell>
          <TableCell>
            <Badge variant={sub.isActive ? "default" : "secondary"}>
              {sub.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </TableCell>
          <TableCell />
          <TableCell>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-xs" title="Editar">
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-xs" title={sub.isActive ? "Desactivar" : "Activar"}>
                {sub.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </React.Fragment>
  )
}
