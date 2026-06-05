"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BadgePercent,
  Plus,
  Edit3,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Tag,
  Calendar,
  Clock,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"

type Coupon = {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  minAmount: number | null
  maxUses: number | null
  usedCount: number
  startsAt: string | null
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

type Stats = {
  total: number
  active: number
  expired: number
}

const defaultForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: 0,
  minAmount: "",
  maxUses: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
}

export function CuponesClient({ coupons, stats }: { coupons: Coupon[]; stats: Stats }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  const filteredCoupons = search
    ? coupons.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
      )
    : coupons

  const handleEdit = (coupon: Coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minAmount: coupon.minAmount ? String(coupon.minAmount) : "",
      maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : "",
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
      isActive: coupon.isActive,
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

      const res = await fetch("/api/admin/promotion-coupons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          discountValue: parseFloat(String(body.discountValue)),
          minAmount: body.minAmount ? parseFloat(body.minAmount) : null,
          maxUses: body.maxUses ? parseInt(body.maxUses) : null,
          startsAt: body.startsAt || null,
          expiresAt: body.expiresAt || null,
        }),
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

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await fetch("/api/admin/promotion-coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const isExpired = (coupon: Coupon) =>
    coupon.expiresAt && new Date(coupon.expiresAt) < new Date()

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Cupones</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona los cupones de descuento</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={handleNew}>
            <Plus className="size-4" />
            Nuevo cupón
          </Button>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total cupones</CardTitle>
            <Tag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expirados</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por código o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Mínimo</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Máximo</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCoupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No se encontraron cupones
                </TableCell>
              </TableRow>
            ) : (
              filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <BadgePercent className="size-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{coupon.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {coupon.discountType === "PERCENTAGE" ? "Porcentaje" : "Fijo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {coupon.discountType === "PERCENTAGE"
                      ? `${Number(coupon.discountValue)}%`
                      : formatCurrency(Number(coupon.discountValue))}
                  </TableCell>
                  <TableCell>
                    {coupon.minAmount ? formatCurrency(Number(coupon.minAmount)) : "—"}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{coupon.usedCount}</span>
                    <span className="text-xs text-muted-foreground">
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                    </span>
                  </TableCell>
                  <TableCell>{coupon.maxUses ?? "∞"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {coupon.startsAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(coupon.startsAt).toLocaleDateString("es-MX")}
                      </div>
                    )}
                    {coupon.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(coupon.expiresAt).toLocaleDateString("es-MX")}
                      </div>
                    )}
                    {!coupon.startsAt && !coupon.expiresAt && "Sin fecha"}
                  </TableCell>
                  <TableCell>
                    {isExpired(coupon) ? (
                      <Badge variant="secondary">Expirado</Badge>
                    ) : coupon.isActive ? (
                      <Badge variant="default">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                          <Edit3 className="size-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(coupon)}>
                          {coupon.isActive ? (
                            <><XCircle className="size-4" /> Desactivar</>
                          ) : (
                            <><CheckCircle className="size-4" /> Activar</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cupón" : "Nuevo cupón"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Código</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="BIENVENIDO20"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de descuento</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) => setForm({ ...form, discountType: v ?? "PERCENTAGE" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                    <SelectItem value="FIXED">Monto fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <Input
                  type="number"
                  min={0}
                  step={form.discountType === "PERCENTAGE" ? "1" : "0.01"}
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={form.discountType === "PERCENTAGE" ? "20" : "100"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Monto mínimo (opcional)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.minAmount}
                  onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                  placeholder="500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="20% de descuento en membresías..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Usos máximos (opcional)</Label>
              <Input
                type="number"
                min={0}
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Inicio</Label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expiración</Label>
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
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
            <Button onClick={handleSave} disabled={saving || !form.code || !form.discountValue}>
              {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
