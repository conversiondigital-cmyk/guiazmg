import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Search, Home, MapPin } from "@/lib/icons"

const POPULAR = ["Restaurantes", "Salud", "Talleres", "Belleza", "Cafeterías"]

export default function NotFoundPage() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700">
            <MapPin className="h-9 w-9" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            No encontramos lo que buscas
          </h1>
          <p className="mb-8 text-gray-500">
            Puede que el negocio o la página ya no esté disponible, o que el enlace haya
            cambiado. Te ayudamos a encontrar lo que necesitas en Guía ZMG.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-medium text-white transition-colors hover:bg-green-800"
            >
              <Home className="h-4 w-4" />
              Ir al inicio
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-white"
            >
              <Search className="h-4 w-4" />
              Explorar el directorio
            </Link>
          </div>

          <div className="mt-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Búsquedas populares
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-700 transition-colors hover:border-green-300 hover:text-green-800"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
