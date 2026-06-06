"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Edit2, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Generic CRUD Client Template
 *
 * Usage:
 * <AdminCRUDClient
 *   title="Municipios"
 *   apiBase="/api/admin/municipios"
 *   items={municipios}
 *   columns={[
 *     { key: 'name', label: 'Nombre' },
 *     { key: 'slug', label: 'Slug' }
 *   ]}
 *   formFields={[
 *     { name: 'name', label: 'Nombre', type: 'text' },
 *     { name: 'slug', label: 'Slug', type: 'text' }
 *   ]}
 * />
 */

interface ColumnDef {
  key: string
  label: string
  render?: (value: any) => React.ReactNode
}

interface FormFieldDef {
  name: string
  label: string
  type?: string
  required?: boolean
}

interface AdminCRUDClientProps {
  title: string
  description?: string
  apiBase: string
  items: any[]
  columns: ColumnDef[]
  formFields: FormFieldDef[]
  statCards?: { label: string; value: number }[]
}

export function AdminCRUDClient({
  title,
  description,
  apiBase,
  items: initialItems,
  columns,
  formFields,
  statCards,
}: AdminCRUDClientProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newItem = await response.json()
        setItems([...items, newItem])
        setFormData({})
        setIsCreateOpen(false)
      }
    } catch (error) {
      console.error("Error creating item:", error)
    } finally {
      setIsLoading(false)
    }
  }, [apiBase, items, formData])

  const handleEdit = useCallback(async () => {
    if (!selectedItem) return

    setIsLoading(true)
    try {
      const response = await fetch(`${apiBase}/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updated = await response.json()
        setItems(items.map((i) => (i.id === selectedItem.id ? updated : i)))
        setFormData({})
        setSelectedItem(null)
        setIsEditOpen(false)
      }
    } catch (error) {
      console.error("Error updating item:", error)
    } finally {
      setIsLoading(false)
    }
  }, [apiBase, items, selectedItem, formData])

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return

    setIsLoading(true)
    try {
      const response = await fetch(`${apiBase}/${selectedItem.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setItems(items.filter((i) => i.id !== selectedItem.id))
        setSelectedItem(null)
        setIsDeleteOpen(false)
      }
    } catch (error) {
      console.error("Error deleting item:", error)
    } finally {
      setIsLoading(false)
    }
  }, [apiBase, items, selectedItem])

  const openEditDialog = (item: any) => {
    setSelectedItem(item)
    const newFormData: Record<string, any> = {}
    formFields.forEach((field) => {
      newFormData[field.name] = item[field.name] || ""
    })
    setFormData(newFormData)
    setIsEditOpen(true)
  }

  const openDeleteDialog = (item: any) => {
    setSelectedItem(item)
    setIsDeleteOpen(true)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
            {description && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </div>
          <Button
            onClick={() => {
              setFormData({})
              setSelectedItem(null)
              setIsCreateOpen(true)
            }}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Button>
        </div>

        {/* Stats */}
        {statCards && statCards.length > 0 && (
          <div className={`grid gap-4 ${statCards.length === 1 ? "sm:grid-cols-1" : statCards.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            {statCards.map((card) => (
              <Card key={card.label}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-950">
                      {card.value}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Listado ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">No hay registros</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="px-4 py-3 font-semibold text-slate-900"
                        >
                          {col.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 font-semibold text-slate-900">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        {columns.map((col) => (
                          <td key={col.key} className="px-4 py-3 text-slate-900">
                            {col.render
                              ? col.render(item[col.key])
                              : item[col.key]}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditDialog(item)}
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(item)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear {title}</DialogTitle>
            <DialogDescription>
              Completa los campos para crear un nuevo registro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formFields.map((field) => (
              <div key={field.name}>
                <label className="text-sm font-medium text-slate-900">
                  {field.label}
                </label>
                <Input
                  type={field.type || "text"}
                  value={formData[field.name] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [field.name]: e.target.value,
                    })
                  }
                  required={field.required}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Creando..." : "Crear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {title}</DialogTitle>
            <DialogDescription>
              Modifica los campos que desees
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formFields.map((field) => (
              <div key={field.name}>
                <label className="text-sm font-medium text-slate-900">
                  {field.label}
                </label>
                <Input
                  type={field.type || "text"}
                  value={formData[field.name] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [field.name]: e.target.value,
                    })
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
