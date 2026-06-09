import Link from "next/link"
import { ArrowRight, Clock, User } from "lucide-react"

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImageUrl: string | null
  category: string | null
  readTimeMinutes: number
  publishedAt: Date | null
  author: { name: string | null }
}

interface LatestBlogPostsProps {
  posts: Post[]
}

function formatDate(date: Date | null) {
  if (!date) return ""
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(date)
}

export function LatestBlogPosts({ posts }: LatestBlogPostsProps) {
  if (posts.length === 0) return null

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Blog</p>
            <h2 className="text-3xl font-black text-gray-900">Consejos para tu negocio</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-xl">
              Estrategias, tendencias y guías prácticas para hacer crecer tu negocio en la ZMG.
            </p>
          </div>
          <Link
            href="/blog"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-900 transition-colors"
          >
            Ver todos los artículos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Posts grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post, i) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group">
              <article className={`rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all h-full flex flex-col ${i === 0 ? "md:col-span-1" : ""}`}>
                {/* Cover */}
                <div className="relative aspect-video bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden">
                  {post.coverImageUrl ? (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-5xl font-black text-green-800/10">{post.title.charAt(0)}</span>
                    </div>
                  )}
                  {post.category && (
                    <span className="absolute top-3 left-3 rounded-full bg-green-700/90 backdrop-blur-sm px-3 py-1 text-[11px] font-bold text-white">
                      {post.category}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-2 p-5 flex-1">
                  <h3 className="font-black text-gray-900 text-base leading-tight group-hover:text-green-800 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{post.excerpt}</p>
                  )}

                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      {post.author.name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />{post.author.name}
                        </span>
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

        {/* Mobile CTA */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-green-200 px-5 py-2.5 text-sm font-bold text-green-700 hover:bg-green-50 transition-colors"
          >
            Ver todos los artículos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
