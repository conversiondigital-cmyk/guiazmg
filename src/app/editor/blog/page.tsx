import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { PlusCircle, Eye, Edit2, Calendar, Globe, FileText, Archive } from "lucide-react"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Gestión de Blog | Editor Guía ZMG",
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: "Publicado",  cls: "bg-green-100 text-green-800" },
  DRAFT:     { label: "Borrador",   cls: "bg-gray-100 text-gray-600" },
  ARCHIVED:  { label: "Archivado",  cls: "bg-amber-100 text-amber-700" },
}

function formatDate(date: Date | null) {
  if (!date) return "—"
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(date)
}

export default async function EditorBlogPage() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== "EDITOR" && role !== "ADMIN") redirect("/")

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  })

  const counts = {
    PUBLISHED: posts.filter((p) => p.status === "PUBLISHED").length,
    DRAFT:     posts.filter((p) => p.status === "DRAFT").length,
    ARCHIVED:  posts.filter((p) => p.status === "ARCHIVED").length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Blog</h1>
            <p className="text-sm text-gray-500">Gestiona los artículos del blog de Guía ZMG</p>
          </div>
          <Link
            href="/editor/blog/nuevo"
            className="flex items-center gap-2 rounded-xl bg-green-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-900 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo artículo
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Publicados",  value: counts.PUBLISHED, icon: Globe,    color: "text-green-700 bg-green-100" },
            { label: "Borradores",  value: counts.DRAFT,     icon: FileText, color: "text-gray-600 bg-gray-100" },
            { label: "Archivados",  value: counts.ARCHIVED,  icon: Archive,  color: "text-amber-700 bg-amber-100" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl bg-white border border-gray-100 p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
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
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Publicado</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Autor</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {posts.map((post) => {
                  const badge = STATUS_BADGE[post.status] ?? STATUS_BADGE.DRAFT
                  return (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 line-clamp-1">{post.title}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">/blog/{post.slug}</p>
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
                          {formatDate(post.publishedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-xs text-gray-500">{post.author.name ?? "—"}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
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
    </div>
  )
}
