export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { search } from "@/lib/search/search-engine"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SearchResults } from "@/components/search/search-results"
import { SearchFilters } from "@/components/search/search-filters"
import { Metadata } from "next"

interface Props {
  params: Promise<{ seoSlug: string[] }>
}

function titleize(s: string) {
  return s
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const segments = (await params).seoSlug || []
  if (segments.length !== 1) return { title: "No encontrado", robots: { index: false, follow: false } }
  const slug = segments[0]

  const [categorySlug, locationSlug] = slug.split("-")
  if (!categorySlug || !locationSlug) return { title: "No encontrado", robots: { index: false, follow: false } }

  try {
    const category = await prisma.category.findFirst({ where: { slug: categorySlug, isActive: true } })
    const municipality = await prisma.municipality.findFirst({ where: { slug: locationSlug, isActive: true } })
    const neighborhood = !municipality ? await prisma.neighborhood.findFirst({ where: { slug: locationSlug, isActive: true }, include: { municipality: true } }) : null

    if (!category || (!municipality && !neighborhood)) {
      return { title: "No encontrado", robots: { index: false, follow: false } }
    }

    const locationName = municipality?.name || neighborhood?.name || titleize(locationSlug)
    const catName = category?.name || titleize(categorySlug)
    const munName = municipality?.name || neighborhood?.municipality?.name || ""

    const title = category ? `Mejores ${catName} en ${locationName}${munName ? `, ${munName}` : ""} | Guía ZMG`
      : `${titleize(slug)} en Guadalajara | Guía ZMG`
    const desc = category
      ? `Encuentra los mejores ${catName.toLowerCase()} en ${locationName}${munName ? `, ${munName}` : ""}. Teléfonos, direcciones, reseñas y más.`
      : `Encuentra ${titleize(slug)} en la Zona Metropolitana de Guadalajara. Directorio completo.`

    return { title, description: desc, openGraph: { title, description: desc } }
  } catch {
    // BD no disponible (p. ej. durante el build): no rompas.
    return { title: "Guía ZMG" }
  }
}

export default async function SeoLandingPage({ params }: Props) {
  const segments = (await params).seoSlug || []
  if (segments.length !== 1) notFound()

  const slug = segments[0]
  const [categorySlug, locationSlug] = slug.split("-")
  if (!categorySlug || !locationSlug) notFound()

  const [category, municipality, neighborhoodRow] = await Promise.all([
    prisma.category.findFirst({ where: { slug: categorySlug, isActive: true } }),
    prisma.municipality.findFirst({ where: { slug: locationSlug, isActive: true } }),
    prisma.neighborhood.findFirst({
      where: { slug: locationSlug, isActive: true },
      include: { municipality: true },
    }),
  ])

  if (!category) notFound()
  if (!municipality && !neighborhoodRow) notFound()

  const locationName = municipality?.name || neighborhoodRow?.name || ""
  const munSlug = municipality?.slug || neighborhoodRow?.municipality?.slug || ""
  const munName = municipality?.name || neighborhoodRow?.municipality?.name || ""
  const fullLocation = municipality ? `${municipality.name}, Jalisco` : `${neighborhoodRow?.name}, ${neighborhoodRow?.municipality.name}`

  const results = await search({
    category: categorySlug,
    municipality: munSlug,
    neighborhood: neighborhoodRow?.slug || undefined,
    limit: 24,
  })

  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })

  const faqs = [
    { q: `¿Cuál es el mejor ${category.name.toLowerCase()} en ${locationName}?`, a: `En Guía ZMG encuentras los mejores ${category.name.toLowerCase()} en ${fullLocation}. Compara reseñas, precios y servicios.` },
    { q: `¿Cuántos ${category.name.toLowerCase()} hay en ${locationName}?`, a: `Actualmente tenemos ${results.total} ${category.name.toLowerCase()} registrados en ${fullLocation}.` },
    { q: `¿Cómo elegir un ${category.name.toLowerCase()} en ${locationName}?`, a: `Revisa las reseñas de otros clientes, compara precios y verifica la ubicación en nuestro directorio.` },
  ]

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="mb-4 text-sm text-blue-100">
              <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
              <span className="mx-2">/</span>
              {municipality && <><Link href={`/${munSlug}`} className="hover:text-white transition-colors">{munName}</Link><span className="mx-2">/</span></>}
              <span className="text-white font-medium">{category.name} en {locationName}</span>
            </nav>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              {category.name} en {locationName}
            </h1>
            <p className="mt-2 text-lg text-blue-100">
              Encuentra los mejores {category.name.toLowerCase()} en {fullLocation}. {results.total} resultados disponibles.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            <div className="hidden lg:block">
              <SearchFilters categories={categories as any} municipalities={[] as any} />
            </div>
            <div className="lg:col-span-3 space-y-8">
              <SearchResults results={results} category={categorySlug} municipio={municipality?.slug || neighborhoodRow?.municipality?.slug} />

              <section className="prose prose-sm max-w-none">
                <h2 className="text-xl font-semibold">{category.name} en {locationName}: Guía Completa</h2>
                <p className="text-gray-600">
                  {locationName} cuenta con {results.total} {category.name.toLowerCase()} registrados en Guía ZMG.
                  {municipality ? ` ${municipality.name} es uno de los municipios más importantes de Jalisco con una amplia oferta de servicios profesionales.` : ""}
                  Utiliza nuestro directorio para encontrar el mejor {category.name.toLowerCase()} cerca de ti.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Preguntas Frecuentes</h2>
                <div className="space-y-3">
                  {faqs.map((faq, i) => (
                    <details key={i} className="rounded-lg border p-4">
                      <summary className="cursor-pointer font-medium text-sm">{faq.q}</summary>
                      <p className="mt-2 text-sm text-gray-600">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
