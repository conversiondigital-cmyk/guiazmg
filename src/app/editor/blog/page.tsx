import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { PlusCircle, Eye, Edit2, Calendar, Globe, FileText, Archive, Clock, XCircle } from "lucide-react"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ status?: string }> }): Promise<Metadata> {
  const { status } = await searchParams
  const labels: Record<string, string> = {
    PUBLISHED: "Publicados", DRAFT: "Borradores",
    PENDING_REVIEW: "En revisión", REJECTED: "Rechazados", ARCHIVED: "Archivados",
  }
  return { title: `${status && labels[status] ? labels[status] + " | " : ""}Mis artículos | Editor — Guía ZMG` }
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PUBLISHED:      { label: "Publicado",     cls: "bg-green-100 text-green-800" },
  DRAFT:          { label: "Borrador",      cls: "bg-gray-100 text-gray-600" },
  PENDING_REVIEW: { label: "En revisión",   cls: "bg-amber-100 text-amber-700" },
  REJECTED:       { label: "Rechazado",     cls: "bg-red-100 text-red-700" },
  ARCHIVED:       { label: "Archivado",     cls: "bg-slate-100 text-slate-600" },
}

const VALID_STATUSES = ["PUBLISHED", "DRAFT", "PENDING_REVIEW", "REJECTED", "ARCHIVED"] as const

function formatDate(date: Date | null) {
  if (!date) return "—"
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(date)
}

export default async function EditorBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const role = (session.user as any)?.role
  const userId = (session.user as any)?.id
  if (role !== "EDITOR" && role !== "ADMIN") redirect("/")

  const sp = await searchParams
  const statusFilter = VALID_STATUSES.includes(sp.status as any) ? sp.status : undefined

  // ADMIN ve todos — EDITOR solo sus artículos
  const whereBase = role === "ADMIN" ? {} : { authorId: userId }
  const where = statusFilter ? { ...whereBase, status: statusFilter } : whereBase

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  })

  // Count over ALL posts (no status filter) for stats
  const allPosts = statusFilter
    ? await prisma.post.findMany({ where: whereBase, select: { status: true } })
    : posts

  const counts = {
    PUBLISHED:      allPosts.filter((p) => p.status === "PUBLISHED").length,
    DRAFT:          allPosts.filter((p) => p.status === "DRAFT").length,
    PENDING_REVIEW: allPosts.filter((p) => p.status === "PENDING_REVIEW").length,
    REJECTED:       allPosts.filter((p) => p.status === "REJECTED").length,
    ARCHIVED:       allPosts.filter((p) => p.status === "ARCHIVED").length,
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {role === "ADMIN" ? "Todos los artículos" : "Mis artículos"}
            {statusFilter && (
              <span className={`ml-2 text-base font-semibold ${STATUS_BADGE[statusFilter]?.cls.replace("bg-", "text-").split(" ")[0]}`}>
                — {STATUS_BADGE[statusFilter]?.label}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {role === "ADMIN" ? "Vista global del blog" : "Gestiona tus artículos del blog"}
            {statusFilter && (
              <Link href="/editor/blog" className="ml-2 text-green-700 hover:underline text-xs font-semibold">
                × Quitar filtro
              </Link>
            )}
          </p>
        </div>
        <Link
          href="/editor/blog/nuevo"
          className="flex items-center gap-2 rounded-xl bg-green-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-900 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Nuevo artículo
        </Link>
      </div>

      {/* Stats — click to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Publicados",   value: counts.PUBLISHED,      icon: Globe,     color: "text-green-700 bg-green-100",  status: "PUBLISHED" },
          { label: "Borradores",   value: counts.DRAFT,          icon: FileText,  color: "text-gray-600 bg-gray-100",    status: "DRAFT" },
          { label: "En revisión",  value: counts.PENDING_REVIEW, icon: Clock,     color: "text-amber-700 bg-amber-100",  status: "PENDING_REVIEW" },
          { label: "Rechazados",   value: counts.REJECTED,       icon: XCircle,   color: "text-red-600 bg-red-100",      status: "REJECTED" },
          { label: "Archivados",   value: counts.ARCHIVED,       icon: Archive,   color: "text-slate-600 bg-slate-100",  status: "ARCHIVED" },
        ].map(({ label, value, icon: Icon, color, status }) => (
          <Link
            key={label}
            href={statusFilter === status ? "/editor/blog" : `/editor/blog?status=${status}`}
            className={`rounded-xl bg-white border p-4 flex items-center gap-3 hover:shadow-sm transition-all ${
              statusFilter === status ? "border-green-400 ring-1 ring-green-400" : "border-gray-100"
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">{value}</p>
              <p className="text-[11px] text-gray-500 leading-tight">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Posts table */}
      {posts.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <FileText className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No hay artículos aún</p>
          <Link href="/editor/blog/nuevo" className="mt-4 inline-block text-sm text-green-700 font-semibold hover:underline">
            Crear el primer artículo →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Título</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden md:table-cell">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden sm:table-cell">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Fecha</th>
                {role === "ADMIN" && (
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Autor</th>
                )}
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map((post) => {
                const badge = STATUS_BADGE[post.status] ?? STATUS_BADGE.DRAFT
                return (
                  <tr key={post.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 line-clamp-1">{post.title}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">/blog/{post.slug}</p>
                      {post.status === "REJECTED" && (post as any).rejectionReason && (
                        <p className="text-[11px] text-red-500 mt-1 line-clamp-1">
                          Motivo: {(post as any).rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-xs text-gray-500">{post.category ?? "—"}</span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.publishedAt ?? post.createdAt)}
                      </span>
                    </td>
                    {role === "ADMIN" && (
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-xs text-gray-500">{post.author.name ?? "—"}</span>
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {post.status === "PUBLISHED" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-700 transition-colors"
                            title="Ver publicado"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        <Link
                          href={`/editor/blog/${post.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-700 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
