// Landing hiperlocal de 2º nivel: /{municipio}/{seg}
// `seg` se resuelve como CATEGORÍA (municipio+categoría, comportamiento previo) |
// ZONA (nuevo) | COLONIA (nuevo). ISR 5 min.
export const revalidate = 300

import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { prisma } from "@/lib/prisma"
import { search } from "@/lib/search/search-engine"
import { SearchResults } from "@/components/search/search-results"
import { SearchFilters } from "@/components/search/search-filters"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { InternalLinks } from "@/components/seo/internal-links"
import { LocalLanding } from "@/components/seo/local-landing"
import { getPublicAppUrl } from "@/lib/env"
import { getCategories, getLocalListing } from "@/lib/queries"
import {
  organizationSchema, websiteSchema, breadcrumbSchema, itemListSchema, faqSchema, safeJsonLd,
} from "@/lib/seo/schema"
import { generateMeta } from "@/lib/seo/meta"
import { sanitizeSeoContent } from "@/lib/seo/content"
import {
  resolveLocal, countLocalProfiles, zoneHeroImage, MIN_INDEXABLE_PROFILES,
  type ZoneRecord, type NeighborhoodRecord,
} from "@/lib/seo/local"

interface Props {
  params: Promise<{ municipio: string; seg: string }>
}

const BASE_URL = getPublicAppUrl()

export async function generateMetadata({ params }: Props) {
  const { municipio, seg } = await params
  try {
    const r = await resolveLocal(municipio, seg)
    if (!r || r.kind === "none") return { title: "No encontrado" }

    if (r.kind === "category") {
      const slug = `${municipio}/${seg}`
      const seoPage = await prisma.seoLandingPage.findUnique({ where: { slug } })
      const title = seoPage?.title || `${r.category.name} en ${r.municipality.name} | Guía ZMG`
      const description =
        seoPage?.metaDescription ||
        `Encuentra los mejores ${r.category.name.toLowerCase()} en ${r.municipality.name}. Consulta teléfonos, WhatsApp, horarios, ubicación y reseñas.`
      return generateMeta({ title, description, canonical: `${BASE_URL}/${municipio}/${seg}` })
    }

    if (r.kind === "zone") {
      const count = await countLocalProfiles({ municipalityId: r.municipality.id, zoneId: r.zone.id })
      const noindex = !r.zone.isSeoIndexable || count < MIN_INDEXABLE_PROFILES
      const title = r.zone.seoTitle || `Negocios y servicios en ${r.zone.name}, ${r.municipality.name} | Guía ZMG`
      const description =
        r.zone.seoDescription ||
        `Encuentra negocios, emprendedores, servicios, productos y promociones en ${r.zone.name}, ${r.municipality.name} y colonias cercanas.`
      return generateMeta({ title, description, canonical: `${BASE_URL}/${municipio}/${seg}`, noindex })
    }

    // neighborhood
    const count = await countLocalProfiles({ municipalityId: r.municipality.id, neighborhoodId: r.neighborhood.id })
    const noindex = !r.neighborhood.isSeoIndexable || count < MIN_INDEXABLE_PROFILES
    const title = r.neighborhood.seoTitle || `Negocios y servicios en ${r.neighborhood.name}, ${r.municipality.name} | Guía ZMG`
    const description =
      r.neighborhood.seoDescription ||
      `Busca negocios, servicios, productos y promociones cerca de ${r.neighborhood.name}, ${r.municipality.name}. Contacta por WhatsApp.`
    return generateMeta({ title, description, canonical: `${BASE_URL}/${municipio}/${seg}`, noindex })
  } catch {
    return { title: "Guía ZMG" }
  }
}

export default async function LocalSegmentPage({ params }: Props) {
  const { municipio, seg } = await params
  const r = await resolveLocal(municipio, seg)
  if (!r || r.kind === "none") notFound()

  if (r.kind === "category") return renderCategory(municipio, seg, r.municipality, r.category)
  if (r.kind === "zone") return renderZone(municipio, r.municipality, r.zone)
  return renderNeighborhood(municipio, r.municipality, r.neighborhood)
}

// ── Rama CATEGORÍA (municipio + categoría) — comportamiento previo ────────────
async function renderCategory(
  munSlug: string,
  catSlug: string,
  municipio: { id: string; name: string; slug: string },
  category: { id: string; name: string; slug: string; icon: string | null; description: string | null },
) {
  const slug = `${munSlug}/${catSlug}`
  const [seoPage, categories, municipalities, results] = await Promise.all([
    prisma.seoLandingPage.findUnique({ where: { slug, isActive: true } }),
    getCategories(),
    import("@/lib/queries").then((m) => m.getMunicipalities()),
    search({ category: catSlug, municipality: munSlug, limit: 24 }),
  ])

  const title = seoPage?.title || `${category.name} en ${municipio.name}`
  const description =
    seoPage?.metaDescription ||
    `Encuentra los mejores ${category.name.toLowerCase()} en ${municipio.name}, Jalisco. Teléfonos, direcciones, horarios y reseñas.`

  const breadcrumbItems = [
    { name: "Inicio", href: "/" },
    { name: municipio.name, href: `/${munSlug}` },
    { name: category.name },
  ]
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema(),
      websiteSchema(),
      breadcrumbSchema([
        { name: "Inicio", url: BASE_URL },
        { name: municipio.name, url: `${BASE_URL}/${munSlug}` },
        { name: category.name, url: `${BASE_URL}/${munSlug}/${catSlug}` },
      ]),
    ],
  }
  const seoContent = seoPage?.content ? sanitizeSeoContent(seoPage.content) : ""

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={breadcrumbItems} />
            {seoContent ? (
              <div className="mt-4 max-w-none whitespace-pre-line text-lg leading-8 text-blue-100">{seoContent}</div>
            ) : (
              <>
                <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
                <p className="mt-2 text-lg text-blue-100">{description}</p>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            <div className="hidden lg:block">
              <SearchFilters categories={categories as any} municipalities={municipalities as any} />
            </div>
            <div className="space-y-8 lg:col-span-3">
              <SearchResults results={results} />
              <InternalLinks
                currentMunicipio={{ slug: munSlug, name: municipio.name }}
                currentCategory={{ slug: catSlug, name: category.name }}
              />
            </div>
          </div>
        </div>

        <div className="border-t bg-gray-50 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <h3 className="font-semibold text-gray-900">Categorías populares</h3>
                <ul className="mt-3 space-y-2">
                  {categories.slice(0, 8).map((cat: any) => (
                    <li key={cat.slug}>
                      <Link href={`/${munSlug}/${cat.slug}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                        {cat.name} en {municipio.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Municipios</h3>
                <ul className="mt-3 space-y-2">
                  {municipalities.slice(0, 8).map((mun: any) => (
                    <li key={mun.slug}>
                      <Link href={`/${mun.slug}/${catSlug}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                        {category.name} en {mun.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Acerca de Guía ZMG</h3>
                <p className="mt-3 text-sm text-gray-600">
                  El directorio de negocios más completo de la Zona Metropolitana de Guadalajara. Encuentra{" "}
                  {category.name.toLowerCase()}, compara opciones y elige el mejor servicio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

// ── Rama ZONA ────────────────────────────────────────────────────────────────
async function renderZone(
  munSlug: string,
  municipio: { id: string; name: string; slug: string },
  zone: ZoneRecord,
) {
  const [results, categories, colonias, nearbyZones] = await Promise.all([
    getLocalListing({ municipalityId: municipio.id, zoneId: zone.id, limit: 24 }),
    getCategories(),
    prisma.neighborhood.findMany({
      where: { zoneId: zone.id, isActive: true },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
      take: 18,
    }),
    zone.nearbyZoneSlugs?.length
      ? prisma.zone.findMany({
          where: { municipalityId: municipio.id, slug: { in: zone.nearbyZoneSlugs }, isActive: true },
          select: { name: true, slug: true },
        })
      : Promise.resolve([] as { name: string; slug: string }[]),
  ])

  const categoryLinks = categories.slice(0, 8).map((c: any) => ({
    name: c.name,
    icon: c.icon,
    href: `/${munSlug}/${zone.slug}/${c.slug}`,
  }))
  const nearbyLinks = [
    ...colonias.map((c) => ({ name: c.name, href: `/${munSlug}/${c.slug}` })),
    ...nearbyZones.map((z) => ({ name: `${z.name} (zona)`, href: `/${munSlug}/${z.slug}` })),
  ]

  const h1 = `Negocios y servicios en ${zone.name}, ${municipio.name}`
  const intro =
    zone.description ||
    `Encuentra negocios, emprendedores, servicios, productos y promociones en ${zone.name} y colonias cercanas.`

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: BASE_URL },
    { name: municipio.name, url: `${BASE_URL}/${munSlug}` },
    { name: zone.name, url: `${BASE_URL}/${munSlug}/${zone.slug}` },
  ])
  const itemListLd = itemListSchema(
    zone.name,
    results.businesses.map((b: any) => ({ name: b.name, url: `${BASE_URL}/perfil/${b.slug}` })),
  )
  const faqLd = faqSchema([
    {
      question: `¿Qué negocios y servicios hay en ${zone.name}?`,
      answer: `En ${zone.name}, ${municipio.name}, encuentras negocios locales, emprendedores y prestadores de servicios: comida, hogar, salud, belleza, reparaciones y más. Todos con contacto directo por WhatsApp, teléfono y ubicación.`,
    },
    {
      question: `¿Cómo aparezco con mi negocio en ${zone.name}?`,
      answer: `Crea tu perfil de Emprendedor o Negocio en Guía ZMG, indica que atiendes en ${zone.name} y aparecerás cuando los vecinos busquen tus productos o servicios en la zona.`,
    },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }} />
      <LocalLanding
        breadcrumb={[
          { name: "Inicio", href: "/" },
          { name: municipio.name, href: `/${munSlug}` },
          { name: zone.name },
        ]}
        h1={h1}
        intro={intro}
        heroImage={zoneHeroImage(munSlug, zone)}
        results={results as any}
        municipioSlug={munSlug}
        municipioName={municipio.name}
        categoryLinks={categoryLinks}
        nearbyTitle={`Colonias y zonas cercanas`}
        nearbyLinks={nearbyLinks}
        placeName={zone.name}
      />
    </>
  )
}

// ── Rama COLONIA ─────────────────────────────────────────────────────────────
async function renderNeighborhood(
  munSlug: string,
  municipio: { id: string; name: string; slug: string },
  colonia: NeighborhoodRecord,
) {
  const [results, categories, siblings] = await Promise.all([
    getLocalListing({ municipalityId: municipio.id, neighborhoodId: colonia.id, limit: 24 }),
    getCategories(),
    colonia.zoneId
      ? prisma.neighborhood.findMany({
          where: { zoneId: colonia.zoneId, isActive: true, id: { not: colonia.id } },
          select: { name: true, slug: true },
          orderBy: { name: "asc" },
          take: 14,
        })
      : Promise.resolve([] as { name: string; slug: string }[]),
  ])

  const categoryLinks = categories.slice(0, 8).map((c: any) => ({
    name: c.name,
    icon: c.icon,
    href: `/${munSlug}/${colonia.slug}/${c.slug}`,
  }))
  const nearbyLinks = [
    ...(colonia.zone ? [{ name: `Toda ${colonia.zone.name}`, href: `/${munSlug}/${colonia.zone.slug}` }] : []),
    ...siblings.map((s: { name: string; slug: string }) => ({ name: s.name, href: `/${munSlug}/${s.slug}` })),
  ]

  const h1 = `Negocios y servicios en ${colonia.name}, ${municipio.name}`
  const intro = `Busca negocios, servicios, productos y promociones cerca de ${colonia.name}${
    colonia.zone ? `, en ${colonia.zone.name}` : ""
  }, ${municipio.name}.`

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: BASE_URL },
    { name: municipio.name, url: `${BASE_URL}/${munSlug}` },
    ...(colonia.zone ? [{ name: colonia.zone.name, url: `${BASE_URL}/${munSlug}/${colonia.zone.slug}` }] : []),
    { name: colonia.name, url: `${BASE_URL}/${munSlug}/${colonia.slug}` },
  ])
  const itemListLd = itemListSchema(
    colonia.name,
    results.businesses.map((b: any) => ({ name: b.name, url: `${BASE_URL}/perfil/${b.slug}` })),
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }} />
      <LocalLanding
        breadcrumb={[
          { name: "Inicio", href: "/" },
          { name: municipio.name, href: `/${munSlug}` },
          ...(colonia.zone ? [{ name: colonia.zone.name, href: `/${munSlug}/${colonia.zone.slug}` }] : []),
          { name: colonia.name },
        ]}
        h1={h1}
        intro={intro}
        heroImage={colonia.heroImageUrl || (colonia.zone ? `/zonas/${munSlug}/${colonia.zone.slug}.jpg` : null)}
        results={results as any}
        municipioSlug={munSlug}
        municipioName={municipio.name}
        categoryLinks={categoryLinks}
        nearbyTitle="Colonias cercanas"
        nearbyLinks={nearbyLinks}
        placeName={colonia.name}
      />
    </>
  )
}
