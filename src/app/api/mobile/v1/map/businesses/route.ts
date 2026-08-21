// Negocios para el mapa interactivo, filtrados por BOUNDING BOX (a diferencia
// de `getMapBusinesses()` en `src/lib/queries.ts`, que trae `take: 500` SIN
// filtro geográfico — sirve para el mapa de escritorio con panorama completo,
// pero no escala a un mapa móvil que solo necesita lo visible en pantalla).
//
// Con zoom bajo (< 12) el cliente vería cientos de pines encimados sin poder
// distinguirlos; en su lugar se agregan por rejilla y se devuelven CLUSTERS
// (lat/lng/count). Con zoom alto se devuelven pines individuales.
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api/mobile/respond"
import { toBusinessPin } from "@/lib/api/mobile/serializers"

// Lado máximo del bbox: 1.5 grados (~165km) — más que eso ya no es "el mapa
// visible", es un área absurda que ameritaría zoom nacional, no pines de negocio.
const MAX_BBOX_DEGREES = 1.5

const bboxSchema = z
  .object({
    minLat: z.coerce.number().min(-90).max(90),
    maxLat: z.coerce.number().min(-90).max(90),
    minLng: z.coerce.number().min(-180).max(180),
    maxLng: z.coerce.number().min(-180).max(180),
    zoom: z.coerce.number().int().min(0).max(22).default(14),
    category: z.string().trim().max(120).optional(),
    q: z.string().trim().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(300).default(200),
  })
  .superRefine((val, ctx) => {
    if (val.minLat >= val.maxLat) {
      ctx.addIssue({ code: "custom", message: "minLat debe ser menor que maxLat.", path: ["minLat"] })
    }
    if (val.minLng >= val.maxLng) {
      ctx.addIssue({ code: "custom", message: "minLng debe ser menor que maxLng.", path: ["minLng"] })
    }
    if (val.maxLat - val.minLat > MAX_BBOX_DEGREES) {
      ctx.addIssue({ code: "custom", message: `El área solicitada excede ${MAX_BBOX_DEGREES}° de latitud.`, path: ["maxLat"] })
    }
    if (val.maxLng - val.minLng > MAX_BBOX_DEGREES) {
      ctx.addIssue({ code: "custom", message: `El área solicitada excede ${MAX_BBOX_DEGREES}° de longitud.`, path: ["maxLng"] })
    }
  })

// Redondea el bbox ANTES de consultar: un paneo continuo del usuario manda
// coordenadas casi-iguales en cada frame; redondear a 3 decimales (~111m) hace
// que paneos pequeños reutilicen la misma clave de caché de CDN en vez de
// disparar una query nueva por cuadro.
function roundCoord(n: number): number {
  return Math.round(n * 1000) / 1000
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parsed = bboxSchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", 400, "Bounding box inválido.", parsed.error.flatten())
  }

  const { zoom, category, q, limit } = parsed.data
  const minLat = roundCoord(parsed.data.minLat)
  const maxLat = roundCoord(parsed.data.maxLat)
  const minLng = roundCoord(parsed.data.minLng)
  const maxLng = roundCoord(parsed.data.maxLng)

  const where: Record<string, unknown> = {
    status: "ACTIVE",
    latitude: { gte: minLat, lte: maxLat },
    longitude: { gte: minLng, lte: maxLng },
  }
  if (category) {
    where.category = { is: { slug: category } }
  }
  if (q) {
    where.name = { contains: q, mode: "insensitive" }
  }

  let rows: Array<{
    id: string
    slug: string
    name: string
    latitude: number | null
    longitude: number | null
    isVerified: boolean
    category: { icon: string | null } | null
  }>
  try {
    // +1 para poder afirmar `hasMore` sin un COUNT aparte (barato: se descarta
    // el sobrante antes de serializar).
    rows = await prisma.profile.findMany({
      where: where as never,
      select: {
        id: true,
        slug: true,
        name: true,
        latitude: true,
        longitude: true,
        isVerified: true,
        category: { select: { icon: true } },
      },
      // Aprovecha el índice compuesto (latitude, longitude): filtra primero por
      // rango de coordenadas, boosteados/verificados primero dentro del recorte.
      orderBy: [{ isBoosted: "desc" }, { isVerified: "desc" }, { createdAt: "desc" }],
      take: limit + 1,
    })
  } catch (error) {
    console.error("[mobile/map/businesses]", error instanceof Error ? error.message : error)
    return fail("INTERNAL_ERROR", 500, "No se pudo cargar el mapa.")
  }

  const hasMore = rows.length > limit
  const trimmed = hasMore ? rows.slice(0, limit) : rows

  let data:
    | { mode: "clusters"; clusters: Array<{ lat: number; lng: number; count: number }> }
    | { mode: "pins"; pins: ReturnType<typeof toBusinessPin>[] }

  if (zoom < 12) {
    // Rejilla: 1 decimal (~11km) por debajo de zoom 10, 2 decimales (~1.1km)
    // entre 10 y 11 — más grueso mientras más alejado está el mapa.
    const precision = zoom < 10 ? 1 : 2
    const factor = 10 ** precision
    const buckets = new Map<string, { lat: number; lng: number; count: number }>()
    for (const r of trimmed) {
      if (r.latitude == null || r.longitude == null) continue
      const gLat = Math.round(r.latitude * factor) / factor
      const gLng = Math.round(r.longitude * factor) / factor
      const key = `${gLat}:${gLng}`
      const existing = buckets.get(key)
      if (existing) existing.count += 1
      else buckets.set(key, { lat: gLat, lng: gLng, count: 1 })
    }
    data = { mode: "clusters", clusters: Array.from(buckets.values()) }
  } else {
    data = { mode: "pins", pins: trimmed.map((r) => toBusinessPin(r)) }
  }

  const response = ok(data, { hasMore })
  response.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600")
  return response
}
