// ISR: landing de categoría cacheada y prefetchable (regenerada cada 5 min).
export const revalidate = 300

import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SearchResults } from "@/components/search/search-results"
import { prisma } from "@/lib/prisma"
import { getCategoryListing } from "@/lib/queries"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
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

  return (
    <>
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
