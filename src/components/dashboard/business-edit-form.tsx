"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import NextImage from "next/image"
import { toast } from "sonner"
import { Store, MapPin, Phone, Clock, Shield, Tag, Globe, Star, Check, Loader2, Trash2, Camera, Upload, X, Plus } from "@/lib/icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { confirmDialog } from "@/components/ui/system-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

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
  images: Array<{
    id: string
    imageUrl: string
    sortOrder: number
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

type CategoryOption = {
  id: string
  name: string
  subcategories: Array<{ id: string; name: string }>
}

type HourRow = {
  dayOfWeek: number
  opensAt: string
  closesAt: string
  isClosed: boolean
}

interface BusinessEditFormProps {
  business: BusinessData
  categories: CategoryOption[]
}

// Orden de despliegue: Lunes → Domingo (dayOfWeek 0 = Domingo va al final).
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

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

export function BusinessEditForm({ business, categories }: BusinessEditFormProps) {
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

  // Categoría / subcategoría editables.
  const [categoryId, setCategoryId] = useState(business.category?.id ?? "")
  const [subcategoryId, setSubcategoryId] = useState(business.subcategory?.id ?? "")
  const subOptions = categories.find((c) => c.id === categoryId)?.subcategories ?? []

  const handleCategoryChange = (value: string | null) => {
    setCategoryId(value ?? "")
    setSubcategoryId("") // al cambiar de categoría la subcategoría anterior ya no aplica
  }

  // Horarios editables: una fila por día (7), rellenando desde los registros
  // existentes; los días sin registro arrancan como "Cerrado".
  const [hours, setHours] = useState<HourRow[]>(() => {
    const byDay = new Map(business.hours.map((h) => [h.dayOfWeek, h]))
    return DAY_ORDER.map((d) => {
      const h = byDay.get(d)
      return {
        dayOfWeek: d,
        opensAt: h?.opensAt ?? "09:00",
        closesAt: h?.closesAt ?? "18:00",
        isClosed: h ? h.isClosed : true,
      }
    })
  })

  const setHour = (dayOfWeek: number, patch: Partial<HourRow>) =>
    setHours((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)))

  // Fotos: logo y portada (una c/u) + galería (varias). Se suben a R2 vía
  // /api/upload y se guarda la URL persistente que devuelve.
  const [logoUrl, setLogoUrl] = useState<string>(business.logoUrl ?? "")
  const [coverImageUrl, setCoverImageUrl] = useState<string>(business.coverImageUrl ?? "")
  const [gallery, setGallery] = useState<string[]>(() => business.images.map((im) => im.imageUrl))
  const [uploading, setUploading] = useState(false)
  const MAX_GALLERY = 12

  const uploadOne = async (file: File): Promise<string | null> => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      toast.error(`${file.name}: usa JPG, PNG, WebP o GIF`)
      return null
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name}: máximo 5MB`)
      return null
    }
    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", "business")
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error || `No se pudo subir ${file.name}`)
      return null
    }
    return data.url as string
  }

  const handleSingleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadOne(file)
      if (url) setter(url)
    } finally {
      setUploading(false)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ""
    if (!files.length) return
    const room = MAX_GALLERY - gallery.length
    if (room <= 0) {
      toast.error(`Máximo ${MAX_GALLERY} fotos en la galería`)
      return
    }
    setUploading(true)
    try {
      for (const file of files.slice(0, room)) {
        const url = await uploadOne(file)
        if (url) setGallery((prev) => [...prev, url])
      }
      if (files.length > room) toast.error(`Solo caben ${MAX_GALLERY} fotos; algunas no se agregaron`)
    } finally {
      setUploading(false)
    }
  }

  const statusColor = STATUS_VARIANTS[business.status] ?? "outline"
  const verificationColor = VERIFICATION_VARIANTS[business.verificationStatus] ?? "outline"

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre no puede quedar vacío")
      return
    }
    if (!categoryId) {
      toast.error("Selecciona una categoría")
      return
    }
    if (uploading) {
      toast.error("Espera a que terminen de subir las fotos")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoryId,
          subcategoryId: subcategoryId || null,
          logoUrl: logoUrl || null,
          coverImageUrl: coverImageUrl || null,
          images: gallery,
          hours: hours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            opensAt: h.isClosed ? null : h.opensAt,
            closesAt: h.isClosed ? null : h.closesAt,
            isClosed: h.isClosed,
          })),
        }),
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
          <TabsTrigger value="fotos">
            <Camera className="size-4" />
            Fotos
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
                <Select value={categoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Subcategoría">
                <Select
                  value={subcategoryId}
                  onValueChange={(v) => setSubcategoryId(v ?? "")}
                  disabled={subOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={subOptions.length ? "Seleccionar subcategoría" : "Sin subcategorías"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <p className="mb-4 text-sm text-muted-foreground">
              Activa cada día que abras y define la hora de apertura y cierre.
            </p>
            <div className="divide-y">
              {hours.map((h) => (
                <div key={h.dayOfWeek} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-24 shrink-0 font-medium">{DAY_LABELS[h.dayOfWeek]}</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!h.isClosed}
                      onCheckedChange={(open) => setHour(h.dayOfWeek, { isClosed: !open })}
                    />
                    <span className="w-16 text-sm text-muted-foreground">
                      {h.isClosed ? "Cerrado" : "Abierto"}
                    </span>
                  </div>
                  {!h.isClosed && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={h.opensAt}
                        onChange={(e) => setHour(h.dayOfWeek, { opensAt: e.target.value })}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={h.closesAt}
                        onChange={(e) => setHour(h.dayOfWeek, { closesAt: e.target.value })}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="fotos" className="space-y-6">
          <SectionCard title="Logo" icon={Camera}>
            <p className="mb-3 text-sm text-muted-foreground">
              Imagen cuadrada de tu negocio (aparece en el perfil y en los resultados).
            </p>
            <div className="flex items-center gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {logoUrl ? (
                  <NextImage src={logoUrl} alt="Logo" fill className="object-cover" sizes="96px" unoptimized />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <Camera className="size-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
                  <Upload className="size-4" />
                  {logoUrl ? "Cambiar logo" : "Subir logo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSingleUpload(e, setLogoUrl)} disabled={uploading} />
                </label>
                {logoUrl && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setLogoUrl("")}>
                    <Trash2 className="size-4" />
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Portada" icon={Camera}>
            <p className="mb-3 text-sm text-muted-foreground">
              Imagen ancha que encabeza tu perfil (recomendado 1200×400).
            </p>
            <div className="space-y-3">
              <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border bg-muted">
                {coverImageUrl ? (
                  <NextImage src={coverImageUrl} alt="Portada" fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" unoptimized />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <Camera className="size-6" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
                  <Upload className="size-4" />
                  {coverImageUrl ? "Cambiar portada" : "Subir portada"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSingleUpload(e, setCoverImageUrl)} disabled={uploading} />
                </label>
                {coverImageUrl && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setCoverImageUrl("")}>
                    <Trash2 className="size-4" />
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Galería" icon={Camera}>
            <p className="mb-3 text-sm text-muted-foreground">
              Fotos de tu negocio, productos o servicios (hasta {MAX_GALLERY}).
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {gallery.map((url, i) => (
                <div key={`${url}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  <NextImage src={url} alt={`Foto ${i + 1}`} fill className="object-cover" sizes="150px" unoptimized />
                  <button
                    type="button"
                    onClick={() => setGallery((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    title="Quitar foto"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {gallery.length < MAX_GALLERY && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:bg-accent">
                  {uploading ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
                  <span className="text-xs">Agregar</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} disabled={uploading} />
                </label>
              )}
            </div>
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
