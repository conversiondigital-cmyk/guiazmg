// ISR: landing de categoría cacheada y prefetchable (regenerada cada 5 min).
export const revalidate = 300

import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SearchResults } from "@/components/search/search-results"
import { prisma } from "@/lib/prisma"
import { getCategoryListing } from "@/lib/queries"
import { getPublicAppUrl } from "@/lib/env"
import { breadcrumbSchema, safeJsonLd } from "@/lib/seo/schema"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await prisma.category.findUnique({ where: { slug }, select: { name: true, description: true } })
  if (!category) return { title: "Categoría no encontrada" }
  const title = `${category.name} en Guadalajara y la ZMG`
  const description =
    category.description ||
    `Directorio de ${category.name} en Guadalajara, Zapopan, Tlaquepaque, Tonalá y Tlajomulco. Teléfonos, WhatsApp, ubicación, horarios y reseñas.`
  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/categoria/${slug}` },
  }
}

// Prebuild de todas las categorías activas (son pocas) → páginas estáticas desde el build.
export async function generateStaticParams() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    })
    return categories.map((c) => ({ slug: c.slug }))
  } catch {
    return []
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  const category = await prisma.category.findUnique({
    where: { slug },
    include: { subcategories: true },
  })

  if (!category) notFound()

  const results = await getCategoryListing(category.id, 1, 20)

  const baseUrl = getPublicAppUrl()
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: baseUrl },
    { name: category.name, url: `${baseUrl}/categoria/${category.slug}` },
  ])
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.name,
    itemListElement: (results.businesses as { slug: string; name: string }[]).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/perfil/${b.slug}`,
      name: b.name,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }} />
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {category.icon && <span className="mr-2">{category.icon}</span>}
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-1 text-gray-500">{category.description}</p>
            )}
          </div>
          <SearchResults results={results as any} query={category.name} />
        </div>
      </main>
      <Footer />
    </>
  )
}
