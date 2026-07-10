"use client"

import { useCallback, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  ShoppingBag, CheckCircle, XCircle, EyeOff, Trash2, AlertTriangle,
  Filter, Search, Eye, MoreHorizontal, Star,
} from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { confirmDialog } from "@/components/ui/system-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatCurrency, timeAgo } from "@/lib/utils"

type ListingUser = { id: string; name: string; email: string; image: string | null }
type ListingCategory = { id: string; name: string; slug: string }
type ListingImage = { id: string; url: string }

type ListingRow = {
  id: string
  title: string
  slug: string
  description: string | null
  price: number | null
  type: string
  status: string
  views: number
  whatsappClicks: number
  phoneClicks: number
  favoriteCount: number
  isBoosted: boolean
  isSpam: boolean
  createdAt: string
  deletedAt: string | null
  user: ListingUser
  category: ListingCategory | null
  images: ListingImage[]
}

type Stats = { total: number; active: number; pending: number; hidden: number; deleted: number }
type Pagination = { page: number; limit: number; total: number; totalPages: number }

const TYPE_TABS = [
  { value: "todos", label: "Todos" },
  { value: "productos", label: "Productos" },
  { value: "servicios", label: "Servicios" },
  { value: "solicitudes", label: "Solicitudes" },
  { value: "eventos", label: "Eventos" },
  { value: "comunidad", label: "Comunidad" },
]

const TYPE_LABELS: Record<string, string> = {
  SALE: "Venta",
  PURCHASE: "Compra",
  TRADE: "Intercambio",
  SERVICE: "Servicio",
  REQUEST: "Solicitud",
  EVENT: "Evento",
  PROMOTION: "Promoción",
}

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "pendientes", label: "Pendientes" },
  { value: "ocultos", label: "Ocultos" },
  { value: "suspendidos", label: "Suspendidos" },
  { value: "eliminados", label: "Eliminados" },
]

const STATUS_BADGE: Record<string, { variant: string; label: string }> = {
  PENDING: { variant: "outline", label: "Pendiente" },
  ACTIVE: { variant: "default", label: "Activo" },
  SOLD: { variant: "secondary", label: "Vendido" },
  RESERVED: { variant: "outline", label: "Reservado" },
  EXPIRED: { variant: "ghost", label: "Expirado" },
  HIDDEN: { variant: "destructive", label: "Oculto" },
  DELETED: { variant: "destructive", label: "Eliminado" },
}

export function MarketplaceListClient({
  listings,
  stats,
  pagination,
  currentTipo,
  currentStatus,
  currentSearch,
}: {
  listings: ListingRow[]
  stats: Stats
  pagination: Pagination
  currentTipo: string
  currentStatus: string
  currentSearch: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(currentSearch)

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

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      const qs = createQueryString({ search: value || undefined, page: "1" })
      router.push(`/admin/marketplace?${qs}`)
    },
    [createQueryString, router]
  )

  const handleTipoFilter = useCallback(
    (tipo: string) => {
      const qs = createQueryString({ tipo: tipo === "todos" ? undefined : tipo, page: "1" })
      router.push(`/admin/marketplace?${qs}`)
    },
    [createQueryString, router]
  )

  const handleStatusFilter = useCallback(
    (value: string | null) => {
      const nextValue = value ?? ""
      const qs = createQueryString({ status: nextValue === "todos" ? undefined : nextValue, page: "1" })
      router.push(`/admin/marketplace?${qs}`)
    },
    [createQueryString, router]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      const qs = createQueryString({ page: String(page) })
      router.push(`/admin/marketplace?${qs}`)
    },
    [createQueryString, router]
  )

  const handleAction = async (listingId: string, action: string) => {
    try {
      const res = await fetch("/api/admin/marketplace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listingId, action }),
      })
      if (!res.ok) throw new Error("Error")
      router.refresh()
    } catch {
      console.error("Action failed")
    }
  }

  const handleDelete = async (listingId: string) => {
    if (!(await confirmDialog({
      title: "Eliminar publicación",
      description: "¿Estás seguro de eliminar esta publicación?",
      destructive: true,
    }))) return
    await handleAction(listingId, "DELETE")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Moderación de publicaciones</p>
        </div>
        <ShoppingBag className="h-8 w-8 text-pink-600" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ocultos</CardTitle>
            <EyeOff className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.hidden}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eliminados</CardTitle>
            <Trash2 className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.deleted}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTipoFilter(tab.value)}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              currentTipo === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(searchValue)
            }}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={currentStatus} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-center">Vistas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No se encontraron publicaciones
                </TableCell>
              </TableRow>
            ) : (
              listings.map((listing) => {
                const statusInfo = STATUS_BADGE[listing.status] || { variant: "ghost", label: listing.status }
                return (
                  <TableRow key={listing.id} className={listing.status === "DELETED" ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {listing.images[0] ? (
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                            <Image src={listing.images[0].url} alt="" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                            <ShoppingBag className="size-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[180px] font-medium">
                              {listing.title}
                            </span>
                            {listing.isBoosted && (
                              <Star className="size-3 fill-yellow-400 text-yellow-400 shrink-0" />
                            )}
                            {listing.isSpam && (
                              <AlertTriangle className="size-3 text-red-500 shrink-0" />
                            )}
                          </div>
                          {listing.isSpam && (
                            <span className="text-[10px] font-medium text-red-500 uppercase tracking-wider">
                              Posible spam
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{listing.category?.name || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{listing.user.name || "—"}</span>
                        <span className="text-xs text-muted-foreground">{listing.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {listing.price != null ? (
                        <span className="font-medium">{formatCurrency(listing.price)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{TYPE_LABELS[listing.type] || listing.type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">{listing.views}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(statusInfo.variant as any)}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {timeAgo(new Date(listing.createdAt))}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => window.open(`/marketplace/${listing.category?.slug || "sin-categoria"}/${listing.slug}`, "_blank")}>
                            <Eye className="h-4 w-4" />
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {listing.status !== "ACTIVE" && (
                            <DropdownMenuItem onClick={() => handleAction(listing.id, "APPROVE")}>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Aprobar
                            </DropdownMenuItem>
                          )}
                          {listing.status !== "HIDDEN" && listing.status !== "DELETED" && (
                            <DropdownMenuItem variant="destructive" onClick={() => handleAction(listing.id, "REJECT")}>
                              <XCircle className="h-4 w-4" />
                              Rechazar
                            </DropdownMenuItem>
                          )}
                          {listing.status !== "HIDDEN" && listing.status !== "DELETED" && (
                            <DropdownMenuItem onClick={() => handleAction(listing.id, "HIDE")}>
                              <EyeOff className="h-4 w-4" />
                              Ocultar
                            </DropdownMenuItem>
                          )}
                          {listing.status !== "HIDDEN" && listing.status !== "DELETED" && (
                            <DropdownMenuItem variant="destructive" onClick={() => handleAction(listing.id, "SUSPEND")}>
                              <AlertTriangle className="h-4 w-4" />
                              Suspender
                            </DropdownMenuItem>
                          )}
                          {listing.status === "HIDDEN" && (
                            <DropdownMenuItem onClick={() => handleAction(listing.id, "ACTIVATE")}>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Activar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(listing.id)}>
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
            {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
