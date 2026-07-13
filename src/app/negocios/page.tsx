export const revalidate = 300

import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SearchResults } from "@/components/search/search-results"
import { getProfilesByType } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Negocios en Guadalajara | Guía ZMG",
  description:
    "Directorio de negocios y servicios profesionales de la Zona Metropolitana de Guadalajara: talleres, clínicas, restaurantes, cerrajeros y más.",
}

export default async function NegociosPage() {
  const results = await getProfilesByType("NEGOCIO", 1, 20)

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Negocios</h1>
            <p className="mt-2 text-gray-600">
              Comercios y servicios profesionales locales: horarios, ubicación, reseñas y contacto.
            </p>
          </div>

          {results.total === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-gray-500">Aún no hay negocios publicados.</p>
              <Link href="/onboarding/vendedor" className="mt-3 inline-block font-medium text-green-700 hover:underline">
                ¿Tienes un negocio? Regístralo →
              </Link>
            </div>
          ) : (
            <SearchResults results={results as any} query="Negocios" />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
