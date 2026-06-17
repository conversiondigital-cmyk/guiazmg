import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, User, Clock, ArrowLeft, Tag } from "lucide-react"
import { Metadata } from "next"
import { safeJsonLd } from "@/lib/seo/schema"
import { ViewCounter } from "@/components/blog/view-counter"
import { ReadingProgress } from "@/components/blog/reading-progress"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await prisma.post.findUnique({
      where: { slug, status: "PUBLISHED" },
      select: { title: true, metaTitle: true, excerpt: true, metaDescription: true, coverImageUrl: true },
    })
    if (!post) return { title: "Artículo no encontrado | Blog Guía ZMG" }

    return {
      title: `${post.metaTitle ?? post.title} | Blog Guía ZMG`,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      openGraph: {
        title: post.metaTitle ?? post.title,
        description: post.metaDescription ?? post.excerpt ?? undefined,
        images: post.coverImageUrl ? [post.coverImageUrl] : [],
        type: "article",
      },
    }
  } catch {
    return { title: "Blog Guía ZMG" }
  }
}

function formatDate(date: Date | null) {
  if (!date) return ""
  return new Intl.DateTimeFormat("es-MX", { year: "numeric", month: "long", day: "numeric" }).format(date)
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { author: { select: { id: true, name: true, image: true } } },
  })

  if (!post) notFound()

  const related = await prisma.post.findMany({
    where: { status: "PUBLISHED", category: post.category ?? undefined, id: { not: post.id } },
    take: 3,
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true, coverImageUrl: true, category: true, readTimeMinutes: true, publishedAt: true },
  })

  const jsonLd = safeJsonLd({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@type": "Organization", name: "Guía ZMG", logo: { "@type": "ImageObject", url: "/favicon.svg" } },
  })

  return (
    <>
      <ReadingProgress />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-green-900 py-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",backgroundSize:"60px 60px"}} />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Link href="/blog" className="mb-4 inline-flex items-center gap-1.5 text-green-300 hover:text-white text-sm transition-colors">
              <ArrowLeft className="h-4 w-4" /> Volver al Blog
            </Link>
            {post.category && (
              <div className="mb-3">
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                  {post.category}
                </span>
              </div>
            )}
            <h1 className="text-3xl font-black text-white sm:text-4xl leading-tight">{post.title}</h1>
            {post.excerpt && (
              <p className="mt-3 text-lg text-green-200 leading-relaxed max-w-3xl">{post.excerpt}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-green-300">
              {post.author.name && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {post.author.name}
                </span>
              )}
              {post.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(new Date(post.publishedAt))}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readTimeMinutes} min de lectura
              </span>
            </div>
          </div>
        </section>

        {/* Cover image */}
        {post.coverImageUrl && (
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 -mt-6">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full rounded-2xl object-cover shadow-xl max-h-[400px]"
            />
          </div>
        )}

        {/* Article content */}
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-black prose-headings:text-gray-900
              prose-h2:text-2xl prose-h3:text-xl
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-green-700 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900
              prose-ul:list-disc prose-ol:list-decimal
              prose-li:text-gray-700
              prose-blockquote:border-green-700 prose-blockquote:bg-green-50 prose-blockquote:rounded-xl prose-blockquote:py-2 prose-blockquote:not-italic
              prose-code:bg-gray-100 prose-code:rounded prose-code:px-1 prose-code:text-green-800 prose-code:text-sm
              prose-img:rounded-xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              {post.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Social share */}
          {(() => {
            const pageUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/blog/${post.slug}`)
            const pageTitle = encodeURIComponent(post.title)
            return (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Compartir artículo</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/?text=${pageTitle}%20${pageUrl}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X (Twitter)
                  </a>
                  <a
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${pageUrl}&title=${pageTitle}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-[#0A66C2] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                </div>
              </div>
            )
          })()}
        </article>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="bg-gray-50 py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-black text-gray-900 mb-8">Artículos relacionados</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {related.map((p) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="group">
                    <article className="rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-green-200 hover:shadow-md transition-all">
                      <div className="aspect-video bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden">
                        {p.coverImageUrl ? (
                          <img src={p.coverImageUrl} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <span className="text-4xl font-black text-green-800/10">{p.title.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        {p.category && <p className="text-[10px] font-bold uppercase text-green-700 tracking-wide mb-1">{p.category}</p>}
                        <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-green-800 line-clamp-2">{p.title}</h3>
                        <p className="text-xs text-gray-400 mt-2">{p.readTimeMinutes} min de lectura</p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* View counter — client-side, fire-and-forget with Redis 24h debounce */}
      <ViewCounter postId={post.id} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <Footer />
    </>
  )
}
