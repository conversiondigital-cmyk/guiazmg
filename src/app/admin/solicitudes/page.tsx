export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  EyeOff,
  Search,
  MoreHorizontal,
  Clock,
} from "@/lib/icons"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_LABELS: Record<string, string> = {
  ALL: "Todas",
  ACTIVE: "Activas",
  CLOSED: "Cerradas",
  APPROVED: "Aprobadas",
  REJECTED: "Rechazadas",
  HIDDEN: "Ocultas",
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
  APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  HIDDEN: "bg-yellow-100 text-yellow-700 border-yellow-200",
}

export default async function AdminSolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const params = await searchParams
  const currentStatus = params.status ?? "ALL"
  const currentQ = params.q ?? ""
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10))
  const limit = 20

  const where: Record<string, unknown> = {}
  if (currentStatus !== "ALL") {
    where.status = currentStatus
  }
  if (currentQ) {
    where.OR = [
      { title: { contains: currentQ, mode: "insensitive" } },
      { description: { contains: currentQ, mode: "insensitive" } },
      { user: { name: { contains: currentQ, mode: "insensitive" } } },
    ]
  }

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        category: { select: { id: true, name: true } },
        municipality: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.serviceRequest.count({ where }),
  ])

  const [activeCount, closedCount, totalCount] = await Promise.all([
    prisma.serviceRequest.count({ where: { status: "ACTIVE" } }),
    prisma.serviceRequest.count({ where: { status: "CLOSED" } }),
    prisma.serviceRequest.count(),
  ])

  const totalPages = Math.ceil(total / limit)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    const s = overrides.status !== undefined ? overrides.status : currentStatus
    const q = overrides.q !== undefined ? overrides.q : currentQ
    const p = overrides.page !== undefined ? overrides.page : "1"
    if (s && s !== "ALL") sp.set("status", s)
    if (q) sp.set("q", q)
    if (p !== "1") sp.set("page", p)
    const qs = sp.toString()
    return `/admin/solicitudes${qs ? `?${qs}` : ""}`
  }

  async function handleAction(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    const action = formData.get("action") as string
    if (!id || !action) return
    await prisma.serviceRequest.update({ where: { id }, data: { status: action } })
  }

  const filterTabs = ["ALL", "ACTIVE", "CLOSED"]

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Solicitudes</h1>
          <p className="text-sm text-muted-foreground">Modera las solicitudes de servicio</p>
        </div>
        <MessageCircle className="size-8 text-orange-600" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Cerradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{closedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((s) => (
          <Link
            key={s}
            href={buildUrl({ status: s === "ALL" ? "" : s })}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              currentStatus === s
                ? "bg-orange-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <form action={buildUrl({ q: undefined, page: "1" })} method="GET">
            <Input name="q" placeholder="Buscar solicitudes..." defaultValue={currentQ} className="pl-8" />
          </form>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Municipio</TableHead>
                <TableHead className="text-center">Respuestas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No se encontraron solicitudes
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.title}</div>
                      {req.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{req.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{req.category?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium">{req.user.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{req.user.email}</div>
                    </TableCell>
                    <TableCell>{req.municipality?.name ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm">
                        {req._count.responses > 0 ? (
                          <>
                            <MessageCircle className="size-3.5 text-blue-500" />
                            {req._count.responses}
                          </>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[req.status] ?? ""}>
                        {STATUS_LABELS[req.status] ?? req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {req.createdAt.toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={handleAction}>
                        <input type="hidden" name="id" value={req.id} />
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {req.status !== "APPROVED" && (
                              <DropdownMenuItem>
                                <button type="submit" name="action" value="APPROVED" className="flex items-center gap-2 w-full text-left">
                                  <CheckCircle className="size-4 text-green-600" />
                                  Aprobar
                                </button>
                              </DropdownMenuItem>
                            )}
                            {req.status !== "REJECTED" && (
                              <DropdownMenuItem>
                                <button type="submit" name="action" value="REJECTED" className="flex items-center gap-2 w-full text-left">
                                  <XCircle className="size-4 text-red-600" />
                                  Rechazar
                                </button>
                              </DropdownMenuItem>
                            )}
                            {req.status !== "HIDDEN" && (
                              <DropdownMenuItem>
                                <button type="submit" name="action" value="HIDDEN" className="flex items-center gap-2 w-full text-left">
                                  <EyeOff className="size-4 text-yellow-600" />
                                  Ocultar
                                </button>
                              </DropdownMenuItem>
                            )}
                            {req.status !== "ACTIVE" && (
                              <DropdownMenuItem>
                                <button type="submit" name="action" value="ACTIVE" className="flex items-center gap-2 w-full text-left">
                                  <Clock className="size-4 text-blue-600" />
                                  Reactivar
                                </button>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {currentPage} de {totalPages} ({total} solicitudes)</span>
          <div className="flex gap-1">
            {currentPage > 1 && (
              <Link href={buildUrl({ page: String(currentPage - 1) })} className="rounded-lg border px-3 py-1.5 hover:bg-muted">
                Anterior
              </Link>
            )}
            {currentPage < totalPages && (
              <Link href={buildUrl({ page: String(currentPage + 1) })} className="rounded-lg border px-3 py-1.5 hover:bg-muted">
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
