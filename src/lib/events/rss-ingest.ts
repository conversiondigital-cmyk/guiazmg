import { prisma } from "@/lib/prisma"
import { importRemoteImageToWebp } from "@/lib/images/import-remote"

// Ingesta de eventos desde un feed RSS/Atom. Como el RSS estándar no trae la
// fecha del evento (solo pubDate), los eventos se crean como BORRADOR
// (isPublished:false) para que el admin revise/corrija la fecha y publique.
// Dedup por sourceUrl. No usa librerías externas: parser mínimo de RSS 2.0/Atom.

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
}

function clean(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"))
  return m ? clean(m[1]) : null
}

// Primera imagen "real" del contenido del item (content:encoded / description).
// Muchos feeds (WordPress: Guadalajara Secreta, Gaceta UDG…) NO usan
// enclosure/media:content y ponen la foto como <img> dentro del HTML. Ignora
// emojis, gravatars, spacers y píxeles de tracking.
function firstContentImage(block: string): string | null {
  const imgs = [...block.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1])
  for (const raw of imgs) {
    const src = raw.replace(/&amp;/g, "&").trim()
    if (!/^https?:\/\//i.test(src)) continue
    if (/s\.w\.org\/images\/core\/emoji|\/emoji\/|gravatar\.com|spacer|blank\.gif|1x1|pixel\./i.test(src)) continue
    return src
  }
  return null
}

interface RssItem {
  title: string
  link: string | null
  description: string | null
  pubDate: string | null
  image: string | null
}

function parseFeed(xml: string): RssItem[] {
  const items: RssItem[] = []
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || []
  for (const block of blocks) {
    const title = tag(block, "title")
    if (!title) continue
    let link = tag(block, "link")
    if (!link) {
      const m = block.match(/<link[^>]*href="([^"]+)"/i)
      link = m ? m[1] : null
    }
    const description = tag(block, "description") || tag(block, "summary") || tag(block, "content")
    const pubDate = tag(block, "pubDate") || tag(block, "published") || tag(block, "updated")
    let image: string | null = null
    const enc =
      block.match(/<enclosure[^>]*url="([^"]+)"/i) ||
      block.match(/<media:content[^>]*url="([^"]+)"/i) ||
      block.match(/<media:thumbnail[^>]*url="([^"]+)"/i)
    if (enc) image = enc[1]
    if (!image) image = firstContentImage(block)
    items.push({ title, link, description, pubDate, image })
  }
  return items
}

export async function ingestEventsFromRss(url: string): Promise<{ imported: number; skipped: number }> {
  const res = await fetch(url, { headers: { "User-Agent": "GuiaZMG/1.0 (+events ingestion)" } })
  if (!res.ok) throw new Error(`El feed respondió ${res.status}`)
  const xml = await res.text()
  const items = parseFeed(xml)

  let imported = 0
  let skipped = 0

  for (const it of items.slice(0, 50)) {
    const sourceUrl = it.link || `${url}#${slugify(it.title)}`

    const existing = await prisma.event.findFirst({ where: { sourceUrl }, select: { id: true } })
    if (existing) {
      skipped++
      continue
    }

    const parsed = it.pubDate ? new Date(it.pubDate) : new Date()
    const startAt = isNaN(parsed.getTime()) ? new Date() : parsed

    let slug = slugify(it.title) || `evento-${Date.now()}`
    if (await prisma.event.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 7)}`
    }

    // La imagen del feed es un hotlink externo; la re-alojamos como WebP propio.
    // Si la conversión falla, caemos al hotlink (mejor una imagen que ninguna).
    let coverImageUrl: string | null = null
    if (it.image) {
      coverImageUrl = (await importRemoteImageToWebp(it.image, "events")) || it.image
    }

    await prisma.event.create({
      data: {
        title: it.title.slice(0, 200),
        slug,
        description: it.description?.slice(0, 2000) || null,
        startAt,
        sourceUrl,
        ticketUrl: it.link || null,
        coverImageUrl,
        source: "rss",
        isPublished: false,
      },
    })
    imported++
  }

  return { imported, skipped }
}
