"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Store, MapPin, Phone, Clock, Shield, Tag, Globe, Star, Check, Loader2, Trash2 } from "@/lib/icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { confirmDialog } from "@/components/ui/system-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"

const DAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"> = {
  DRAFT: "ghost",
  PENDING_REVIEW: "secondary",
  ACTIVE: "default",
  SUSPENDED: "destructive",
  INACTIVE: "outline",
  REJECTED: "destructive",
  ARCHIVED: "outline",
}

// Etiquetas legibles para no mostrar el enum crudo (PENDING_REVIEW → "En revisión").
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING_REVIEW: "En revisión",
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
  INACTIVE: "Inactivo",
  REJECTED: "Rechazado",
  ARCHIVED: "Archivado",
}

const VERIFICATION_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"> = {
  UNVERIFIED: "outline",
  PENDING: "secondary",
  VERIFIED: "default",
  REJECTED: "destructive",
}

const VERIFICATION_LABELS: Record<string, string> = {
  UNVERIFIED: "Sin verificar",
  PENDING: "En proceso",
  VERIFIED: "Verificado",
  REJECTED: "Rechazado",
}

type BusinessData = {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  description: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  websiteUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  tiktokUrl: string | null
  youtubeUrl: string | null
  linkedinUrl: string | null
  googleMapsUrl: string | null
  wazeUrl: string | null
  addressText: string | null
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  logoUrl: string | null
  coverImageUrl: string | null
  status: string
  verificationStatus: string
  isVerified: boolean
  isFeatured: boolean
  isPremium: boolean
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  municipality: { id: string; name: string; [key: string]: unknown } | null
  neighborhood: { id: string; name: string; [key: string]: unknown } | null
  category: { id: string; name: string; [key: string]: unknown } | null
  subcategory: { id: string; name: string; [key: string]: unknown } | null
  memberships: Array<{
    id: string
    status: string
    currentPeriodEnd: Date | string
    plan: { id: string; name: string; [key: string]: unknown }
    [key: string]: unknown
  }>
  hours: Array<{
    id: string
    dayOfWeek: number
    opensAt: string | null
    closesAt: string | null
    isClosed: boolean
    [key: string]: unknown
  }>
  tags: Array<{
    id: string
    tag: { id: string; name: string; [key: string]: unknown }
    [key: string]: unknown
  }>
  coupons: Array<{
    id: string
    title: string
    description: string | null
    code: string | null
    isActive: boolean
    [key: string]: unknown
  }>
  _count: { reviews: number; [key: string]: unknown }
  [key: string]: unknown
}

interface BusinessEditFormProps {
  business: BusinessData
}

// Campos de texto/enlace que el dueño puede editar (deben coincidir con
// businessUpdateSchema en /api/business PATCH).
const EDITABLE_KEYS = [
  "name", "shortDescription", "description", "phone", "whatsapp", "email",
  "websiteUrl", "facebookUrl", "instagramUrl", "tiktokUrl", "youtubeUrl",
  "linkedinUrl", "addressText", "postalCode", "googleMapsUrl", "wazeUrl",
] as const

type EditableKey = (typeof EDITABLE_KEYS)[number]
type FormState = Record<EditableKey, string>

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ReadOnlyInput({ value }: { value: string | null | undefined }) {
  return (
    <Input value={value ?? ""} disabled readOnly className="text-muted-foreground" />
  )
}

export function BusinessEditForm({ business }: BusinessEditFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState<FormState>(() =>
    EDITABLE_KEYS.reduce((acc, key) => {
      acc[key] = (business[key] as string | null) ?? ""
      return acc
    }, {} as FormState)
  )

  const set = (key: EditableKey, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  const statusColor = STATUS_VARIANTS[business.status] ?? "outline"
  const verificationColor = VERIFICATION_VARIANTS[business.verificationStatus] ?? "outline"

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre no puede quedar vacío")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "No se pudieron guardar los cambios")
        return
      }
      toast.success("Cambios guardados")
      router.refresh()
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: "Eliminar negocio",
      description: "Tu negocio dejará de aparecer en Guía ZMG. Podrás registrar uno nuevo después. ¿Continuar?",
      confirmText: "Eliminar",
      destructive: true,
    })
    if (!confirmed) return
    setDeleting(true)
    try {
      const res = await fetch("/api/business", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "No se pudo eliminar el negocio")
        return
      }
      toast.success("Negocio eliminado")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="general">
            <Store className="size-4" />
            Información General
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Phone className="size-4" />
            Contacto
          </TabsTrigger>
          <TabsTrigger value="location">
            <MapPin className="size-4" />
            Ubicación
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="size-4" />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="status">
            <Shield className="size-4" />
            Estado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <SectionCard title="Información General" icon={Store}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nombre del negocio">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Enlace (no cambia al editar el nombre)">
                <ReadOnlyInput value={business.slug} />
              </Field>
              <Field label="Categoría">
                <ReadOnlyInput value={business.category?.name} />
              </Field>
              <Field label="Subcategoría">
                <ReadOnlyInput value={business.subcategory?.name} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <Field label="Descripción corta">
                <Input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} maxLength={200} />
              </Field>
              <Field label="Descripción">
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="min-h-24" maxLength={5000} />
              </Field>
            </div>
          </SectionCard>

          {business.tags.length > 0 && (
            <SectionCard title="Etiquetas" icon={Tag}>
              <div className="flex flex-wrap gap-2">
                {business.tags.map((bt) => (
                  <Badge key={bt.id} variant="secondary">
                    <Tag className="size-3" />
                    {bt.tag.name}
                  </Badge>
                ))}
              </div>
            </SectionCard>
          )}

          {business.coupons.length > 0 && (
            <SectionCard title="Cupones" icon={Tag}>
              <div className="space-y-3">
                {business.coupons.map((coupon) => (
                  <div key={coupon.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{coupon.title}</p>
                      {coupon.description && (
                        <p className="text-sm text-muted-foreground">{coupon.description}</p>
                      )}
                      {coupon.code && (
                        <p className="text-xs text-muted-foreground mt-1">Código: {coupon.code}</p>
                      )}
                    </div>
                    <Badge variant={coupon.isActive ? "default" : "outline"}>
                      {coupon.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <SectionCard title="Información de Contacto" icon={Phone}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Teléfono">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" />
              </Field>
              <Field label="WhatsApp">
                <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} inputMode="tel" />
              </Field>
              <Field label="Correo electrónico">
                <Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" />
              </Field>
              <Field label="Sitio web">
                <Input value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Redes Sociales" icon={Globe}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Facebook">
                <Input value={form.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." />
              </Field>
              <Field label="Instagram">
                <Input value={form.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." />
              </Field>
              <Field label="TikTok">
                <Input value={form.tiktokUrl} onChange={(e) => set("tiktokUrl", e.target.value)} placeholder="https://tiktok.com/@..." />
              </Field>
              <Field label="YouTube">
                <Input value={form.youtubeUrl} onChange={(e) => set("youtubeUrl", e.target.value)} placeholder="https://youtube.com/..." />
              </Field>
              <Field label="LinkedIn">
                <Input value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/..." />
              </Field>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <SectionCard title="Ubicación" icon={MapPin}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Municipio">
                <ReadOnlyInput value={business.municipality?.name} />
              </Field>
              <Field label="Colonia / Fraccionamiento">
                <ReadOnlyInput value={business.neighborhood?.name} />
              </Field>
              <Field label="Dirección">
                <Input value={form.addressText} onChange={(e) => set("addressText", e.target.value)} />
              </Field>
              <Field label="Código Postal">
                <Input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} inputMode="numeric" />
              </Field>
              <Field label="Latitud">
                <ReadOnlyInput value={business.latitude?.toString()} />
              </Field>
              <Field label="Longitud">
                <ReadOnlyInput value={business.longitude?.toString()} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Mapas" icon={MapPin}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Google Maps URL">
                <Input value={form.googleMapsUrl} onChange={(e) => set("googleMapsUrl", e.target.value)} placeholder="https://maps.google.com/..." />
              </Field>
              <Field label="Waze URL">
                <Input value={form.wazeUrl} onChange={(e) => set("wazeUrl", e.target.value)} placeholder="https://waze.com/..." />
              </Field>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
          <SectionCard title="Horarios" icon={Clock}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead>Abre</TableHead>
                  <TableHead>Cierra</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {business.hours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      No hay horarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  business.hours.map((hour) => (
                    <TableRow key={hour.id}>
                      <TableCell className="font-medium">{DAY_LABELS[hour.dayOfWeek] ?? `Día ${hour.dayOfWeek}`}</TableCell>
                      <TableCell>{hour.isClosed ? "—" : hour.opensAt ?? "—"}</TableCell>
                      <TableCell>{hour.isClosed ? "—" : hour.closesAt ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={hour.isClosed ? "outline" : "default"}>
                          {hour.isClosed ? "Cerrado" : "Abierto"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <SectionCard title="Estado del Negocio" icon={Shield}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Estatus">
                <div>
                  <Badge variant={statusColor}>{STATUS_LABELS[business.status] ?? business.status}</Badge>
                </div>
              </Field>
              <Field label="Verificación">
                <div>
                  <Badge variant={verificationColor}>{VERIFICATION_LABELS[business.verificationStatus] ?? business.verificationStatus}</Badge>
                </div>
              </Field>
              <Field label="Activo">
                <div>
                  <Badge variant={business.isActive ? "default" : "outline"}>
                    {business.isActive ? "Sí" : "No"}
                  </Badge>
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Distinciones" icon={Star}>
            <div className="flex flex-wrap gap-3">
              <Badge variant={business.isVerified ? "default" : "outline"} className="gap-1.5">
                <Check className="size-3" />
                Verificado
              </Badge>
              <Badge variant={business.isFeatured ? "default" : "outline"} className="gap-1.5">
                <Star className="size-3" />
                Destacado
              </Badge>
              <Badge variant={business.isPremium ? "default" : "outline"} className="gap-1.5">
                <Star className="size-3" />
                Premium
              </Badge>
            </div>
          </SectionCard>

          {business.memberships.length > 0 && (
            <SectionCard title="Membresía" icon={Shield}>
              <div className="space-y-3">
                {business.memberships.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{m.plan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.status} — Finaliza: {new Date(m.currentPeriodEnd).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                    <Badge variant={m.status === "ACTIVE" ? "default" : "outline"}>{m.status}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Estadísticas" icon={Store}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border text-center">
                <p className="text-2xl font-bold">{business._count.reviews}</p>
                <p className="text-sm text-muted-foreground">Reseñas</p>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <p className="text-2xl font-bold">{business.hours.length}</p>
                <p className="text-sm text-muted-foreground">Horarios registrados</p>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <p className="text-2xl font-bold">{business.coupons.length}</p>
                <p className="text-sm text-muted-foreground">Cupones</p>
              </div>
            </div>
          </SectionCard>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Trash2 className="size-4" />
                Zona de peligro
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Eliminar tu negocio lo quita de Guía ZMG. Podrás registrar uno nuevo después.
              </p>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="shrink-0">
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Eliminar negocio
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Barra de guardado — aplica a los campos editables de todas las pestañas */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-background/95 py-3 backdrop-blur">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
