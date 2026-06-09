export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { BookOpen, FilePlus, Clock, Eye, Globe, FileText, ArrowRight } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard Editorial | Guía ZMG" }

export default async function EditorDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")
  const role = (session.user as any).role
  if (role !== "EDITOR" && role !== "ADMIN") redirect("/")

  const userId = (session.user as any).id

  const [totalPublished, totalDraft, totalPending, recentActivity, topPosts] = await Promise.all([
    prisma.post.count({ where: { authorId: userId, status: "PUBLISHED" } }),
    prisma.post.count({ where: { authorId: userId, status: "DRAFT" } }),
    prisma.post.count({ where: { authorId: userId, status: "PENDING_REVIEW" } }),
    prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, slug: true, status: true, updatedAt: true },
    }),
    prisma.post.findMany({
      where: { authorId: userId, status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, viewCount: true },
    }),
  ])

  const kpis = [
    { label: "Publicados",  value: totalPublished, icon: Globe,    color: "bg-green-50 text-green-700",  href: "/editor/blog?status=PUBLISHED" },
    { label: "Borradores",  value: totalDraft,     icon: FileText, color: "bg-gray-50  text-gray-600",   href: "/editor/blog?status=DRAFT" },
    { label: "En revisión", value: totalPending,   icon: Clock,    color: "bg-amber-50 text-amber-700",  href: "/editor/blog?status=PENDING_REVIEW" },
  ]

  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    PUBLISHED:      { label: "Publicado",  cls: "text-green-700 bg-green-50" },
    PENDING_REVIEW: { label: "En revisión",cls: "text-amber-700 bg-amber-50" },
    DRAFT:          { label: "Borrador",   cls: "text-gray-500  bg-gray-100" },
    REJECTED:       { label: "Rechazado",  cls: "text-red-700   bg-red-50"   },
    ARCHIVED:       { label: "Archivado",  cls: "text-gray-400  bg-gray-100" },
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard Editorial</h1>
          <p className="text-sm text-gray-500 mt-0.5">Administra el contenido del blog de Guía ZMG</p>
        </div>
        <Link
          href="/editor/blog/nuevo"
          className="flex items-center gap-2 rounded-xl bg-green-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-900 transition-colors"
        >
          <FilePlus className="h-4 w-4" />
          Nuevo artículo
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="rounded-2xl bg-white border border-gray-100 p-5 hover:shadow-md transition-all group">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color} mb-3`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-3xl font-black text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Recent activity */}
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-700" />
              <h2 className="text-sm font-bold text-gray-900">Actividad reciente</h2>
            </div>
            <Link href="/editor/blog" className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aún no tienes artículos</p>
              <Link href="/editor/blog/nuevo" className="mt-3 inline-flex text-sm font-semibold text-green-700 hover:underline">
                Crear tu primer artículo →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentActivity.map((post) => {
                const badge = STATUS_LABEL[post.status] ?? STATUS_LABEL.DRAFT
                return (
                  <div key={post.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{post.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(post.updatedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
                      <Link
                        href={`/editor/blog/${post.id}`}
                        className="opacity-0 group-hover:opacity-100 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:text-green-700 transition-all"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top posts */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-green-700" />
              <h2 className="text-sm font-bold text-gray-900">Más leídos</h2>
            </div>
            {topPosts.length === 0 ? (
              <p className="text-xs text-gray-400">Sin artículos publicados aún</p>
            ) : (
              <div className="space-y-3">
                {topPosts.map((p, i) => (
                  <div key={p.id} className="flex items-start gap-2">
                    <span className="text-xs font-black text-gray-300 mt-0.5 w-4 shrink-0">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{p.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.viewCount.toLocaleString("es-MX")} vistas</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl bg-green-900 p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-green-300 mb-3">Acceso rápido</p>
            <div className="space-y-2">
              {[
                { label: "Todos los artículos", href: "/editor/blog", icon: BookOpen },
                { label: "Nuevo artículo",      href: "/editor/blog/nuevo", icon: FilePlus },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-green-100 hover:bg-white/20 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
