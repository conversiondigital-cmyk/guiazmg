export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

const FAQ_TEMPLATES: Record<string, { q: string; a: string }[]> = {
  default: [
    { q: "¿Cómo encuentro negocios cerca de mí?", a: "Usa el buscador en la página principal o navega por categorías y municipios para encontrar negocios locales en tu zona." },
    { q: "¿Cómo registró mi negocio?", a: "Crea una cuenta, ve a tu dashboard y selecciona 'Agregar negocio'. Completa los datos y espera la revisión." },
    { q: "¿Cuánto cuesta aparecer en Guía ZMG?", a: "Ofrecemos planes desde $149/mes. El perfil básico es gratuito." },
    { q: "¿Cómo puedo promocionar mi negocio?", a: "Puedes activar Boosts para destacar tu negocio en las búsquedas con pago directo." },
  ],
}

function buildFaqs(categoryName: string, locationName: string): { q: string; a: string }[] {
  return [
    { q: `¿Cuáles son los mejores ${categoryName || "servicios"} en ${locationName || "la zona"}?`, a: `En Guía ZMG encuentras una lista actualizada de los mejores ${categoryName?.toLowerCase() || "servicios"} en ${locationName || "tu zona"}, con reseñas, horarios y datos de contacto.` },
    { q: `¿Cuánto cuesta un ${categoryName?.toLowerCase() || "servicio"} en ${locationName || "la zona"}?`, a: `Los precios varían según el negocio. Te recomendamos comparar varios ${categoryName?.toLowerCase() || "servicios"} en ${locationName || "tu zona"} para encontrar la mejor opción.` },
    { q: `¿Qué ${categoryName?.toLowerCase() || "servicios"} hay en ${locationName || "la zona"}?`, a: `En Guía ZMG puedes explorar todos los ${categoryName?.toLowerCase() || "servicios"} disponibles en ${locationName || "tu zona"}, ordenados por cercanía y popularidad.` },
    { q: `¿Cómo elegir un ${categoryName?.toLowerCase() || "servicio"} en ${locationName || "la zona"}?`, a: `Revisa las reseñas de otros usuarios, compara precios y horarios, y elige el negocio que mejor se adapte a tus necesidades.` },
    { q: `¿Hay ${categoryName?.toLowerCase() || "servicios"} cerca de ${locationName || "mi ubicación"}?`, a: `Usa el buscador de Guía ZMG para encontrar ${categoryName?.toLowerCase() || "servicios"} cerca de ${locationName || "tu ubicación"} con resultados ordenados por distancia.` },
    { q: `¿Cómo contactar a un ${categoryName?.toLowerCase() || "servicio"} en ${locationName || "la zona"}?`, a: `Cada perfil de negocio en Guía ZMG incluye teléfono, WhatsApp y ubicación para que puedas contactarlos directamente.` },
  ]
}

export default async function FAQPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  if (!slug || slug.length === 0) notFound()

  const categorySlug = slug[0]
  const locationSlug = slug.slice(1).join("-")

  const category = categorySlug ? await prisma.category.findFirst({ where: { slug: categorySlug } }) : null
  const municipality = locationSlug ? await prisma.municipality.findFirst({ where: { slug: locationSlug } }) : null
  const neighborhood = locationSlug ? await prisma.neighborhood.findFirst({ where: { slug: locationSlug } }) : null
  const location = municipality || neighborhood
  const categoryName = category?.name || categorySlug
  const locationName = location?.name || locationSlug

  const faqs = category ? buildFaqs(categoryName, locationName) : FAQ_TEMPLATES.default

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-1">
          <Link href="/" className="hover:text-blue-600">Inicio</Link>
          {" / "}
          <Link href="/preguntas" className="hover:text-blue-600">Preguntas Frecuentes</Link>
          {category && <span> / {categoryName}{location ? ` en ${locationName}` : ""}</span>}
        </p>
        <h1 className="text-3xl font-bold mt-2">
          Preguntas frecuentes sobre {categoryName?.toLowerCase()}{location ? ` en ${locationName}` : ""}
        </h1>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details key={i} className="group rounded-lg border p-4 [&[open]]:border-blue-200">
            <summary className="cursor-pointer font-medium text-sm flex items-center justify-between">
              {faq.q}
              <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg text-center">
        <h2 className="font-semibold text-lg mb-2">¿No encuentras lo que buscas?</h2>
        <p className="text-sm text-gray-600 mb-4">Usa nuestro buscador para encontrar negocios, servicios y productos cerca de ti.</p>
        <Link href={`/search?q=${categoryName || ""}`} className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          Buscar {categoryName?.toLowerCase() || "servicios"}
        </Link>
      </div>
    </div>
  )
}
