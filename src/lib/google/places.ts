import { getSetting } from "@/lib/settings"
import { prisma } from "@/lib/prisma"

// Sincroniza el rating y el número de reseñas de Google (Places API) hacia
// Profile.googleRating / googleReviewCount. Credential-ready: usa
// `google_places_api_key` (o `google_maps_api_key`) de Admin→Config, con
// respaldo a env. Sin key → no-op elegante.

async function getPlacesApiKey(): Promise<string> {
  const dedicated = await getSetting("google_places_api_key", "GOOGLE_PLACES_API_KEY")
  if (dedicated) return dedicated
  return getSetting("google_maps_api_key", "GOOGLE_MAPS_API_KEY")
}

// Intenta sacar un place_id directamente de la URL de Google Maps guardada.
export function extractPlaceId(url?: string | null): string | null {
  if (!url) return null
  const m = url.match(/[?&]place_id=([A-Za-z0-9_-]+)/) || url.match(/\/place\/[^/]*\/place_id:([A-Za-z0-9_-]+)/)
  return m ? m[1] : null
}

async function findPlaceId(query: string, key: string): Promise<string | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${key}`
  const res = await fetch(url)
  if (!res.ok) return null
  const j = (await res.json()) as { candidates?: { place_id?: string }[] }
  return j.candidates?.[0]?.place_id ?? null
}

async function getPlaceRating(
  placeId: string,
  key: string
): Promise<{ rating: number | null; count: number | null } | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}&fields=rating,user_ratings_total&key=${key}`
  const res = await fetch(url)
  if (!res.ok) return null
  const j = (await res.json()) as {
    status?: string
    result?: { rating?: number; user_ratings_total?: number }
  }
  if (j.status !== "OK") return null
  return { rating: j.result?.rating ?? null, count: j.result?.user_ratings_total ?? null }
}

export interface SyncResult {
  ok: boolean
  skipped?: boolean
  rating?: number | null
  count?: number | null
  error?: string
}

export async function syncGoogleRating(profileId: string): Promise<SyncResult> {
  const key = await getPlacesApiKey()
  if (!key) return { ok: true, skipped: true }

  const p = await prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      name: true,
      googleMapsUrl: true,
      addressText: true,
      municipality: { select: { name: true } },
    },
  })
  if (!p) return { ok: false, error: "Negocio no encontrado" }

  let placeId = extractPlaceId(p.googleMapsUrl)
  if (!placeId) {
    const query = [p.name, p.addressText, p.municipality?.name, "Jalisco, México"]
      .filter(Boolean)
      .join(", ")
    placeId = await findPlaceId(query, key)
  }
  if (!placeId) return { ok: false, error: "No se encontró el lugar en Google" }

  const r = await getPlaceRating(placeId, key)
  if (!r) return { ok: false, error: "No se pudo leer el rating de Google" }

  await prisma.profile.update({
    where: { id: profileId },
    data: { googleRating: r.rating, googleReviewCount: r.count },
  })
  return { ok: true, rating: r.rating, count: r.count }
}

// Sincroniza en lote (para el cron). Solo negocios activos con URL de Google.
export async function syncGoogleRatingsBatch(limit = 50): Promise<{ processed: number; updated: number }> {
  const key = await getPlacesApiKey()
  if (!key) return { processed: 0, updated: 0 }

  const profiles = await prisma.profile.findMany({
    where: { status: "ACTIVE", deletedAt: null, googleMapsUrl: { not: null } },
    select: { id: true },
    orderBy: { updatedAt: "asc" },
    take: limit,
  })

  let updated = 0
  for (const p of profiles) {
    const r = await syncGoogleRating(p.id)
    if (r.ok && !r.skipped && !r.error) updated++
  }
  return { processed: profiles.length, updated }
}
