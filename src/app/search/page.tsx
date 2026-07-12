export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SearchResults } from "@/components/search/search-results"
import { SearchFilters } from "@/components/search/search-filters"
import { SearchBarSection } from "@/components/search/search-bar-section"
import { search, type SearchParams } from "@/lib/search/search-engine"
import { getCategories, getMunicipalities } from "@/lib/queries"

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    municipio?: string
    colonia?: string
    subcategory?: string
    lat?: string
    lng?: string
    sort?: string
    openNow?: string
    verified?: string
    premium?: string
    minRating?: string
    maxDistance?: string
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams

  const searchOpts: SearchParams = {
    q: params.q,
    category: params.category,
    municipality: params.municipio,
    neighborhood: params.colonia,
    subcategory: params.subcategory,
    lat: params.lat ? parseFloat(params.lat) : undefined,
    lng: params.lng ? parseFloat(params.lng) : undefined,
    // Si hay coordenadas y no se pidió otro orden, ordena por cercanía.
    sort: (params.sort as any) || (params.lat && params.lng ? "distance" : "relevance"),
    isOpenNow: params.openNow === "true",
    isVerified: params.verified === "true",
    isPremium: params.premium === "true",
    minRating: params.minRating ? parseFloat(params.minRating) : undefined,
    maxDistance: params.maxDistance ? parseFloat(params.maxDistance) : undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  }

  const [results, categories, municipalities] = await Promise.all([
    search(searchOpts),
    getCategories(),
    getMunicipalities(),
  ])

  return (
    <>
      <Header />
      <main className="flex-1">
        <SearchBarSection initialQuery={params.q || ""} />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            <div className="hidden lg:block">
              <SearchFilters categories={categories as any} municipalities={municipalities as any} />
            </div>
            <div className="lg:col-span-3">
              <SearchResults
                results={results}
                query={params.q}
                municipio={params.municipio}
                category={params.category}
                sort={searchOpts.sort}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
