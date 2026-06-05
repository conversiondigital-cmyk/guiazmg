"use client"

import { Geist, Geist_Mono } from "next/font/google"

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="text-8xl font-bold text-red-500 mb-4">!</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error crítico del sistema
          </h1>
          <p className="text-gray-500 mb-8">
            Ocurrió un error inesperado. Nuestro equipo ha sido notificado.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  )
}
