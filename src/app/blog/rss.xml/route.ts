/**
 * GET /blog/rss.xml
 * RSS 2.0 feed of the latest 50 published blog posts.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicAppUrl } from "@/lib/env"

export const dynamic = "force-dynamic"

function escapeXml(str: string) {
  return str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&apos;")
}

export async function GET() {
  const baseUrl = getPublicAppUrl()

  let posts: any[] = []
  try {
    posts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        tags: true,
        publishedAt: true,
        updatedAt: true,
        coverImageUrl: true,
        author: { select: { name: true } },
      },
    })
  } catch {
    // DB unavailable
  }

  const items = posts.map((post) => {
    const url    = `${baseUrl}/blog/${post.slug}`
    const date   = post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date(post.updatedAt).toUTCString()
    const desc   = post.excerpt ? escapeXml(post.excerpt) : ""
    const author = post.author?.name ? escapeXml(post.author.name) : "Guía ZMG"
    const cats   = [post.category, ...(post.tags ?? [])].filter(Boolean).map(escapeXml)

    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${desc}</description>
      <author>${author}</author>
      <pubDate>${date}</pubDate>
      ${cats.map((c) => `<category>${c}</category>`).join("\n      ")}
      ${post.coverImageUrl ? `<enclosure url="${escapeXml(post.coverImageUrl)}" type="image/jpeg" length="0" />` : ""}
    </item>`
  }).join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Blog | Guía ZMG</title>
    <link>${baseUrl}/blog</link>
    <description>Consejos, tendencias y estrategias para el éxito de tu negocio en la Zona Metropolitana de Guadalajara.</description>
    <language>es-MX</language>
    <copyright>© ${new Date().getFullYear()} Guía ZMG. Todos los derechos reservados.</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/favicon.svg</url>
      <title>Guía ZMG</title>
      <link>${baseUrl}</link>
    </image>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
