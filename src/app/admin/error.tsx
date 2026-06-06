"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[ADMIN_ERROR]", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex gap-4">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-red-900 mb-2">
                Error en el panel administrativo
              </h1>
              <p className="text-sm text-red-700 mb-4">
                Ocurrió un error inesperado. Por favor intenta de nuevo.
              </p>
              <div className="bg-red-100 rounded p-3 mb-4 text-xs text-red-800 font-mono overflow-auto max-h-32 border border-red-200">
                <p className="font-bold mb-1">Detalles del error:</p>
                {error.message || "Error desconocido"}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => reset()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Reintentar
                </Button>
                <Button
                  onClick={() => window.location.href = "/admin"}
                  variant="outline"
                  size="sm"
                >
                  Ir al inicio
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
