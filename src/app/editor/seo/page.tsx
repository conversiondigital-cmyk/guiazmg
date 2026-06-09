import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Search, Edit2 } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = { title: "SEO Editorial | Guía ZMG" }

export default async function SeoEditorialPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")
  const role = (session.user as any).role
  if (role !== "EDITOR" && role !== "ADMIN") redirect("/")

  const userId = (session.user as any).id
  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: { id: true, title: true, slug: true, metaTitle: true, metaDescription: true, status: true },
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Search className="h-6 w-6 text-green-700" />
          SEO Editorial
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Meta títulos, descripciones y slugs de tus artículos</p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <Search className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No hay artículos para optimizar aún</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_80px] gap-0 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">
            <span>Artículo / Slug</span>
            <span>Meta descripción</span>
            <span className="text-right">Acción</span>
          </div>
          <div className="divide-y divide-gray-50">
            {posts.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_1fr_80px] items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 line-clamp-1">{p.metaTitle ?? p.title}</p>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">/blog/{p.slug}</p>
                  {!p.metaTitle && <span className="text-[9px] text-amber-600 font-bold">Sin meta título</span>}
                </div>
                <div className="min-w-0">
                  {p.metaDescription
                    ? <p className="text-xs text-gray-500 line-clamp-2">{p.metaDescription}</p>
                    : <span className="text-[10px] text-amber-600 font-bold">Sin meta descripción</span>
                  }
                </div>
                <div className="flex justify-end">
                  <Link
                    href={`/editor/blog/${p.id}`}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors"
                  >
                    <Edit2 className="h-3 w-3" />
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
