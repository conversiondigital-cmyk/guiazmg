"use client"

import { useEffect } from "react"
import { AlertTriangle, Home, RefreshCw } from "@/lib/icons"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Page error:", error)
  }, [error])

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Algo salió mal
          </h1>
          <p className="text-gray-500 mb-8">
            Ocurrió un error al cargar esta página. Por favor intenta de nuevo.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Intentar de nuevo
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4" />
              Ir al inicio
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
