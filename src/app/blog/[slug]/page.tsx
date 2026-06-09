import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, User, Clock, ArrowLeft, Tag } from "lucide-react"
import { Metadata } from "next"
import { safeJsonLd } from "@/lib/seo/schema"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <Footer />
    </>
  )
}
