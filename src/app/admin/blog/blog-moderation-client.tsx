"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle, XCircle, Archive, Star, StarOff,
  Eye, Edit2, ChevronLeft, ChevronRight,
  Loader2, MoreVertical, Globe, Clock, FileText,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface Post {
  id: string
  title: string
  slug: string
  status: string
  category: string | null
  isFeatured: boolean
  viewCount: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  readTimeMinutes: number
  author: { id: string; name: string | null; email: string; image: string | null }
  reviewedBy: { id: string; name: string | null } | null
  rejectionReason: string | null
}

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PUBLISHED:      { label: "Publicado",  cls: "bg-green-100 text-green-800",  icon: Globe },
  PENDING_REVIEW: { label: "En revisión",cls: "bg-amber-100 text-amber-700",  icon: Clock },
  DRAFT:          { label: "Borrador",   cls: "bg-gray-100  text-gray-600",   icon: FileText },
  REJECTED:       { label: "Rechazado",  cls: "bg-red-100   text-red-700",    icon: XCircle },
  ARCHIVED:       { label: "Archivado",  cls: "bg-gray-100  text-gray-500",   icon: Archive },
}

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "2-digit" }).format(new Date(d))
}

interface Props {
  posts: Post[]
  total: number
  page: number
  limit: number
  statusFilter: string
}

export function BlogModerationClient({ posts, total, page, limit, statusFilter }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [rejectModal, setRejectModal] = useState<{ postId: string; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const totalPages = Math.ceil(total / limit)

  const moderate = async (postId: string, action: string, reason?: string) => {
    setActionLoading(postId + action)
    try {
      await fetch(`/api/blog/posts/${postId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })
      startTransition(() => router.refresh())
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectModal || !rejectReason.trim()) return
    await moderate(rejectModal.postId, "reject", rejectReason)
    setRejectModal(null)
    setRejectReason("")
  }

  return (
    <>
      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-gray-900 mb-1">Rechazar artículo</h3>
            <p className="text-sm text-gray-500 mb-4">"{rejectModal.title}"</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explica al editor el motivo del rechazo (requerido)..."
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Confirmar rechazo
              </Button>
              <Button variant="outline" onClick={() => { setRejectModal(null); setRejectReason("") }} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {posts.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No hay artículos en esta categoría</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Artículo</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden md:table-cell">Autor</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden sm:table-cell">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Vistas</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map((post) => {
                const badge = STATUS_BADGE[post.status] ?? STATUS_BADGE.DRAFT
                const BadgeIcon = badge.icon
                const isLoading = (key: string) => actionLoading === post.id + key

                return (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        {post.isFeatured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0 mt-0.5" />}
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{post.title}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">/blog/{post.slug}</p>
                          {post.category && <span className="text-[10px] text-green-700 font-medium">{post.category}</span>}
                          {post.rejectionReason && (
                            <p className="text-[10px] text-red-600 mt-0.5 line-clamp-1">✗ {post.rejectionReason}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-xs text-gray-700">{post.author.name ?? "—"}</p>
                      <p className="text-[10px] text-gray-400">{post.author.email}</p>
                    </td>

                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.cls}`}>
                        <BadgeIcon className="h-3 w-3" />
                        {badge.label}
                      </span>
                    </td>

                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Eye className="h-3 w-3" />
                        {post.viewCount.toLocaleString("es-MX")}
                      </span>
                    </td>

                    <td className="px-4 py-4 hidden lg:table-cell">
                      <p className="text-xs text-gray-400">{formatDate(post.publishedAt ?? post.createdAt)}</p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick approve (only for PENDING_REVIEW) */}
                        {post.status === "PENDING_REVIEW" && (
                          <button
                            onClick={() => moderate(post.id, "approve")}
                            disabled={!!actionLoading}
                            title="Aprobar y publicar"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-700 transition-colors"
                          >
                            {isLoading("approve") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          </button>
                        )}

                        {/* View */}
                        {post.status === "PUBLISHED" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-700 transition-colors"
                            title="Ver artículo"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        )}

                        {/* Edit */}
                        <Link
                          href={`/editor/blog/${post.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-700 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>

                        {/* More actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {post.status === "PENDING_REVIEW" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => moderate(post.id, "approve")}
                                  className="text-green-700 font-semibold gap-2"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" /> Aprobar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setRejectModal({ postId: post.id, title: post.title })}
                                  className="text-red-600 gap-2"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Rechazar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

                            {post.status === "PUBLISHED" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => moderate(post.id, post.isFeatured ? "unfeature" : "feature")}
                                  className="gap-2"
                                >
                                  {post.isFeatured
                                    ? <><StarOff className="h-3.5 w-3.5" /> Quitar destacado</>
                                    : <><Star    className="h-3.5 w-3.5" /> Destacar</>
                                  }
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

                            <DropdownMenuItem
                              onClick={() => moderate(post.id, "archive")}
                              className="text-amber-600 gap-2"
                            >
                              <Archive className="h-3.5 w-3.5" /> Archivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} de {total} artículos
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/admin/blog?status=${statusFilter}&page=${page - 1}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors ${
                    page <= 1 ? "opacity-30 pointer-events-none border-gray-100" : "border-gray-200 hover:border-green-400 hover:text-green-700"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <Link
                  href={`/admin/blog?status=${statusFilter}&page=${page + 1}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors ${
                    page >= totalPages ? "opacity-30 pointer-events-none border-gray-100" : "border-gray-200 hover:border-green-400 hover:text-green-700"
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
