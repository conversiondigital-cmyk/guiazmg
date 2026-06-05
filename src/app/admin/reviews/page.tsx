export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import {
  Star,
  CheckCircle,
  EyeOff,
  Trash2,
  Reply,
  Search,
  MoreHorizontal,
  AlertTriangle,
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
  DropdownMenuSeparator,
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
import { ReviewStatus } from "@/generated/prisma/enums"

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

const OFFENSIVE_KEYWORDS = [
  "spam", "fake", "scam", "estafa", "fraude", "basura", "horrible",
  "pésimo", "terrible", "ofensivo", "grosero",
]

function hasOffensiveContent(text: string | null | undefined): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return OFFENSIVE_KEYWORDS.some((kw) => lower.includes(kw))
}

export default async function AdminReviewsPage({
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
      { comment: { contains: currentQ, mode: "insensitive" } },
      { title: { contains: currentQ, mode: "insensitive" } },
      { user: { name: { contains: currentQ, mode: "insensitive" } } },
      { business: { name: { contains: currentQ, mode: "insensitive" } } },
    ]
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        business: { select: { id: true, name: true, slug: true } },
        response: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ])

  const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
    prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
    prisma.review.count({ where: { status: ReviewStatus.APPROVED } }),
    prisma.review.count({ where: { status: ReviewStatus.REJECTED } }),
    prisma.review.count(),
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
    return `/admin/reviews${qs ? `?${qs}` : ""}`
  }

  async function handleAction(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    const action = formData.get("action") as string
    if (!id || !action) return

    if (action === "DELETE") {
      await prisma.review.delete({ where: { id } })
    } else if (Object.values(ReviewStatus).includes(action as ReviewStatus)) {
      await prisma.review.update({ where: { id }, data: { status: action as ReviewStatus } })
    }
  }

  const filterTabs = ["ALL", "PENDING", "APPROVED", "REJECTED"]

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Reseñas</h1>
          <p className="text-sm text-muted-foreground">Modera las reseñas de la plataforma</p>
        </div>
        <Star className="size-8 text-yellow-500" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pendientes", count: pendingCount, color: "text-yellow-600" },
          { label: "Aprobadas", count: approvedCount, color: "text-green-600" },
          { label: "Rechazadas", count: rejectedCount, color: "text-red-600" },
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
                ? "bg-yellow-500 text-white"
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
            <Input name="q" placeholder="Buscar reseñas..." defaultValue={currentQ} className="pl-8" />
          </form>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comentario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No se encontraron reseñas
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => {
                  const flagged = hasOffensiveContent(review.comment) || hasOffensiveContent(review.title)
                  return (
                    <TableRow key={review.id} className={flagged ? "bg-red-50 dark:bg-red-950/10" : ""}>
                      <TableCell>
                        <Link
                          href={`/perfil/${review.business.slug}`}
                          className="font-medium hover:underline"
                        >
                          {review.business.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{review.user.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{review.user.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3.5 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-muted-foreground">{review.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {flagged && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 mb-1">
                            <AlertTriangle className="size-3" />
                            Posible abuso
                          </span>
                        )}
                        <div className="text-sm">
                          {review.title && <span className="font-medium">{review.title}. </span>}
                          {review.comment ? (
                            <span className="text-muted-foreground line-clamp-2">{review.comment}</span>
                          ) : (
                            <span className="text-muted-foreground italic">Sin comentario</span>
                          )}
                        </div>
                        {review.response && (
                          <div className="mt-1 flex items-start gap-1 rounded-md bg-blue-50 p-1.5 text-xs text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
                            <Reply className="mt-0.5 size-3 shrink-0" />
                            <span className="line-clamp-1">{review.response.response}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[review.status] ?? ""}>
                          {STATUS_LABELS[review.status] ?? review.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {review.createdAt.toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={handleAction}>
                          <input type="hidden" name="id" value={review.id} />
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {review.status !== ReviewStatus.APPROVED && (
                                <DropdownMenuItem>
                                  <button
                                    type="submit"
                                    name="action"
                                    value={ReviewStatus.APPROVED}
                                    className="flex items-center gap-2 w-full text-left"
                                  >
                                    <CheckCircle className="size-4 text-green-600" />
                                    Aprobar
                                  </button>
                                </DropdownMenuItem>
                              )}
                              {review.status !== ReviewStatus.REJECTED && (
                                <DropdownMenuItem>
                                  <button
                                    type="submit"
                                    name="action"
                                    value={ReviewStatus.REJECTED}
                                    className="flex items-center gap-2 w-full text-left"
                                  >
                                    <EyeOff className="size-4 text-yellow-600" />
                                    Ocultar
                                  </button>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive">
                                <button
                                  type="submit"
                                  name="action"
                                  value="DELETE"
                                  className="flex items-center gap-2 w-full text-left"
                                >
                                  <Trash2 className="size-4" />
                                  Eliminar
                                </button>
                              </DropdownMenuItem>
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
          <span>Página {currentPage} de {totalPages} ({total} reseñas)</span>
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
