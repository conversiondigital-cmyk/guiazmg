// ISR: landing SEO municipio+categoría cacheada, regenerada cada 5 min.
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
import { getPublicAppUrl } from "@/lib/env"
import { organizationSchema, websiteSchema, breadcrumbSchema, safeJsonLd } from "@/lib/seo/schema"
import { generateMeta } from "@/lib/seo/meta"
import { sanitizeSeoContent } from "@/lib/seo/content"

interface Props {
  params: Promise<{ municipio: string; categoria: string }>
}

const BASE_URL = getPublicAppUrl()

export async function generateMetadata({ params }: Props) {
  const { municipio: munSlug, categoria: catSlug } = await params
  const slug = `${munSlug}/${catSlug}`

  try {
    const [seoPage, municipio, category] = await Promise.all([
      prisma.seoLandingPage.findUnique({ where: { slug } }),
      prisma.municipality.findUnique({ where: { slug: munSlug } }),
      prisma.category.findUnique({ where: { slug: catSlug } }),
    ])

    if (!municipio || !category) return { title: "No encontrado" }

    const title = seoPage?.title || `${category.name} en ${municipio.name} | Guía ZMG`
    const description = seoPage?.metaDescription || `Encuentra los mejores ${category.name.toLowerCase()} en ${municipio.name}. Consulta teléfonos, WhatsApp, horarios, ubicación y reseñas.`

    return generateMeta({
      title,
      description,
      url: `${BASE_URL}/${munSlug}/${catSlug}`,
      canonical: `${BASE_URL}/${munSlug}/${catSlug}`,
    })
  } catch {
    // BD no disponible (p. ej. durante el build): no rompas.
    return { title: "Guía ZMG" }
  }
}

export default async function SeoCityCategoryPage({ params }: Props) {
  const { municipio: munSlug, categoria: catSlug } = await params
  const slug = `${munSlug}/${catSlug}`

  const [seoPage, municipio, category, categories, municipalities] = await Promise.all([
    prisma.seoLandingPage.findUnique({ where: { slug, isActive: true } }),
    prisma.municipality.findUnique({ where: { slug: munSlug } }),
    prisma.category.findUnique({ where: { slug: catSlug } }),
    import("@/lib/queries").then((m) => m.getCategories()),
    import("@/lib/queries").then((m) => m.getMunicipalities()),
  ])

  if (!municipio || !category) notFound()

  const results = await search({
    category: catSlug,
    municipality: munSlug,
    limit: 24,
  })

  const title = seoPage?.title || `${category.name} en ${municipio.name}`
  const description = seoPage?.metaDescription || `Encuentra los mejores ${category.name.toLowerCase()} en ${municipio.name}, Jalisco. Teléfonos, direcciones, horarios y reseñas.`

  const breadcrumbItems = [
    { name: "Inicio", href: "/" },
    { name: municipio.name, href: `/${munSlug}` },
    { name: category.name },
  ]

  const breadcrumbSchemaItems = [
    { name: "Inicio", url: BASE_URL },
    { name: municipio.name, url: `${BASE_URL}/${munSlug}` },
    { name: category.name, url: `${BASE_URL}/${munSlug}/${catSlug}` },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema(),
      websiteSchema(),
      breadcrumbSchema(breadcrumbSchemaItems),
    ],
  }
  const seoContent = seoPage?.content ? sanitizeSeoContent(seoPage.content) : ""

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={breadcrumbItems} />
            {seoContent ? (
              <div className="mt-4 max-w-none whitespace-pre-line text-lg leading-8 text-blue-100">
                {seoContent}
              </div>
            ) : (
              <>
                <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                  {title}
                </h1>
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
            <div className="lg:col-span-3 space-y-8">
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
                      <Link
                        href={`/${munSlug}/${cat.slug}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
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
                      <Link
                        href={`/${mun.slug}/${catSlug}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {category.name} en {mun.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Acerca de Guía ZMG</h3>
                <p className="mt-3 text-sm text-gray-600">
                  El directorio de negocios más completo de la Zona Metropolitana de Guadalajara.
                  Encuentra {category.name.toLowerCase()}, compara opciones y elige el mejor servicio.
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
