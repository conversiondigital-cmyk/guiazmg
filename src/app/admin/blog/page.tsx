export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  FileText, Globe, Clock, Archive, XCircle,
  Eye, Edit2, CheckCircle, PlusCircle, Star,
  TrendingUp, Users, Calendar, BarChart3, Search,
} from "lucide-react"
import { BlogModerationClient } from "./blog-moderation-client"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Gestión de Blog | Admin Guía ZMG" }

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  const session = await auth()
  if ((session?.user as any)?.role !== "ADMIN") redirect("/")

  const sp = await searchParams
  const statusFilter = sp.status ?? "ALL"
  const search       = sp.q ?? ""
  const page         = Math.max(1, Number(sp.page ?? 1))
  const limit        = 20

  // Stats
  const [statsRaw, totalViews] = await Promise.all([
    prisma.post.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.post.aggregate({ _sum: { viewCount: true } }),
  ])

  const stats = {
    ALL:            statsRaw.reduce((s, r) => s + r._count.id, 0),
    PUBLISHED:      statsRaw.find((r) => r.status === "PUBLISHED")?._count.id ?? 0,
    PENDING_REVIEW: statsRaw.find((r) => r.status === "PENDING_REVIEW")?._count.id ?? 0,
    DRAFT:          statsRaw.find((r) => r.status === "DRAFT")?._count.id ?? 0,
    REJECTED:       statsRaw.find((r) => r.status === "REJECTED")?._count.id ?? 0,
    ARCHIVED:       statsRaw.find((r) => r.status === "ARCHIVED")?._count.id ?? 0,
    totalViews:     totalViews._sum.viewCount ?? 0,
  }

  // Posts query
  const where: any = {}
  if (statusFilter !== "ALL") where.status = statusFilter
  if (search) {
    where.OR = [
      { title:    { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ]
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      // PENDING_REVIEW primero cuando no hay filtro de estado
      orderBy: statusFilter === "ALL"
        ? [{ createdAt: "desc" }]
        : [{ createdAt: "desc" }],
      skip:  (page - 1) * limit,
      take:  limit,
      include: {
        author:     { select: { id: true, name: true, email: true, image: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.post.count({ where }),
  ])

  // Top posts by views
  const topPosts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { viewCount: "desc" },
    take: 5,
    select: { id: true, title: true, slug: true, viewCount: true, category: true },
  })

  // Recent activity
  const recentActivity = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: { id: true, title: true, slug: true, status: true, updatedAt: true, author: { select: { name: true } } },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Blog — Panel de Administración</h1>
            <p className="text-sm text-gray-500">Modera artículos, gestiona editores y analiza el rendimiento</p>
          </div>
          <Link
            href="/editor/blog/nuevo"
            className="flex items-center gap-2 rounded-xl bg-green-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-900 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo artículo
          </Link>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
          {[
            { label: "Total",    value: stats.ALL,            icon: FileText,   color: "text-gray-700  bg-gray-100",   filter: "ALL" },
            { label: "Public.",  value: stats.PUBLISHED,      icon: Globe,      color: "text-green-700 bg-green-100",  filter: "PUBLISHED" },
            { label: "Revisión", value: stats.PENDING_REVIEW, icon: Clock,      color: "text-amber-700 bg-amber-100",  filter: "PENDING_REVIEW" },
            { label: "Borrador", value: stats.DRAFT,          icon: FileText,   color: "text-blue-700  bg-blue-100",   filter: "DRAFT" },
            { label: "Rechaz.",  value: stats.REJECTED,       icon: XCircle,    color: "text-red-700   bg-red-100",    filter: "REJECTED" },
            { label: "Archiv.",  value: stats.ARCHIVED,       icon: Archive,    color: "text-gray-500  bg-gray-100",   filter: "ARCHIVED" },
          ].map(({ label, value, icon: Icon, color, filter }) => (
            <Link
              key={filter}
              href={`/admin/blog?status=${filter}`}
              className={`rounded-xl bg-white border p-4 flex flex-col gap-1 hover:shadow-md transition-all ${
                statusFilter === filter ? "border-green-400 ring-1 ring-green-400" : "border-gray-100"
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-black text-gray-900 mt-1">{value}</p>
              <p className="text-[11px] text-gray-500">{label}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Left: posts list */}
          <div className="flex flex-col gap-4">
            {/* Search + filter bar */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <form>
                  <input
                    type="text"
                    name="q"
                    defaultValue={search}
                    placeholder="Buscar por título o categoría..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  <input type="hidden" name="status" value={statusFilter} />
                </form>
              </div>
            </div>

            {/* Moderation client component (handles approve/reject/feature actions) */}
            <BlogModerationClient
              posts={posts as any}
              total={total}
              page={page}
              limit={limit}
              statusFilter={statusFilter}
            />
          </div>

          {/* Right: sidebar */}
          <div className="flex flex-col gap-4">
            {/* Views */}
            <div className="rounded-xl bg-white border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-700" />
                <p className="text-sm font-bold text-gray-900">Total de vistas</p>
              </div>
              <p className="text-3xl font-black text-green-800">{stats.totalViews.toLocaleString("es-MX")}</p>
              <p className="text-xs text-gray-400 mt-1">en todos los artículos publicados</p>
            </div>

            {/* Top posts */}
            {topPosts.length > 0 && (
              <div className="rounded-xl bg-white border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-green-700" />
                  <p className="text-sm font-bold text-gray-900">Más leídos</p>
                </div>
                <div className="flex flex-col gap-2">
                  {topPosts.map((p, i) => (
                    <div key={p.id} className="flex items-start gap-2">
                      <span className="shrink-0 text-xs font-black text-gray-300 mt-0.5 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{p.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{p.viewCount.toLocaleString()} vistas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity */}
            <div className="rounded-xl bg-white border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-green-700" />
                <p className="text-sm font-bold text-gray-900">Actividad reciente</p>
              </div>
              <div className="flex flex-col gap-2">
                {recentActivity.map((p) => (
                  <div key={p.id} className="flex items-start gap-2">
                    <div className={`shrink-0 mt-0.5 h-2 w-2 rounded-full ${
                      p.status === "PUBLISHED"      ? "bg-green-500" :
                      p.status === "PENDING_REVIEW" ? "bg-amber-400" :
                      p.status === "REJECTED"       ? "bg-red-400" :
                      "bg-gray-300"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-snug line-clamp-1">{p.title}</p>
                      <p className="text-[10px] text-gray-400">{p.author.name} · {new Date(p.updatedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
