"use client"

import { useEffect } from "react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error("Admin error:", error) }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Error administrativo</h2>
      <p className="text-gray-500 mb-6">Ocurrió un error al cargar esta página.</p>
      <button
        onClick={reset}
        className="rounded-xl bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}
