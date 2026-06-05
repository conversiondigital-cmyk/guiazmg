"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Rocket,
  Plus,
  Edit3,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Calendar,
  Coins,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type BoostDefinition = {
  id: string
  name: string
  durationDays: number
  price: number
  priorityBonus: number
  isActive: boolean
  createdAt: string
}

type Stats = {
  total: number
  active: number
}

const defaultForm = {
  name: "",
  durationDays: 7,
  price: 49,
  priorityBonus: 0,
  isActive: true,
}

export function BoostsDefinicionesClient({
  definitions,
  stats,
}: {
  definitions: BoostDefinition[]
  stats: Stats
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BoostDefinition | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const handleEdit = (def: BoostDefinition) => {
    setEditing(def)
    setForm({
      name: def.name,
      durationDays: def.durationDays,
      price: def.price,
      priorityBonus: def.priorityBonus,
      isActive: def.isActive,
    })
    setOpen(true)
  }

  const handleNew = () => {
    setEditing(null)
    setForm(defaultForm)
    setOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const method = editing ? "PUT" : "POST"
      const body = editing ? { id: editing.id, ...form } : form

      const res = await fetch("/api/admin/boost-definitions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("Error")
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (def: BoostDefinition) => {
    try {
      await fetch("/api/admin/boost-definitions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: def.id, isActive: !def.isActive }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Definiciones de Boost</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configura los paquetes de boost disponibles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={handleNew}>
            <Plus className="size-4" />
            Nueva definición
          </Button>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Rocket className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {definitions.length === 0 ? (
          <div className="col-span-full flex h-32 items-center justify-center text-sm text-muted-foreground">
            No hay definiciones de boost
          </div>
        ) : (
          definitions.map((def) => (
            <Card key={def.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Rocket className="size-5 text-purple-500" />
                    <CardTitle className="text-base">{def.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-xs">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => handleEdit(def)}>
                        <Edit3 className="size-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleStatus(def)}>
                        {def.isActive ? (
                          <><XCircle className="size-4" /> Desactivar</>
                        ) : (
                          <><CheckCircle className="size-4" /> Activar</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duración</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{def.durationDays} días</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Costo</span>
                    <div className="flex items-center gap-1">
                      <Coins className="size-3.5 text-yellow-500" />
                      <span className="font-medium">{def.price.toLocaleString()} MXN</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bonus prioridad</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="size-3.5 text-blue-500" />
                      <span className="font-medium">+{def.priorityBonus}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="border-t px-4 py-3">
                <Badge variant={def.isActive ? "default" : "secondary"}>
                  {def.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar definición" : "Nueva definición"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Boost 7 días"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duración (días)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Precio (MXN)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Bonus de prioridad</Label>
              <Input
                type="number"
                min={0}
                value={form.priorityBonus}
                onChange={(e) => setForm({ ...form, priorityBonus: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Puntos adicionales de prioridad en búsquedas
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-normal">Activo</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
