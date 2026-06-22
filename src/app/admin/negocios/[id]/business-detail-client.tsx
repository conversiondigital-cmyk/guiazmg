"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { confirmDialog } from "@/components/ui/system-dialog"
import {
  Store,
  Eye,
  Trash2,
  Shield,
  MapPin,
  Star,
  Activity,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { timeAgo } from "@/lib/utils"

type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: Date
  actor: { id: string; name: string; email: string }
}

type Analytics = {
  views: number
  whatsappClicks: number
  phoneClicks: number
  websiteClicks: number
}

type Image = {
  id: string
  imageUrl: string
  sortOrder: number
}

type Plan = { id: string; name: string }
type Membership = {
  id: string
  plan: Plan | null
  status: string
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
}

type Owner = { id: string; name: string; email: string; image: string | null; phone: string | null }
type Category = { id: string; name: string }
type Subcategory = { id: string; name: string }
type Municipality = { id: string; name: string }
type Neighborhood = { id: string; name: string; municipality: { id: string; name: string } | null }

type BusinessDetail = {
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
  youtubeUrl: string | null
  tiktokUrl: string | null
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
  createdAt: Date
  updatedAt: Date
  owner: Owner
  category: Category | null
  subcategory: Subcategory | null
  municipality: Municipality | null
  neighborhood: Neighborhood | null
  images: Image[]
  memberships: Membership[]
  auditLogs: AuditLog[]
  analytics: Analytics
  _count: { reviews: number; reports: number; leads: number }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="col-span-2">{value || "—"}</span>
    </div>
  )
}

function SocialLink({ url, label, icon }: { url: string | null; label: string; icon: React.ReactNode }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
    >
      {icon}
      {label}
    </a>
  )
}

export function BusinessDetailClient({ business }: { business: BusinessDetail }) {
  const router = useRouter()
  const [isVerificationOpen, setIsVerificationOpen] = useState(false)
  const [verificationType, setVerificationType] = useState("NEGOCIO")
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleAction = async (action: string, extraBody?: Record<string, any>) => {
    setIsLoading(action)
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraBody }),
      })
      if (!res.ok) throw new Error("Error")
      setIsVerificationOpen(false)
      router.refresh()
    } catch {
      console.error("Action failed")
    } finally {
      setIsLoading(null)
    }
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      DRAFT: "ghost",
      PENDING_REVIEW: "outline",
      ACTIVE: "default",
      SUSPENDED: "destructive",
      INACTIVE: "secondary",
      REJECTED: "destructive",
      ARCHIVED: "secondary",
    }
    const labels: Record<string, string> = {
      DRAFT: "Borrador",
      PENDING_REVIEW: "Pendiente",
      ACTIVE: "Activo",
      SUSPENDED: "Suspendido",
      INACTIVE: "Inactivo",
      REJECTED: "Rechazado",
      ARCHIVED: "Archivado",
    }
    return <Badge variant={(variants[status] || "ghost") as any}>{labels[status] || status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>
            <p className="text-sm text-muted-foreground">/{business.slug}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {statusBadge(business.status)}
            {business.isVerified && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            )}
            {business.isFeatured && (
              <Badge variant="secondary">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                Destacado
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {business.status === "PENDING_REVIEW" && (
            <Button
              variant="default"
              size="sm"
              disabled={isLoading === "APPROVE"}
              onClick={() => handleAction("APPROVE")}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprobar
            </Button>
          )}
          {business.status !== "REJECTED" && business.status !== "PENDING_REVIEW" && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isLoading === "REJECT"}
              onClick={() => handleAction("REJECT")}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
          )}
          {business.status !== "SUSPENDED" && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isLoading === "SUSPEND"}
              onClick={() => handleAction("SUSPEND")}
            >
              <Shield className="h-4 w-4 mr-1" />
              Suspender
            </Button>
          )}
          {business.status === "SUSPENDED" && (
            <Button
              variant="default"
              size="sm"
              disabled={isLoading === "ACTIVATE"}
              onClick={() => handleAction("ACTIVATE")}
            >
              <Activity className="h-4 w-4 mr-1" />
              Activar
            </Button>
          )}
          <Dialog open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                {business.isVerified ? "Verificación" : "Verificar"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {business.isVerified
                    ? "Administrar verificación"
                    : "Verificar negocio"}
                </DialogTitle>
                <DialogDescription>
                  {business.isVerified
                    ? "Puedes quitar la verificación o cambiar el tipo."
                    : "Selecciona el tipo de verificación para este negocio."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="verificationType">Tipo de verificación</Label>
                  <select
                    id="verificationType"
                    value={verificationType}
                    onChange={(e) => setVerificationType(e.target.value)}
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                  >
                    <option value="NEGOCIO">Negocio</option>
                    <option value="PROFESIONAL">Profesional</option>
                    <option value="EMPRESA">Empresa</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                {business.isVerified ? (
                  <>
                    <Button
                      variant="destructive"
                      disabled={isLoading === "UNVERIFY"}
                      onClick={() => handleAction("UNVERIFY")}
                    >
                      Quitar verificación
                    </Button>
                    <Button
                      disabled={isLoading === "VERIFY"}
                      onClick={() => handleAction("VERIFY", { verificationType })}
                    >
                      Actualizar
                    </Button>
                  </>
                ) : (
                  <Button
                    disabled={isLoading === "VERIFY"}
                    onClick={() => handleAction("VERIFY", { verificationType })}
                  >
                    Verificar como {verificationType}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant={business.isFeatured ? "secondary" : "outline"}
            size="sm"
            disabled={isLoading === "FEATURE"}
            onClick={() => handleAction("FEATURE")}
          >
            <Star className="h-4 w-4 mr-1" />
            {business.isFeatured ? "Quitar destacado" : "Destacar"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Eye className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(`/perfil/${business.slug}`, "_blank")}>
                <Globe className="h-4 w-4" />
                Ver en sitio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  if (await confirmDialog({
                    title: "Archivar negocio",
                    description: "¿Archivar este negocio?",
                    confirmText: "Archivar",
                    destructive: true,
                  })) handleAction("ARCHIVE")
                }}
              >
                <Trash2 className="h-4 w-4" />
                Archivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos generales</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Nombre" value={business.name} />
            <InfoRow label="Descripción corta" value={business.shortDescription} />
            <InfoRow
              label="Descripción"
              value={
                business.description ? (
                  <p className="whitespace-pre-wrap text-sm">{business.description}</p>
                ) : null
              }
            />
            <Separator className="my-2" />
            <InfoRow
              label="Teléfono"
              value={
                business.phone ? (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                    <Phone className="h-3.5 w-3.5" />
                    {business.phone}
                  </a>
                ) : null
              }
            />
            <InfoRow
              label="WhatsApp"
              value={
                business.whatsapp ? (
                  <a
                    href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-green-600 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {business.whatsapp}
                  </a>
                ) : null
              }
            />
            <InfoRow
              label="Email"
              value={
                business.email ? (
                  <a href={`mailto:${business.email}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                    <Mail className="h-3.5 w-3.5" />
                    {business.email}
                  </a>
                ) : null
              }
            />
            <InfoRow
              label="Sitio web"
              value={
                business.websiteUrl ? (
                  <a
                    href={business.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {business.websiteUrl}
                  </a>
                ) : null
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redes sociales</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <SocialLink url={business.facebookUrl} label="Facebook" icon={<Globe className="h-3.5 w-3.5" />} />
            <SocialLink url={business.instagramUrl} label="Instagram" icon={<Globe className="h-3.5 w-3.5" />} />
            <SocialLink url={business.youtubeUrl} label="YouTube" icon={<Globe className="h-3.5 w-3.5" />} />
            <SocialLink url={business.tiktokUrl} label="TikTok" icon={<Globe className="h-3.5 w-3.5" />} />
            <SocialLink url={business.linkedinUrl} label="LinkedIn" icon={<Globe className="h-3.5 w-3.5" />} />
            {!business.facebookUrl &&
              !business.instagramUrl &&
              !business.youtubeUrl &&
              !business.tiktokUrl &&
              !business.linkedinUrl && (
                <p className="text-sm text-muted-foreground">Sin redes sociales registradas</p>
              )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Categoría" value={business.category?.name} />
            <InfoRow label="Subcategoría" value={business.subcategory?.name} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Municipio" value={business.municipality?.name} />
            <InfoRow
              label="Colonia"
              value={
                business.neighborhood
                  ? `${business.neighborhood.name}${business.neighborhood.municipality ? ` (${business.neighborhood.municipality.name})` : ""}`
                  : null
              }
            />
            <InfoRow label="Dirección" value={business.addressText} />
            <InfoRow label="C.P." value={business.postalCode} />
            {business.latitude && business.longitude && (
              <InfoRow
                label="Coordenadas"
                value={
                  <a
                    href={`https://www.google.com/maps?q=${business.latitude},${business.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {business.latitude.toFixed(6)}, {business.longitude.toFixed(6)}
                  </a>
                }
              />
            )}
            {business.googleMapsUrl && (
              <InfoRow
                label="Google Maps"
                value={
                  <a
                    href={business.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Abrir en Google Maps
                  </a>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {business.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imágenes ({business.images.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {business.images
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((img) => (
                  <div key={img.id} className="group relative aspect-video overflow-hidden rounded-lg border">
                    <Image src={img.imageUrl} alt="" fill className="object-cover transition-transform group-hover:scale-105" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Membresía</CardTitle>
          </CardHeader>
          <CardContent>
            {business.memberships.length > 0 ? (
              business.memberships.map((m) => (
                <div key={m.id} className="space-y-2">
                  <InfoRow label="Plan" value={m.plan?.name || "—"} />
                  <InfoRow
                    label="Estado"
                    value={
                      <Badge variant={m.status === "ACTIVE" ? "default" : "secondary"}>
                        {m.status}
                      </Badge>
                    }
                  />
                  {m.currentPeriodStart && (
                    <InfoRow
                      label="Inicio"
                      value={new Date(m.currentPeriodStart).toLocaleDateString("es-MX")}
                    />
                  )}
                  {m.currentPeriodEnd && (
                    <InfoRow
                      label="Vencimiento"
                      value={new Date(m.currentPeriodEnd).toLocaleDateString("es-MX")}
                    />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sin membresía activa</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Vistas</p>
                <p className="text-2xl font-bold">{business.analytics.views}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="text-2xl font-bold">{business.analytics.whatsappClicks}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Llamadas</p>
                <p className="text-2xl font-bold">{business.analytics.phoneClicks}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Web</p>
                <p className="text-2xl font-bold">{business.analytics.websiteClicks}</p>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reseñas</span>
                <span className="font-medium">{business._count.reviews}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reportes</span>
                <span className="font-medium">{business._count.reports}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Leads</span>
                <span className="font-medium">{business._count.leads}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de actividad</CardTitle>
        </CardHeader>
        <CardContent>
          {(business.auditLogs?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Sin registro de actividad</p>
          ) : (
            <div className="space-y-3">
              {business.auditLogs?.map((log) => (
                <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                  <Activity className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-xs text-muted-foreground">
                        por {log.actor.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(new Date(log.createdAt))}
                      </span>
                    </div>
                    {(log.oldValue || log.newValue) && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                          Ver cambios
                        </summary>
                        <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
                          {log.oldValue && (
                            <>
                              <span className="font-medium text-red-500">Anterior:</span>{" "}
                              {JSON.stringify(JSON.parse(log.oldValue), null, 2)}
                              {"\n"}
                            </>
                          )}
                          {log.newValue && (
                            <>
                              <span className="font-medium text-green-500">Nuevo:</span>{" "}
                              {JSON.stringify(JSON.parse(log.newValue), null, 2)}
                            </>
                          )}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
