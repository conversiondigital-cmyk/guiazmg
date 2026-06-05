export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import {
  Flag,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  ShoppingBag,
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
import { ReportStatus } from "@/generated/prisma/enums"

const STATUS_LABELS: Record<string, string> = {
  ALL: "Todos",
  PENDING: "Abiertos",
  INVESTIGATING: "En revisión",
  RESOLVED: "Resueltos",
  DISMISSED: "Descartados",
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-red-100 text-red-700 border-red-200",
  INVESTIGATING: "bg-blue-100 text-blue-700 border-blue-200",
  RESOLVED: "bg-green-100 text-green-700 border-green-200",
  DISMISSED: "bg-gray-100 text-gray-700 border-gray-200",
}

const TYPE_LABELS: Record<string, { label: string; icon: any }> = {
  business: { label: "Negocio", icon: Store },
  listing: { label: "Anuncio", icon: ShoppingBag },
}

export default async function AdminReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; reason?: string; q?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const params = await searchParams
  const currentStatus = params.status ?? "ALL"
  const currentReason = params.reason ?? ""
  const currentQ = params.q ?? ""
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10))
  const limit = 20

  const where: Record<string, unknown> = {}
  if (currentStatus !== "ALL") {
    where.status = currentStatus
  }
  if (currentReason) {
    where.reason = currentReason
  }
  if (currentQ) {
    where.OR = [
      { description: { contains: currentQ, mode: "insensitive" } },
      { reason: { contains: currentQ, mode: "insensitive" } },
      { user: { name: { contains: currentQ, mode: "insensitive" } } },
      { business: { name: { contains: currentQ, mode: "insensitive" } } },
    ]
  }

  const [reports, total, allReasons] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        business: { select: { id: true, name: true, slug: true } },
        listing: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where }),
    prisma.report.findMany({ distinct: ["reason"], select: { reason: true } }),
  ])

  const [pendingCount, investigatingCount, resolvedCount, dismissedCount, totalCount] = await Promise.all([
    prisma.report.count({ where: { status: ReportStatus.PENDING } }),
    prisma.report.count({ where: { status: ReportStatus.INVESTIGATING } }),
    prisma.report.count({ where: { status: ReportStatus.RESOLVED } }),
    prisma.report.count({ where: { status: ReportStatus.DISMISSED } }),
    prisma.report.count(),
  ])

  const totalPages = Math.ceil(total / limit)
  const reasons = allReasons.map((r) => r.reason)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    const s = overrides.status !== undefined ? overrides.status : currentStatus
    const r = overrides.reason !== undefined ? overrides.reason : currentReason
    const q = overrides.q !== undefined ? overrides.q : currentQ
    const p = overrides.page !== undefined ? overrides.page : "1"
    if (s && s !== "ALL") sp.set("status", s)
    if (r) sp.set("reason", r)
    if (q) sp.set("q", q)
    if (p !== "1") sp.set("page", p)
    const qs = sp.toString()
    return `/admin/reportes${qs ? `?${qs}` : ""}`
  }

  async function handleAction(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    const action = formData.get("action") as string
    if (!id || !action) return
    if (Object.values(ReportStatus).includes(action as ReportStatus)) {
      await prisma.report.update({ where: { id }, data: { status: action as ReportStatus } })
    }
  }

  const filterTabs = ["ALL", "PENDING", "INVESTIGATING", "RESOLVED", "DISMISSED"]

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">Administra los reportes de la comunidad</p>
        </div>
        <Flag className="size-8 text-red-500" />
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Abiertos", count: pendingCount, color: "text-red-600" },
          { label: "En revisión", count: investigatingCount, color: "text-blue-600" },
          { label: "Resueltos", count: resolvedCount, color: "text-green-600" },
          { label: "Descartados", count: dismissedCount, color: "text-gray-600" },
          { label: "Total", count: totalCount, color: "text-foreground" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((s) => (
          <Link
            key={s}
            href={buildUrl({ status: s === "ALL" ? "" : s })}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              currentStatus === s
                ? "bg-red-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <form action={buildUrl({ q: undefined, page: "1" })} method="GET">
            <Input name="q" placeholder="Buscar reportes..." defaultValue={currentQ} className="pl-8" />
          </form>
        </div>
        {reasons.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <form method="GET" action="/admin/reportes">
              {currentStatus !== "ALL" && <input type="hidden" name="status" value={currentStatus} />}
              {currentQ && <input type="hidden" name="q" value={currentQ} />}
              <select
                name="reason"
                defaultValue={currentReason}
                onChange={(e) => e.target.form?.requestSubmit()}
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                <option value="">Todos los motivos</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </form>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reportante</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No se encontraron reportes
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => {
                  const type = report.business ? "business" : report.listing ? "listing" : null
                  const TypeIcon = type ? TYPE_LABELS[type]?.icon : null
                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="font-medium">{report.user.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{report.user.email}</div>
                      </TableCell>
                      <TableCell>
                        {type ? (
                          <Badge variant="outline" className="gap-1">
                            {TypeIcon && <TypeIcon className="size-3" />}
                            {TYPE_LABELS[type].label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {report.business && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            <Link href={`/perfil/${report.business.slug}`} className="hover:underline">
                              {report.business.name}
                            </Link>
                          </div>
                        )}
                        {report.listing && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {report.listing.title}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{report.reason}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {report.description ? (
                          <span className="text-sm text-muted-foreground line-clamp-2">
                            {report.description}
                          </span>
                        ) : (
                          <span className="text-sm italic text-muted-foreground">Sin descripción</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[report.status] ?? ""}>
                          {STATUS_LABELS[report.status] ?? report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {report.createdAt.toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={handleAction}>
                          <input type="hidden" name="id" value={report.id} />
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {report.status !== ReportStatus.INVESTIGATING && (
                                <DropdownMenuItem>
                                  <button
                                    type="submit"
                                    name="action"
                                    value={ReportStatus.INVESTIGATING}
                                    className="flex items-center gap-2 w-full text-left"
                                  >
                                    <Clock className="size-4 text-blue-600" />
                                    Marcar en revisión
                                  </button>
                                </DropdownMenuItem>
                              )}
                              {report.status !== ReportStatus.RESOLVED && (
                                <DropdownMenuItem>
                                  <button
                                    type="submit"
                                    name="action"
                                    value={ReportStatus.RESOLVED}
                                    className="flex items-center gap-2 w-full text-left"
                                  >
                                    <CheckCircle className="size-4 text-green-600" />
                                    Resolver
                                  </button>
                                </DropdownMenuItem>
                              )}
                              {report.status !== ReportStatus.DISMISSED && (
                                <DropdownMenuItem>
                                  <button
                                    type="submit"
                                    name="action"
                                    value={ReportStatus.DISMISSED}
                                    className="flex items-center gap-2 w-full text-left"
                                  >
                                    <XCircle className="size-4 text-gray-600" />
                                    Descartar
                                  </button>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </form>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {currentPage} de {totalPages} ({total} reportes)</span>
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
