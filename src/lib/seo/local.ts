import { prisma } from "@/lib/prisma"

// Umbral de indexación: una landing con menos de estos perfiles activos se sirve
// como noindex,follow (útil para el usuario, sin ensuciar el índice de Google).
export const MIN_INDEXABLE_PROFILES = 3

type Municipality = { id: string; name: string; slug: string }

export type LocalResolution =
  | { kind: "category"; municipality: Municipality; category: { id: string; name: string; slug: string; icon: string | null; description: string | null } }
  | { kind: "zone"; municipality: Municipality; zone: ZoneRecord }
  | { kind: "neighborhood"; municipality: Municipality; neighborhood: NeighborhoodRecord }
  | { kind: "none"; municipality: Municipality }
  | null

export type ZoneRecord = {
  id: string
  name: string
  slug: string
  description: string | null
  heroImageUrl: string | null
  isSeoIndexable: boolean
  nearbyZoneSlugs: string[]
  seoTitle: string | null
  seoDescription: string | null
}

export type NeighborhoodRecord = {
  id: string
  name: string
  slug: string
  heroImageUrl: string | null
  isSeoIndexable: boolean
  seoTitle: string | null
  seoDescription: string | null
  zoneId: string | null
  zone: { name: string; slug: string } | null
}

// Resuelve el 2º segmento de /{municipio}/{seg} como categoría | zona | colonia.
// La categoría tiene prioridad (slug global único) para no romper las landings
// municipio+categoría que ya existían. Tolerante a que la tabla `zones` aún no
// exista en la BD (pre-migración): en ese caso cae a "none" sin romper.
export async function resolveLocal(munSlug: string, seg: string): Promise<LocalResolution> {
  const municipality = await prisma.municipality.findUnique({
    where: { slug: munSlug },
    select: { id: true, name: true, slug: true },
  })
  if (!municipality) return null

  const category = await prisma.category.findUnique({
    where: { slug: seg },
    select: { id: true, name: true, slug: true, icon: true, description: true },
  })
  if (category) return { kind: "category", municipality, category }

  try {
    const zone = await prisma.zone.findUnique({
      where: { municipalityId_slug: { municipalityId: municipality.id, slug: seg } },
      select: {
        id: true, name: true, slug: true, description: true, heroImageUrl: true,
        isSeoIndexable: true, nearbyZoneSlugs: true, seoTitle: true, seoDescription: true, isActive: true,
      },
    })
    if (zone?.isActive) {
      const { isActive, ...rest } = zone
      void isActive
      return { kind: "zone", municipality, zone: rest }
    }

    const neighborhood = await prisma.neighborhood.findUnique({
      where: { municipalityId_slug: { municipalityId: municipality.id, slug: seg } },
      select: {
        id: true, name: true, slug: true, heroImageUrl: true, isSeoIndexable: true,
        seoTitle: true, seoDescription: true, zoneId: true, isActive: true,
        zone: { select: { name: true, slug: true } },
      },
    })
    if (neighborhood?.isActive) {
      const { isActive, ...rest } = neighborhood
      void isActive
      return { kind: "neighborhood", municipality, neighborhood: rest }
    }
  } catch {
    // La tabla `zones` puede no existir todavía en la BD; no rompas la ruta.
  }

  return { kind: "none", municipality }
}

// Conteo ligero de perfiles activos para decidir indexable/noindex.
export async function countLocalProfiles(opts: {
  municipalityId: string
  zoneId?: string
  neighborhoodId?: string
  categoryId?: string
}): Promise<number> {
  const where: any = { status: "ACTIVE", deletedAt: null, municipalityId: opts.municipalityId }
  if (opts.categoryId) where.categoryId = opts.categoryId
  if (opts.neighborhoodId) where.neighborhoodId = opts.neighborhoodId
  else if (opts.zoneId) where.neighborhood = { is: { zoneId: opts.zoneId } }
  try {
    return await prisma.profile.count({ where })
  } catch {
    return 0
  }
}

// Imagen característica de la zona: la definida por admin o, por convención, un
// archivo en /public/zonas/{municipio}/{slug}.jpg (si no existe, la landing
// muestra el degradado de respaldo — no rompe nada).
export function zoneHeroImage(munSlug: string, zone: { slug: string; heroImageUrl: string | null }): string {
  return zone.heroImageUrl || `/zonas/${munSlug}/${zone.slug}.jpg`
}
