// Índice público de zonas hiperlocales, agrupadas por municipio. ISR 5 min.
export const revalidate = 300

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { prisma } from "@/lib/prisma"
import { getPublicAppUrl } from "@/lib/env"
import { MapPin } from "@/lib/icons"

export async function generateMetadata() {
  const baseUrl = getPublicAppUrl()
  const title = "Zonas de la Zona Metropolitana de Guadalajara"
  const description =
    "Explora negocios, servicios y emprendedores por zona en Guadalajara, Zapopan, Tlaquepaque, Tonalá y Tlajomulco. Encuentra lo que buscas cerca de ti."
  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `${baseUrl}/zonas` },
  }
}

type ZoneRow = { name: string; slug: string; description: string | null; _count: { neighborhoods: number } }

export default async function ZonasIndexPage() {
  let grouped: { municipio: string; slug: string; zones: ZoneRow[] }[] = []
  try {
    const munis = await prisma.municipality.findMany({
      where: { isActive: true, zones: { some: { isActive: true } } },
      orderBy: { name: "asc" },
      select: {
        name: true,
        slug: true,
        zones: {
          where: { isActive: true },
          orderBy: [{ priority: "desc" }, { name: "asc" }],
          select: { name: true, slug: true, description: true, _count: { select: { neighborhoods: true } } },
        },
      },
    })
    grouped = munis.map((m) => ({ municipio: m.name, slug: m.slug, zones: m.zones }))
  } catch {
    // tabla zones aún no migrada
  }

  const totalZones = grouped.reduce((n, g) => n + g.zones.length, 0)

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-green-700 to-emerald-900 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="mb-3 text-sm text-green-100">
              <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
              <span className="mx-2">/</span>
              <span className="font-medium text-white">Zonas</span>
            </nav>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Explora por zona</h1>
            <p className="mt-2 max-w-2xl text-lg text-green-50">
              Encuentra negocios, servicios y emprendedores cerca de ti, por zona de la Zona Metropolitana de Guadalajara.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {totalZones === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-500">
              Aún no hay zonas publicadas. Vuelve pronto.
            </p>
          ) : (
            <div className="space-y-10">
              {grouped.map((g) => (
                <section key={g.slug}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">{g.municipio}</h2>
                    <Link href={`/${g.slug}`} className="text-sm font-medium text-green-700 hover:underline">
                      Ver todo {g.municipio} →
                    </Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.zones.map((z) => (
                      <Link
                        key={z.slug}
                        href={`/${g.slug}/${z.slug}`}
                        className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-green-200 hover:shadow-md"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-gray-900 group-hover:text-green-700">{z.name}</span>
                        </div>
                        {z.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-gray-500">{z.description}</p>
                        )}
                        <span className="mt-3 text-xs text-gray-400">
                          {z._count.neighborhoods} colonia{z._count.neighborhoods !== 1 ? "s" : ""}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
