"use client"

import { useCallback, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { confirmDialog } from "@/components/ui/system-dialog"
import {
  Rocket,
  Calendar,
  Clock,
  Eye,
  MoreHorizontal,
  RotateCcw,
  XCircle,
  CheckCircle,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type BoostBusiness = { id: string; name: string; slug: string }
type BoostListing = { id: string; title: string }

type Boost = {
  id: string
  profile: BoostBusiness
  listing: BoostListing | null
  pricePaid: number
  priorityScore: number
  startsAt: string
  endsAt: string
  status: "ACTIVE" | "EXPIRED" | "CANCELLED"
  createdAt: string
}

type Stats = {
  active: number
  expired: number
  cancelled: number
  total: number
}

const statusBadge = (status: string) => {
  const variants: Record<string, string> = {
    ACTIVE: "default",
    EXPIRED: "secondary",
    CANCELLED: "destructive",
  }
  const labels: Record<string, string> = {
    ACTIVE: "Activo",
    EXPIRED: "Expirado",
    CANCELLED: "Cancelado",
  }
  return <Badge variant={(variants[status] || "ghost") as any}>{labels[status] || status}</Badge>
}

export function BoostsClient({ boosts, stats }: { boosts: Boost[]; stats: Stats }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [extendOpen, setExtendOpen] = useState(false)
  const [extending, setExtending] = useState<Boost | null>(null)
  const [extendDays, setExtendDays] = useState(7)
  const [saving, setSaving] = useState(false)

  const filter = searchParams.get("status") || "ALL"

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

  const setFilter = (value: string) => {
    const qs = createQueryString({ status: value === "ALL" ? undefined : value })
    router.push(`/admin/boosts?${qs}`)
  }

  const filteredBoosts = filter === "ALL" ? boosts : boosts.filter((b) => b.status === filter)

  const now = new Date()
  const scheduledCount = boosts.filter(
    (b) => b.status === "ACTIVE" && new Date(b.startsAt) > now
  ).length

  const handleCancel = async (boost: Boost) => {
    if (!(await confirmDialog({
      title: "Cancelar boost",
      description: "¿Cancelar este boost?",
      confirmText: "Cancelar boost",
      cancelText: "No",
      destructive: true,
    }))) return
    try {
      await fetch("/api/admin/boosts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: boost.id, action: "cancel" }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleExtend = async () => {
    if (!extending) return
    setSaving(true)
    try {
      await fetch("/api/admin/boosts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: extending.id, action: "extend", extendDays }),
      })
      setExtendOpen(false)
      setExtending(null)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const mostUsedType = boosts.filter((b) => b.status === "ACTIVE").length

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Boosts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona los boosts de visibilidad de negocios</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Programados</CardTitle>
            <Calendar className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expirados</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Boosts activos</CardTitle>
            <Rocket className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{mostUsedType}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="ALL">Todos ({stats.total})</TabsTrigger>
          <TabsTrigger value="ACTIVE">Activos ({stats.active})</TabsTrigger>
          <TabsTrigger value="EXPIRED">Expirados ({stats.expired})</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelados ({stats.cancelled})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negocio</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBoosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No se encontraron boosts
                </TableCell>
              </TableRow>
            ) : (
              filteredBoosts.map((boost) => (
                <TableRow key={boost.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Rocket className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate max-w-[180px]">{boost.profile.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {boost.listing ? `Listing: ${boost.listing.title}` : "General"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>{formatCurrency(boost.pricePaid)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{boost.priorityScore}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(boost.startsAt).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(boost.endsAt).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell>{statusBadge(boost.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/negocios/${boost.profile.id}`)
                          }
                        >
                          <Eye className="size-4" />
                          Ver
                        </DropdownMenuItem>
                        {boost.status === "ACTIVE" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setExtending(boost)
                                setExtendDays(7)
                                setExtendOpen(true)
                              }}
                            >
                              <RotateCcw className="size-4" />
                              Extender
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleCancel(boost)}
                            >
                              <XCircle className="size-4" />
                              Cancelar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Extender boost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Extender boost de <strong>{extending?.profile.name}</strong>
            </p>
            <div className="space-y-1.5">
              <Label>Días adicionales</Label>
              <Input
                type="number"
                min={1}
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
              />
            </div>
            {extending && (
              <p className="text-xs text-muted-foreground">
                Termina actualmente: {new Date(extending.endsAt).toLocaleDateString("es-MX")}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleExtend} disabled={saving}>
              {saving ? "Guardando..." : "Extender"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
