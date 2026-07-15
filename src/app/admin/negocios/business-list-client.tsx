"use client"

import { useCallback, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { confirmDialog } from "@/components/ui/system-dialog"
import { toast } from "sonner"
import {
  Store,
  Eye,
  Edit3,
  Trash2,
  Shield,
  MoreHorizontal,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Star,
  Activity,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { timeAgo } from "@/lib/utils"

type BusinessUser = { id: string; name: string; email: string; image: string | null }
type BusinessCategory = { id: string; name: string }
type BusinessMunicipality = { id: string; name: string }
type MembershipPlan = { id: string; name: string }
type Membership = { id: string; plan: MembershipPlan; status: string; currentPeriodEnd: Date | null }
type BusinessCount = { reviews: number; images: number }

type BusinessRow = {
  id: string
  name: string
  slug: string
  phone: string | null
  email: string | null
  status: string
  profileType: string
  verificationStatus: string
  isVerified: boolean
  isFeatured: boolean
  isPremium: boolean
  isFounder: boolean
  isBoosted: boolean
  createdAt: Date
  owner: BusinessUser
  category: BusinessCategory | null
  municipality: BusinessMunicipality | null
  memberships: Membership[]
  _count: BusinessCount
}

type Stats = { total: number; pending: number; active: number; suspended: number; emprendedor: number; negocio: number }
type Pagination = { page: number; limit: number; total: number; totalPages: number }

export function BusinessListClient({
  businesses,
  stats,
  pagination,
}: {
  businesses: BusinessRow[]
  stats: Stats
  pagination: Pagination
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")
  const statusValue = searchParams.get("status") || "ALL"
  const tipoValue = searchParams.get("tipo") || "ALL"

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
      router.push(`/admin/negocios?${qs}`)
    },
    [createQueryString, router]
  )

  const handleStatusFilter = useCallback(
    (value: string | null) => {
      const nextValue = value ?? ""
      const qs = createQueryString({ status: nextValue === "ALL" ? undefined : nextValue, page: "1" })
      router.push(`/admin/negocios?${qs}`)
    },
    [createQueryString, router]
  )

  const handleTipoFilter = useCallback(
    (value: string | null) => {
      const nextValue = value ?? ""
      const qs = createQueryString({ tipo: nextValue === "ALL" ? undefined : nextValue, page: "1" })
      router.push(`/admin/negocios?${qs}`)
    },
    [createQueryString, router]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      const qs = createQueryString({ page: String(page) })
      router.push(`/admin/negocios?${qs}`)
    },
    [createQueryString, router]
  )

  const handleAction = async (businessId: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error("Error")
      toast.success("Negocio actualizado")
      router.refresh()
    } catch {
      toast.error("No se pudo completar la acción")
    }
  }

  const handleDelete = async (businessId: string) => {
    if (!(await confirmDialog({
      title: "Eliminar negocio",
      description: "¿Estás seguro de eliminar este negocio?",
      destructive: true,
    }))) return
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ARCHIVE" }),
      })
      if (!res.ok) throw new Error("Error")
      toast.success("Negocio eliminado")
      router.refresh()
    } catch {
      toast.error("No se pudo eliminar")
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

  const tipoBadge = (t: string) =>
    t === "EMPRENDEDOR" ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Emprendedor</Badge>
    ) : (
      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Negocio</Badge>
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Negocios</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
            <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, dueño..."
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
            value={tipoValue}
            onValueChange={handleTipoFilter}
            items={{
              ALL: `Tipo: todos (${stats.emprendedor + stats.negocio})`,
              EMPRENDEDOR: `Emprendedores (${stats.emprendedor})`,
              NEGOCIO: `Negocios (${stats.negocio})`,
            }}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tipo: todos</SelectItem>
              <SelectItem value="EMPRENDEDOR">Emprendedores</SelectItem>
              <SelectItem value="NEGOCIO">Negocios</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusValue}
            onValueChange={handleStatusFilter}
            items={{
              ALL: "Todos",
              PENDING_REVIEW: "Pendientes",
              ACTIVE: "Activos",
              SUSPENDED: "Suspendidos",
              REJECTED: "Rechazados",
              ARCHIVED: "Archivados",
              DRAFT: "Borradores",
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="PENDING_REVIEW">Pendientes</SelectItem>
              <SelectItem value="ACTIVE">Activos</SelectItem>
              <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
              <SelectItem value="REJECTED">Rechazados</SelectItem>
              <SelectItem value="ARCHIVED">Archivados</SelectItem>
              <SelectItem value="DRAFT">Borradores</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negocio</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Dueño</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Municipio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Membresía</TableHead>
              <TableHead>Verificado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  No se encontraron negocios
                </TableCell>
              </TableRow>
            ) : (
              businesses.map((biz) => (
                <TableRow key={biz.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[180px]">{biz.name}</span>
                      {biz.isFeatured && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      {tipoBadge(biz.profileType)}
                      {biz.isFounder && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Fundador</Badge>
                      )}
                      {biz.isBoosted && (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Boost</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{biz.owner.name}</span>
                      <span className="text-xs text-muted-foreground">{biz.owner.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{biz.category?.name || "—"}</TableCell>
                  <TableCell>{biz.municipality?.name || "—"}</TableCell>
                  <TableCell>{statusBadge(biz.status)}</TableCell>
                  <TableCell>
                    {biz.memberships[0] ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{biz.memberships[0].plan.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {biz.memberships[0].status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin membresía</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {biz.isVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {timeAgo(new Date(biz.createdAt))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/negocios/${biz.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/negocios/${biz.id}?edit=true`)}
                        >
                          <Edit3 className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {biz.status !== "ACTIVE" && (
                          <DropdownMenuItem onClick={() => handleAction(biz.id, "APPROVE")}>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Aprobar
                          </DropdownMenuItem>
                        )}
                        {biz.status !== "REJECTED" && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleAction(biz.id, "REJECT")}
                          >
                            <XCircle className="h-4 w-4" />
                            Rechazar
                          </DropdownMenuItem>
                        )}
                        {biz.status !== "SUSPENDED" && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleAction(biz.id, "SUSPEND")}
                          >
                            <Shield className="h-4 w-4" />
                            Suspender
                          </DropdownMenuItem>
                        )}
                        {biz.status === "SUSPENDED" && (
                          <DropdownMenuItem onClick={() => handleAction(biz.id, "ACTIVATE")}>
                            <Activity className="h-4 w-4" />
                            Activar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleAction(
                              biz.id,
                              biz.isVerified ? "UNVERIFY" : "VERIFY"
                            )
                          }
                        >
                          <CheckCircle className="h-4 w-4" />
                          {biz.isVerified ? "Quitar verificación" : "Verificar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(biz.id, "FOUNDER")}>
                          <Star className="h-4 w-4 text-amber-500" />
                          {biz.isFounder ? "Quitar fundador" : "Marcar como fundador"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(biz.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
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
