"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { confirmDialog } from "@/components/ui/system-dialog"
import {
  Gem,
  Plus,
  Edit3,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Star,
  Globe,
  Link,
  DollarSign,
  Crown,
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
  DialogTrigger,
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
import { formatCurrency } from "@/lib/utils"

type MembershipPlan = {
  id: string
  name: string
  slug: string
  description: string | null
  monthlyPrice: number
  priorityLevel: number
  maxListings: number
  maxGalleryImages: number
  hasFeaturedBadge: boolean
  hasSocialLinks: boolean
  hasWebsiteLink: boolean
  isActive: boolean
  createdAt: string
}

const defaultForm = {
  name: "",
  slug: "",
  description: "",
  monthlyPrice: 0,
  priorityLevel: 0,
  maxListings: 1,
  maxGalleryImages: 5,
  hasFeaturedBadge: false,
  hasSocialLinks: false,
  hasWebsiteLink: false,
  isActive: true,
}

export function PlanesClient({ plans }: { plans: MembershipPlan[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MembershipPlan | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const activeCount = plans.filter((p) => p.isActive).length

  const handleEdit = (plan: MembershipPlan) => {
    setEditing(plan)
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      monthlyPrice: Number(plan.monthlyPrice),
      priorityLevel: plan.priorityLevel,
      maxListings: plan.maxListings,
      maxGalleryImages: plan.maxGalleryImages,
      hasFeaturedBadge: plan.hasFeaturedBadge,
      hasSocialLinks: plan.hasSocialLinks,
      hasWebsiteLink: plan.hasWebsiteLink,
      isActive: plan.isActive,
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
      const url = editing ? `/api/admin/plans` : `/api/admin/plans`
      const method = editing ? "PUT" : "POST"
      const body = editing ? { id: editing.id, ...form } : form

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("Error al guardar")
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (plan: MembershipPlan) => {
    try {
      await fetch(`/api/admin/plans`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: plan.id, isActive: !plan.isActive }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDuplicate = async (plan: MembershipPlan) => {
    try {
      await fetch(`/api/admin/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${plan.name} (copia)`,
          slug: `${plan.slug}-copia`,
          description: plan.description,
          monthlyPrice: Number(plan.monthlyPrice),
          priorityLevel: plan.priorityLevel + 1,
          maxListings: plan.maxListings,
          maxGalleryImages: plan.maxGalleryImages,
          hasFeaturedBadge: plan.hasFeaturedBadge,
          hasSocialLinks: plan.hasSocialLinks,
          hasWebsiteLink: plan.hasWebsiteLink,
          isActive: false,
        }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (plan: MembershipPlan) => {
    if (!(await confirmDialog({
      title: "Eliminar plan",
      description: `¿Eliminar el plan "${plan.name}"?`,
      destructive: true,
    }))) return
    try {
      await fetch(`/api/admin/plans?id=${plan.id}`, { method: "DELETE" })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const planIcons = [Gem, Star, Crown] as const

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Planes de Membresía</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona los planes disponibles para los negocios</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="size-4" />
              Nuevo Plan
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Gem className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Precio más bajo</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.length > 0
                ? formatCurrency(Math.min(...plans.map((p) => Number(p.monthlyPrice))))
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.length === 0 ? (
          <div className="col-span-full flex h-40 items-center justify-center text-sm text-muted-foreground">
            No hay planes creados
          </div>
        ) : (
          plans.map((plan, index) => {
            const Icon = planIcons[index] || Gem
            return (
              <Card key={plan.id} className="relative flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="size-5 text-primary" />
                      <CardTitle>{plan.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleEdit(plan)}>
                          <Edit3 className="size-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(plan)}>
                          <Plus className="size-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(plan)}>
                          {plan.isActive ? (
                            <><XCircle className="size-4" /> Desactivar</>
                          ) : (
                            <><CheckCircle className="size-4" /> Activar</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(plan)}
                        >
                          <Trash2 className="size-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{formatCurrency(Number(plan.monthlyPrice))}</span>
                    <span className="text-xs text-muted-foreground">/mes</span>
                  </div>
                  {plan.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2">
                    <FeatureRow icon={Gem} label={`${plan.maxListings} listing${plan.maxListings !== 1 ? "s" : ""}`} />
                    <FeatureRow icon={CheckCircle} label={`${plan.maxGalleryImages} imágenes`} />
                    <FeatureRow icon={Star} label="Badge destacado" active={plan.hasFeaturedBadge} />
                    <FeatureRow icon={Globe} label="Redes sociales" active={plan.hasSocialLinks} />
                    <FeatureRow icon={Link} label="Sitio web" active={plan.hasWebsiteLink} />
                  </div>
                </CardContent>
                <div className="border-t px-4 py-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Prioridad: {plan.priorityLevel}</span>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Plan" : "Crear Plan"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Plan Básico"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="plan-basico"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción del plan..."
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Precio mensual</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.monthlyPrice}
                  onChange={(e) => setForm({ ...form, monthlyPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.priorityLevel}
                  onChange={(e) => setForm({ ...form, priorityLevel: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Max listings</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxListings}
                  onChange={(e) => setForm({ ...form, maxListings: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max imágenes</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxGalleryImages}
                  onChange={(e) => setForm({ ...form, maxGalleryImages: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Características</Label>
              <ToggleRow
                label="Badge destacado"
                checked={form.hasFeaturedBadge}
                onChange={(v) => setForm({ ...form, hasFeaturedBadge: v })}
              />
              <ToggleRow
                label="Redes sociales"
                checked={form.hasSocialLinks}
                onChange={(v) => setForm({ ...form, hasSocialLinks: v })}
              />
              <ToggleRow
                label="Sitio web"
                checked={form.hasWebsiteLink}
                onChange={(v) => setForm({ ...form, hasWebsiteLink: v })}
              />
              <ToggleRow
                label="Activo"
                checked={form.isActive}
                onChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FeatureRow({
  icon: Icon,
  label,
  active = true,
}: {
  icon: any
  label: string
  active?: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={`size-3.5 ${active ? "text-primary" : "text-muted-foreground/50"}`} />
      <span className={active ? "" : "text-muted-foreground/50"}>{label}</span>
      {active ? (
        <CheckCircle className="ml-auto size-3.5 text-green-500" />
      ) : (
        <XCircle className="ml-auto size-3.5 text-muted-foreground/40" />
      )}
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-normal">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
