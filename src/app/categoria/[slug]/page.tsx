export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SearchResults } from "@/components/search/search-results"
import { prisma } from "@/lib/prisma"
import { searchBusinesses } from "@/lib/queries"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { page: pageStr } = await searchParams
  const page = pageStr ? parseInt(pageStr) : 1

  const category = await prisma.category.findUnique({
    where: { slug },
    include: { subcategories: true },
  })

  if (!category) notFound()

  const results = await searchBusinesses({
    category: category.id,
    page,
    limit: 20,
  })

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
