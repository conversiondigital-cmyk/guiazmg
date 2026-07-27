// Landing hiperlocal de 3º nivel: /{municipio}/{seg}/{categoria}
// `seg` = ZONA o COLONIA; `categoria` = categoría. ISR 5 min.
export const revalidate = 300

import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCategories, getLocalListing } from "@/lib/queries"
import { LocalLanding } from "@/components/seo/local-landing"
import { getPublicAppUrl } from "@/lib/env"
import { breadcrumbSchema, itemListSchema, safeJsonLd } from "@/lib/seo/schema"
import { generateMeta } from "@/lib/seo/meta"
import { resolveLocal, countLocalProfiles, MIN_INDEXABLE_PROFILES } from "@/lib/seo/local"

interface Props {
  params: Promise<{ municipio: string; seg: string; categoria: string }>
}

const BASE_URL = getPublicAppUrl()

// Contexto de lugar (zona | colonia) + categoría, o null si no aplica.
async function resolvePlaceCategory(munSlug: string, seg: string, catSlug: string) {
  const r = await resolveLocal(munSlug, seg)
  if (!r || (r.kind !== "zone" && r.kind !== "neighborhood")) return null
  const category = await prisma.category.findUnique({
    where: { slug: catSlug },
    select: { id: true, name: true, slug: true },
  })
  if (!category) return null

  const isZone = r.kind === "zone"
  const place = isZone ? r.zone : r.neighborhood
  const zoneSlugForImage = isZone ? r.zone.slug : r.neighborhood.zone?.slug ?? null
  const zoneName = isZone ? r.zone.name : r.neighborhood.zone?.name ?? null
  return {
    municipality: r.municipality,
    category,
    isZone,
    placeId: place.id,
    placeName: place.name,
    placeSlug: place.slug,
    heroImageUrl: place.heroImageUrl,
    isSeoIndexable: place.isSeoIndexable,
    zoneSlugForImage,
    zoneName,
  }
}

export async function generateMetadata({ params }: Props) {
  const { municipio, seg, categoria } = await params
  try {
    const ctx = await resolvePlaceCategory(municipio, seg, categoria)
    if (!ctx) return { title: "No encontrado" }

    const count = await countLocalProfiles({
      municipalityId: ctx.municipality.id,
      categoryId: ctx.category.id,
      ...(ctx.isZone ? { zoneId: ctx.placeId } : { neighborhoodId: ctx.placeId }),
    })
    const noindex = !ctx.isSeoIndexable || count < MIN_INDEXABLE_PROFILES
    const title = `${ctx.category.name} en ${ctx.placeName}, ${ctx.municipality.name} | Guía ZMG`
    const description = `Encuentra ${ctx.category.name.toLowerCase()} cerca de ${ctx.placeName}, ${ctx.municipality.name}. Compara opciones, servicios, promociones y contacto por WhatsApp.`
    return generateMeta({ title, description, canonical: `${BASE_URL}/${municipio}/${seg}/${categoria}`, noindex })
  } catch {
    return { title: "Guía ZMG" }
  }
}

export default async function LocalSegmentCategoryPage({ params }: Props) {
  const { municipio, seg, categoria } = await params
  const ctx = await resolvePlaceCategory(municipio, seg, categoria)
  if (!ctx) notFound()

  const [results, categories, colonias] = await Promise.all([
    getLocalListing({
      municipalityId: ctx.municipality.id,
      categoryId: ctx.category.id,
      limit: 24,
      ...(ctx.isZone ? { zoneId: ctx.placeId } : { neighborhoodId: ctx.placeId }),
    }),
    getCategories(),
    // Colonias del contexto para cruces colonia+categoría.
    ctx.isZone
      ? prisma.neighborhood.findMany({
          where: { zoneId: ctx.placeId, isActive: true },
          select: { name: true, slug: true },
          orderBy: { name: "asc" },
          take: 14,
        })
      : Promise.resolve([] as { name: string; slug: string }[]),
  ])

  // Cambiar de categoría en el mismo lugar.
  const categoryLinks = categories
    .filter((c: any) => c.slug !== ctx.category.slug)
    .slice(0, 8)
    .map((c: any) => ({ name: c.name, icon: c.icon, href: `/${municipio}/${seg}/${c.slug}` }))

  // Misma categoría en colonias cercanas + la zona completa.
  const nearbyLinks = [
    { name: `${ctx.category.name} en toda la zona`, href: `/${municipio}/${seg}` },
    ...colonias.map((c) => ({ name: `${ctx.category.name} en ${c.name}`, href: `/${municipio}/${c.slug}/${categoria}` })),
  ]

  const h1 = `${ctx.category.name} en ${ctx.placeName}, ${ctx.municipality.name}`
  const intro = `Encuentra ${ctx.category.name.toLowerCase()} cerca de ${ctx.placeName}${
    ctx.zoneName && !ctx.isZone ? `, en ${ctx.zoneName}` : ""
  }, ${ctx.municipality.name}. Compara opciones y contacta por WhatsApp.`

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: BASE_URL },
    { name: ctx.municipality.name, url: `${BASE_URL}/${municipio}` },
    { name: ctx.placeName, url: `${BASE_URL}/${municipio}/${seg}` },
    { name: ctx.category.name, url: `${BASE_URL}/${municipio}/${seg}/${categoria}` },
  ])
  const itemListLd = itemListSchema(
    `${ctx.category.name} en ${ctx.placeName}`,
    results.businesses.map((b: any) => ({ name: b.name, url: `${BASE_URL}/perfil/${b.slug}` })),
  )

  const heroImage =
    ctx.heroImageUrl ||
    (ctx.zoneSlugForImage ? `/zonas/${municipio}/${ctx.zoneSlugForImage}.jpg` : null)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }} />
      <LocalLanding
        breadcrumb={[
          { name: "Inicio", href: "/" },
          { name: ctx.municipality.name, href: `/${municipio}` },
          { name: ctx.placeName, href: `/${municipio}/${seg}` },
          { name: ctx.category.name },
        ]}
        h1={h1}
        intro={intro}
        heroImage={heroImage}
        results={results as any}
        municipioSlug={municipio}
        municipioName={ctx.municipality.name}
        categoryLinks={categoryLinks}
        nearbyTitle="Busca en otras colonias"
        nearbyLinks={nearbyLinks}
        placeName={ctx.placeName}
      />
    </>
  )
}
