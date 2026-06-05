import Link from "next/link"

export const dynamic = "force-dynamic"

export default function PreguntasPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Preguntas frecuentes</h1>
      <p className="mt-2 text-gray-600">Respuestas rápidas sobre cómo usar Guía ZMG.</p>
      <div className="mt-8 space-y-4">
        <Link href="/preguntas/general" className="block rounded-lg border p-4 hover:border-blue-200">
          Ver preguntas generales
        </Link>
        <Link href="/preguntas/marketplace" className="block rounded-lg border p-4 hover:border-blue-200">
          Ver preguntas sobre marketplace
        </Link>
      </div>
    </div>
  )
}
