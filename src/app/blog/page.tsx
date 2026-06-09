import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Calendar, User, Clock, ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 12

interface Props {
  searchParams: Promise<{ categoria?: string; page?: string; q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { categoria, q } = await searchParams
  const prefix = q ? `"${q}"` : categoria ? categoria : null
  return {
    title: prefix ? `${prefix} | Blog Guía ZMG` : "Blog | Guía ZMG",
    description: "Consejos, tendencias y estrategias para el éxito de tu negocio en Guadalajara.",
  }
}

function formatDate(date: Date | null) {
  if (!date) return ""
  return new Intl.DateTimeFormat("es-MX", { year: "numeric", month: "long", day: "numeric" }).format(date)
}

export default async function BlogPage({ searchParams }: Props) {
  const { categoria, page: pageParam, q } = await searchParams
  const page = Math.max(1, Number(pageParam ?? 1))

  const where: any = { status: "PUBLISHED" }
  if (categoria) where.category = categoria
  if (q) {
    where.OR = [
      { title:   { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
      { tags:    { has: q } },
    ]
  }

  let posts: any[] = []
  let total = 0
  let allCategories: string[] = []

  try {
    const [fetchedPosts, fetchedTotal, categoriesRaw] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true, title: true, slug: true, excerpt: true,
          coverImageUrl: true, category: true, tags: true,
          readTimeMinutes: true, publishedAt: true, isFeatured: true,
          author: { select: { name: true, image: true } },
        },
      }),
      prisma.post.count({ where }),
      prisma.post.findMany({
        where: { status: "PUBLISHED", category: { not: null } },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
    ])
    posts = fetchedPosts
    total = fetchedTotal
    allCategories = categoriesRaw.map((r: any) => r.category).filter(Boolean)
  } catch {
    // DB unavailable
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const isSearching = !!q
  const featured = page === 1 && !categoria && !isSearching ? posts.slice(0, 3) : []
  const rest = page === 1 && !categoria && !isSearching ? posts.slice(3) : posts

  const buildHref = (p: number, cat?: string, search?: string) => {
    const params = new URLSearchParams()
    if (cat) params.set("categoria", cat)
    if (search) params.set("q", search)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/blog${qs ? `?${qs}` : ""}`
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-green-900 py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",backgroundSize:"60px 60px"}} />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Blog</p>
            <h1 className="text-4xl font-black text-white sm:text-5xl">
              {q ? `Búsqueda: "${q}"` : categoria ? categoria : "Blog de Guía ZMG"}
            </h1>
            <p className="mt-4 text-lg text-green-200 max-w-2xl mx-auto">
              Consejos, tendencias y estrategias para el éxito de tu negocio
            </p>
            {/* Search bar */}
            <form action="/blog" method="GET" className="mt-6 flex gap-2 max-w-lg mx-auto">
              {categoria && <input type="hidden" name="categoria" value={categoria} />}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Buscar artículos..."
                  className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder-green-300 focus:outline-none focus:ring-2 focus:ring-amber-400 backdrop-blur-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-400 transition-colors"
              >
                Buscar
              </button>
              {q && (
                <a
                  href={categoria ? `/blog?categoria=${encodeURIComponent(categoria)}` : "/blog"}
                  className="flex items-center rounded-xl border border-white/30 px-3 py-2.5 text-xs text-green-200 hover:text-white transition-colors"
                >
                  × Limpiar
                </a>
              )}
            </form>
          </div>
        </section>

        {/* Category pills */}
        {allCategories.length > 0 && (
          <div className="border-b border-gray-100 bg-white sticky top-16 z-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex gap-2 flex-wrap">
              <Link
                href="/blog"
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  !categoria
                    ? "bg-green-800 text-white"
                    : "border border-gray-200 text-gray-600 hover:border-green-600 hover:text-green-700"
                }`}
              >
                Todos
              </Link>
              {allCategories.map((cat) => (
                <Link
                  key={cat}
                  href={buildHref(1, cat, q)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    categoria === cat
                      ? "bg-green-800 text-white"
                      : "border border-gray-200 text-gray-600 hover:border-green-600 hover:text-green-700"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {posts.length === 0 && (
          <section className="py-24 text-center">
            <p className="text-gray-400 text-lg">
              {categoria ? `No hay artículos en "${categoria}" aún.` : "Pronto habrá artículos aquí. ¡Vuelve pronto!"}
            </p>
            {categoria && (
              <Link href="/blog" className="mt-4 inline-block text-sm font-semibold text-green-700 hover:underline">
                ← Ver todos los artículos
              </Link>
            )}
          </section>
        )}

        {/* Featured (first 3, only page 1, no category filter) */}
        {featured.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Artículos destacados</p>
              <h2 className="text-3xl font-black text-gray-900">Lo más reciente</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {featured.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                  <article className="rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all h-full flex flex-col">
                    <div className="relative aspect-video bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden">
                      {post.coverImageUrl ? (
                        <img src={post.coverImageUrl} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-6xl font-black text-green-800/10">{post.title.charAt(0)}</span>
                        </div>
                      )}
                      {post.category && (
                        <span className="absolute top-3 left-3 rounded-full bg-green-700 px-3 py-1 text-[11px] font-bold text-white">
                          {post.category}
                        </span>
                      )}
                      {post.isFeatured && (
                        <span className="absolute top-3 right-3 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-black text-white">
                          ★ Destacado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 p-5 flex-1">
                      <h3 className="font-black text-gray-900 text-lg leading-tight group-hover:text-green-800 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          {post.author?.name && (
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author.name}</span>
                          )}
                          {post.publishedAt && (
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(new Date(post.publishedAt))}</span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 font-semibold text-green-700">
                          <Clock className="h-3 w-3" />{post.readTimeMinutes} min
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Rest of articles */}
        {rest.length > 0 && (
          <section className={`py-16 ${featured.length > 0 ? "bg-gray-50" : ""}`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {featured.length > 0 && <h2 className="text-2xl font-black text-gray-900 mb-8">Más artículos</h2>}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post: any) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                    <article className="flex gap-4 rounded-xl bg-white border border-gray-100 p-4 hover:border-green-200 hover:shadow-md transition-all">
                      {post.coverImageUrl && (
                        <div className="shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-gray-100">
                          <img src={post.coverImageUrl} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {post.category && (
                          <span className="text-[10px] font-bold uppercase text-green-700 tracking-wide">{post.category}</span>
                        )}
                        <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-green-800 line-clamp-2 mt-0.5">
                          {post.title}
                        </h3>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
                          {post.publishedAt && <span>{formatDate(new Date(post.publishedAt))}</span>}
                          <span>·</span>
                          <span>{post.readTimeMinutes} min</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-green-600 mt-1 self-start transition-colors" />
                    </article>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  {page > 1 ? (
                    <Link
                      href={buildHref(page - 1, categoria, q)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed">
                      <ChevronLeft className="h-4 w-4" />
                    </span>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-gray-400">…</span>
                      ) : (
                        <Link
                          key={p}
                          href={buildHref(p as number, categoria, q)}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                            page === p
                              ? "bg-green-800 text-white"
                              : "border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700"
                          }`}
                        >
                          {p}
                        </Link>
                      )
                    )}

                  {page < totalPages ? (
                    <Link
                      href={buildHref(page + 1, categoria, q)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="rounded-2xl bg-green-900 p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">¿Tienes un negocio?</p>
              <h2 className="text-2xl font-black text-white">Hazlo crecer con Guía ZMG</h2>
              <p className="mt-3 text-green-200 text-sm leading-relaxed">
                Registra tu negocio y llega a miles de clientes en la Zona Metropolitana de Guadalajara.
              </p>
              <Link
                href="/registrar-negocio"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-400 transition-colors"
              >
                Agregar mi negocio <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
