import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Search, Home } from "@/lib/icons"

export default function NotFoundPage() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Página no encontrada
          </h1>
          <p className="text-gray-500 mb-8">
            La página que buscas no existe o ha sido movida.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              Ir al inicio
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <Search className="h-4 w-4" />
              Buscar negocios
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
