export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BookOpen, Clock, Users } from "lucide-react"
import { Metadata } from "next"
import { EditoresClient } from "./editores-client"

export const metadata: Metadata = { title: "Gestión de Editores | Admin Guía ZMG" }

export default async function AdminEditoresPage() {
  const session = await auth()
  if ((session?.user as any)?.role !== "ADMIN") redirect("/")

  // Fetch editors with post counts
  const editors = await prisma.user.findMany({
    where: { role: "EDITOR" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { postsAuthored: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Conteos publicados/pendientes por editor en UNA sola query (antes era N+1:
  // 2 counts por cada editor). Un groupBy agrega todo y se mapea en memoria.
  const editorIds = editors.map((e) => e.id)
  const grouped = editorIds.length
    ? await prisma.post.groupBy({
        by: ["authorId", "status"],
        where: { authorId: { in: editorIds }, status: { in: ["PUBLISHED", "PENDING_REVIEW"] } },
        _count: { _all: true },
      })
    : []
  const countMap = new Map<string, { published: number; pending: number }>()
  for (const g of grouped) {
    if (!g.authorId) continue
    const rec = countMap.get(g.authorId) ?? { published: 0, pending: 0 }
    if (g.status === "PUBLISHED") rec.published = g._count._all
    else if (g.status === "PENDING_REVIEW") rec.pending = g._count._all
    countMap.set(g.authorId, rec)
  }
  const enriched = editors.map((editor) => {
    const c = countMap.get(editor.id) ?? { published: 0, pending: 0 }
    return {
      ...editor,
      _count: { posts: editor._count.postsAuthored },
      createdAt: editor.createdAt.toISOString(),
      lastLoginAt: editor.lastLoginAt?.toISOString() ?? null,
      publishedCount: c.published,
      pendingCount: c.pending,
    }
  })

  // Global stats
  const [totalEditors, activeEditors, totalPosts, pendingReview] = await Promise.all([
    prisma.user.count({ where: { role: "EDITOR" } }),
    prisma.user.count({ where: { role: "EDITOR", isActive: true } }),
    prisma.post.count(),
    prisma.post.count({ where: { status: "PENDING_REVIEW" } }),
  ])

  const kpis = [
    { label: "Total editores", value: totalEditors,  icon: Users,    color: "bg-gray-100 text-gray-700" },
    { label: "Activos",        value: activeEditors,  icon: Users,    color: "bg-green-100 text-green-700" },
    { label: "Artículos blog", value: totalPosts,     icon: BookOpen, color: "bg-blue-100 text-blue-700" },
    { label: "En revisión",    value: pendingReview,  icon: Clock,    color: "bg-amber-100 text-amber-700" },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Gestión de Editores</h1>
        <p className="text-sm text-gray-500 mt-0.5">Asigna y gestiona los usuarios con acceso al panel editorial del blog</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-100 p-5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color} mb-3`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Editors table with client actions */}
      <EditoresClient editors={enriched} />
    </div>
  )
}
