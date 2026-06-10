export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CheckCircle, XCircle, Clock, MoreHorizontal, Search } from "@/lib/icons"
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
  PENDING: "Pendientes",
  APPROVED: "Aprobadas",
  REJECTED: "Rechazadas",
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
}

export default async function AdminReclamosPage({
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
      { businessName: { contains: currentQ, mode: "insensitive" } },
      { user: { name: { contains: currentQ, mode: "insensitive" } } },
      { user: { email: { contains: currentQ, mode: "insensitive" } } },
    ]
  }

  const [claims, total] = await Promise.all([
    prisma.profileClaimRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.profileClaimRequest.count({ where }),
  ])

  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.profileClaimRequest.count({ where: { status: "PENDING" } }),
    prisma.profileClaimRequest.count({ where: { status: "APPROVED" } }),
    prisma.profileClaimRequest.count({ where: { status: "REJECTED" } }),
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
    return `/admin/reclamos${qs ? `?${qs}` : ""}`
  }

  async function handleAction(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    const action = formData.get("action") as string
    if (!id || !action) return

    if (action === "APPROVED") {
      const claim = await prisma.profileClaimRequest.findUnique({ where: { id } })
      if (claim) {
        const business = await prisma.profile.findFirst({
          where: { name: claim.businessName, slug: claim.businessUrl ?? undefined },
        })
        if (business) {
          await prisma.profile.update({
            where: { id: business.id },
            data: { ownerId: claim.userId },
          })
        }
      }
    }

    await prisma.profileClaimRequest.update({ where: { id }, data: { status: action } })
  }

  const filterTabs = ["ALL", "PENDING", "APPROVED", "REJECTED"]

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Reclamos de Negocios</h1>
          <p className="text-sm text-muted-foreground">Gestiona las solicitudes de reclamo de negocios</p>
        </div>
        <CheckCircle className="size-8 text-orange-600" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Rechazados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
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
            <Input name="q" placeholder="Buscar reclamos..." defaultValue={currentQ} className="pl-8" />
          </form>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Negocio</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No se encontraron reclamos
                  </TableCell>
                </TableRow>
              ) : (
                claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <div className="font-medium">{claim.user.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{claim.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{claim.businessName}</div>
                      {claim.businessUrl && (
                        <div className="text-xs text-muted-foreground">/{claim.businessUrl}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {claim.message ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[claim.status] ?? ""}>
                        {STATUS_LABELS[claim.status] ?? claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {claim.createdAt.toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={handleAction}>
                        <input type="hidden" name="id" value={claim.id} />
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {claim.status !== "APPROVED" && (
                              <DropdownMenuItem>
                                <button type="submit" name="action" value="APPROVED" className="flex items-center gap-2 w-full text-left">
                                  <CheckCircle className="size-4 text-green-600" />
                                  Aprobar
                                </button>
                              </DropdownMenuItem>
                            )}
                            {claim.status !== "REJECTED" && (
                              <DropdownMenuItem>
                                <button type="submit" name="action" value="REJECTED" className="flex items-center gap-2 w-full text-left">
                                  <XCircle className="size-4 text-red-600" />
                                  Rechazar
                                </button>
                              </DropdownMenuItem>
                            )}
                            {claim.status !== "PENDING" && (
                              <DropdownMenuItem>
                                <button type="submit" name="action" value="PENDING" className="flex items-center gap-2 w-full text-left">
                                  <Clock className="size-4 text-yellow-600" />
                                  Marcar Pendiente
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
          <span>Página {currentPage} de {totalPages} ({total} reclamos)</span>
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
