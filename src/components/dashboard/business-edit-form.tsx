"use client"

import { Store, MapPin, Phone, Clock, Shield, Tag, Globe, Star, Check } from "@/lib/icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

const VERIFICATION_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"> = {
  UNVERIFIED: "outline",
  PENDING: "secondary",
  VERIFIED: "default",
  REJECTED: "destructive",
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
  const statusColor = STATUS_VARIANTS[business.status] ?? "outline"
  const verificationColor = VERIFICATION_VARIANTS[business.verificationStatus] ?? "outline"

  return (
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
              <ReadOnlyInput value={business.name} />
            </Field>
            <Field label="Slug">
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
              <ReadOnlyInput value={business.shortDescription} />
            </Field>
            <Field label="Descripción">
              <Textarea value={business.description ?? ""} disabled readOnly className="text-muted-foreground min-h-24" />
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
              <ReadOnlyInput value={business.phone} />
            </Field>
            <Field label="WhatsApp">
              <ReadOnlyInput value={business.whatsapp} />
            </Field>
            <Field label="Correo electrónico">
              <ReadOnlyInput value={business.email} />
            </Field>
            <Field label="Sitio web">
              <ReadOnlyInput value={business.websiteUrl} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Redes Sociales" icon={Globe}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Facebook">
              <ReadOnlyInput value={business.facebookUrl} />
            </Field>
            <Field label="Instagram">
              <ReadOnlyInput value={business.instagramUrl} />
            </Field>
            <Field label="TikTok">
              <ReadOnlyInput value={business.tiktokUrl} />
            </Field>
            <Field label="YouTube">
              <ReadOnlyInput value={business.youtubeUrl} />
            </Field>
            <Field label="LinkedIn">
              <ReadOnlyInput value={business.linkedinUrl} />
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
              <ReadOnlyInput value={business.addressText} />
            </Field>
            <Field label="Código Postal">
              <ReadOnlyInput value={business.postalCode} />
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
              <ReadOnlyInput value={business.googleMapsUrl} />
            </Field>
            <Field label="Waze URL">
              <ReadOnlyInput value={business.wazeUrl} />
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
                <Badge variant={statusColor}>{business.status}</Badge>
              </div>
            </Field>
            <Field label="Verificación">
              <div>
                <Badge variant={verificationColor}>{business.verificationStatus}</Badge>
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
      </TabsContent>
    </Tabs>
  )
}
