export const revalidate = 300

import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SearchResults } from "@/components/search/search-results"
import { getProfilesByType } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Emprendedores en Guadalajara | Guía ZMG",
  description:
    "Descubre emprendedores locales de la Zona Metropolitana de Guadalajara: comida casera, catálogo, servicios a domicilio y más. Contáctalos por WhatsApp.",
}

export default async function EmprendedoresPage() {
  const results = await getProfilesByType("EMPRENDEDOR", 1, 20)

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Emprendedores</h1>
            <p className="mt-2 text-gray-600">
              Personas que venden por pedido, catálogo, a domicilio o por WhatsApp en tu zona.
            </p>
          </div>

          {results.total === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-gray-500">Aún no hay emprendedores publicados.</p>
              <Link href="/onboarding/vendedor" className="mt-3 inline-block font-medium text-green-700 hover:underline">
                ¿Vendes algo? Crea tu perfil de Emprendedor →
              </Link>
            </div>
          ) : (
            <SearchResults results={results as any} query="Emprendedores" />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
