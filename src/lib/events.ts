import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"

export function slugifyEvent(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 70)
}

// Genera un slug único agregando un sufijo si ya existe.
export async function uniqueEventSlug(title: string): Promise<string> {
  const base = slugifyEvent(title) || "evento"
  let slug = base
  for (let i = 2; i < 50; i++) {
    const exists = await prisma.event.findUnique({ where: { slug }, select: { id: true } })
    if (!exists) return slug
    slug = `${base}-${i}`
  }
  return `${base}-${Date.now().toString(36)}`
}

interface EventFilter {
  municipalityId?: string
  freeOnly?: boolean
  take?: number
}

// Eventos publicados que aún no terminan (próximos / en curso).
// Cacheado (ISR/data cache): la lista cambia lento (alta por admin + cron diario),
// así que se sirve de caché 5 min en vez de golpear la BD en cada visita. La llave
// incluye los filtros (municipio/gratis/take). Se invalida por tiempo; para refresco
// inmediato al publicar/editar un evento, llamar revalidateTag("events").
export const getUpcomingEvents = unstable_cache(
  async (opts: EventFilter = {}) => {
    const now = new Date()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    try {
      return await prisma.event.findMany({
        where: {
          isPublished: true,
          deletedAt: null,
          ...(opts.municipalityId ? { municipalityId: opts.municipalityId } : {}),
          ...(opts.freeOnly ? { isFree: true } : {}),
          OR: [{ endAt: { gte: now } }, { AND: [{ endAt: null }, { startAt: { gte: startOfToday } }] }],
        },
        orderBy: [{ isFeatured: "desc" }, { startAt: "asc" }],
        take: opts.take ?? 60,
      })
    } catch {
      return []
    }
  },
  ["upcoming-events"],
  { revalidate: 300, tags: ["events"] }
)

export async function getEventBySlug(slug: string) {
  try {
    return await prisma.event.findFirst({ where: { slug, deletedAt: null } })
  } catch {
    return null
  }
}
