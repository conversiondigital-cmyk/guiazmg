"use client"

import { useCallback, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  Megaphone, CheckCircle, XCircle, EyeOff, Trash2, AlertTriangle,
  Filter, Search, Eye, MoreHorizontal, Star, Calendar,
} from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { formatCurrency } from "@/lib/utils"

type ListingBusiness = { id: string; name: string; slug: string }
type ListingCategory = { id: string; name: string }
type ListingSubcategory = { id: string; name: string }
type ListingImage = { id: string; imageUrl: string }
type ListingBoost = { id: string; endsAt: string | null }
type ListingCount = { leads: number }

type ListingRow = {
  id: string
  title: string
  slug: string
  description: string | null
  price: number | null
  status: string
  startsAt: string | null
  endsAt: string | null
  visibilityScore: number
  createdAt: string
  deletedAt: string | null
  profile: ListingBusiness
  category: ListingCategory | null
  subcategory: ListingSubcategory | null
  images: ListingImage[]
  boosts: ListingBoost[]
  _count: ListingCount
}

type Stats = { total: number; active: number; pending: number; expired: number }
type Pagination = { page: number; limit: number; total: number; totalPages: number }

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "pendientes", label: "Pendientes" },
  { value: "pausados", label: "Pausados" },
  { value: "archivados", label: "Archivados" },
]

const STATUS_BADGE: Record<string, { variant: string; label: string }> = {
  ACTIVE: { variant: "default", label: "Activo" },
  PENDING_REVIEW: { variant: "outline", label: "Pendiente" },
  DRAFT: { variant: "ghost", label: "Borrador" },
  EXPIRED: { variant: "secondary", label: "Vencido" },
  ARCHIVED: { variant: "ghost", label: "Archivado" },
}

function formatVigencia(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt && !endsAt) return "—"
  if (!startsAt && endsAt) return `Hasta ${new Date(endsAt).toLocaleDateString("es-MX")}`
  if (startsAt && !endsAt) return `Desde ${new Date(startsAt).toLocaleDateString("es-MX")}`
  return `${new Date(startsAt!).toLocaleDateString("es-MX")} - ${new Date(endsAt!).toLocaleDateString("es-MX")}`
}

export function ListingsListClient({
  listings,
  stats,
  pagination,
  currentStatus,
  currentSearch,
}: {
  listings: ListingRow[]
  stats: Stats
  pagination: Pagination
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
      router.push(`/admin/anuncios?${qs}`)
    },
    [createQueryString, router]
  )

  const handleStatusFilter = useCallback(
    (value: string | null) => {
      const nextValue = value ?? ""
      const qs = createQueryString({ status: nextValue === "todos" ? undefined : nextValue, page: "1" })
      router.push(`/admin/anuncios?${qs}`)
    },
    [createQueryString, router]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      const qs = createQueryString({ page: String(page) })
      router.push(`/admin/anuncios?${qs}`)
    },
    [createQueryString, router]
  )

  const handleAction = async (listingId: string, action: string) => {
    try {
      const res = await fetch("/api/admin/listings", {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anuncios</h1>
          <p className="text-sm text-muted-foreground">Moderación de anuncios de negocios</p>
        </div>
        <Megaphone className="h-8 w-8 text-purple-600" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o negocio..."
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
          <Select
            value={currentStatus}
            onValueChange={handleStatusFilter}
            items={Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]))}
          >
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
              <TableHead className="w-[250px]">Título</TableHead>
              <TableHead>Negocio</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="text-center">Leads</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No se encontraron anuncios
                </TableCell>
              </TableRow>
            ) : (
              listings.map((listing) => {
                const statusInfo = STATUS_BADGE[listing.status] || { variant: "ghost", label: listing.status }
                const isBoosted = listing.boosts.length > 0
                return (
                  <TableRow key={listing.id} className={listing.status === "ARCHIVED" ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {listing.images[0] ? (
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                            <Image src={listing.images[0].imageUrl} alt="" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                            <Megaphone className="size-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[160px] font-medium">
                              {listing.title}
                            </span>
                            {isBoosted && (
                              <Star className="size-3 fill-yellow-400 text-yellow-400 shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{listing.profile.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{listing.category?.name || "—"}</span>
                    </TableCell>
                    <TableCell>
                      {listing.price != null ? (
                        <span className="font-medium">{formatCurrency(listing.price)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">{listing._count.leads}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(statusInfo.variant as any)}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                      {formatVigencia(listing.startsAt, listing.endsAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {listing.status === "ACTIVE" && (
                            <DropdownMenuItem onClick={() => window.open(`/perfil/${listing.profile.slug}`, "_blank")}>
                              <Eye className="h-4 w-4" />
                              Ver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/anuncios`)}>
                            <Eye className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {listing.status !== "ACTIVE" && (
                            <DropdownMenuItem onClick={() => handleAction(listing.id, "APPROVE")}>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Aprobar
                            </DropdownMenuItem>
                          )}
                          {listing.status !== "ARCHIVED" && (
                            <DropdownMenuItem variant="destructive" onClick={() => handleAction(listing.id, "REJECT")}>
                              <XCircle className="h-4 w-4" />
                              Rechazar
                            </DropdownMenuItem>
                          )}
                          {listing.status === "ACTIVE" && (
                            <DropdownMenuItem onClick={() => handleAction(listing.id, "PAUSE")}>
                              <EyeOff className="h-4 w-4" />
                              Pausar
                            </DropdownMenuItem>
                          )}
                          {listing.status !== "ARCHIVED" && listing.status !== "DELETED" && (
                            <DropdownMenuItem variant="destructive" onClick={() => handleAction(listing.id, "ARCHIVE")}>
                              <Trash2 className="h-4 w-4" />
                              Archivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleAction(listing.id, "FEATURE")}>
                            <Star className="h-4 w-4" />
                            Destacar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(listing.id, "DELETE")}>
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
