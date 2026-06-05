"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error("Auth error:", error) }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-sm px-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error de autenticación</h2>
        <p className="text-gray-500 mb-6">Ocurrió un error. Por favor intenta de nuevo.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
          <Link
            href="/auth/login"
            className="rounded-xl border border-gray-300 px-6 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Ir al login
          </Link>
        </div>
      </div>
    </div>
  )
}
