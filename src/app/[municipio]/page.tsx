export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { prisma } from "@/lib/prisma"
import { search } from "@/lib/search/search-engine"
import { SearchResults } from "@/components/search/search-results"
import { SearchFilters } from "@/components/search/search-filters"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  params: Promise<{ municipio: string }>
}

export async function generateMetadata({ params }: Props) {
  const { municipio: munSlug } = await params
  try {
    const municipio = await prisma.municipality.findUnique({ where: { slug: munSlug } })
    if (!municipio) return { title: "No encontrado" }
    const title = `Perfiles en ${municipio.name} | Guía ZMG`
    const description = `Encuentra los mejores perfiles y servicios en ${municipio.name}, Jalisco. Directorio completo con teléfonos, direcciones y reseñas.`
    return { title, description, openGraph: { title, description } }
  } catch {
    // BD no disponible (p. ej. durante el build): no rompas, usa título genérico.
    return { title: "Guía ZMG" }
  }
}

export default async function SeoCityPage({ params }: Props) {
  const { municipio: munSlug } = await params

  const [municipio, categories, neighborhoods, municipalities] = await Promise.all([
    prisma.municipality.findUnique({ where: { slug: munSlug } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.neighborhood.findMany({
      where: { municipality: { slug: munSlug }, isActive: true },
      orderBy: { name: "asc" },
    }),
    import("@/lib/queries").then((m) => m.getMunicipalities()),
  ])

  if (!municipio) notFound()

  const results = await search({ municipality: munSlug, limit: 24 })

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="mb-4 text-sm text-blue-100">
              <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
              <span className="mx-2">/</span>
              <span className="text-white font-medium">{municipio.name}</span>
            </nav>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Perfiles en {municipio.name}
            </h1>
            <p className="mt-2 text-lg text-blue-100">
              Encuentra los mejores perfiles y servicios en {municipio.name}, Jalisco.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Categorías en {municipio.name}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/${munSlug}/${cat.slug}`}>
                  <Card className="group h-full transition-all hover:shadow-md hover:border-blue-200 cursor-pointer">
                    <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                      {cat.icon && <span className="text-2xl mb-2">{cat.icon}</span>}
                      <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {cat.name}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {neighborhoods.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Colonias en {municipio.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {neighborhoods.map((n) => (
                  <Link
                    key={n.id}
                    href={`/search?municipio=${munSlug}&colonia=${n.slug}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {n.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            <div className="hidden lg:block">
              <SearchFilters
                categories={[] as any}
                municipalities={municipalities as any}
              />
            </div>
            <div className="lg:col-span-3">
              <SearchResults results={results} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
