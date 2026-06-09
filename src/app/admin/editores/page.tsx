export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BookOpen, Globe, Clock, Users } from "lucide-react"
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
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Enrich with published/pending counts per editor
  const enriched = await Promise.all(
    editors.map(async (editor) => {
      const [publishedCount, pendingCount] = await Promise.all([
        prisma.post.count({ where: { authorId: editor.id, status: "PUBLISHED" } }),
        prisma.post.count({ where: { authorId: editor.id, status: "PENDING_REVIEW" } }),
      ])
      return {
        ...editor,
        createdAt: editor.createdAt.toISOString(),
        lastLoginAt: editor.lastLoginAt?.toISOString() ?? null,
        publishedCount,
        pendingCount,
      }
    })
  )

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
