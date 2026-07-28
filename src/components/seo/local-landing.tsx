import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SearchResults } from "@/components/search/search-results"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin } from "@/lib/icons"
import type { SearchResponse } from "@/lib/search/search-engine"

export interface LocalLandingProps {
  /** Migas de pan (incluye el nodo actual sin href). */
  breadcrumb: { name: string; href?: string }[]
  h1: string
  intro: string
  /** Imagen característica de la zona (o null → degradado). */
  heroImage: string | null
  /** Resultados ya consultados (mismo shape que SearchResults). */
  results: SearchResponse
  /** Municipio para prefijar el buscador local. */
  municipioSlug: string
  municipioName: string
  /** Categorías relacionadas: enlaces ya construidos. */
  categoryLinks: { name: string; href: string; icon?: string | null }[]
  /** Bloque de lugares cercanos (colonias o zonas). */
  nearbyTitle: string
  nearbyLinks: { name: string; href: string }[]
  /** Nombre del lugar para el CTA de captación de negocios. */
  placeName: string
}

export function LocalLanding({
  breadcrumb,
  h1,
  intro,
  heroImage,
  results,
  municipioSlug,
  municipioName,
  categoryLinks,
  nearbyTitle,
  nearbyLinks,
  placeName,
}: LocalLandingProps) {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero con foto representativa de la zona (o degradado de respaldo). */}
        <div className="relative overflow-hidden bg-emerald-950">
          {heroImage ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
                aria-hidden
              />
              {/* Scrim para legibilidad: oscuro a la izquierda (donde va el texto) y
                  abajo, con un toque de verde de marca. */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" aria-hidden />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" aria-hidden />
              <div className="absolute inset-0 bg-emerald-950/25 mix-blend-multiply" aria-hidden />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-green-700 to-emerald-900" aria-hidden />
          )}
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-green-100/90">
              {breadcrumb.map((b, i) => (
                <span key={i} className="flex items-center gap-2">
                  {b.href ? (
                    <Link href={b.href} className="hover:text-white transition-colors">
                      {b.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-white">{b.name}</span>
                  )}
                  {i < breadcrumb.length - 1 && <span className="text-green-300/80">/</span>}
                </span>
              ))}
            </nav>
            <h1
              className="max-w-3xl text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
              style={{ textShadow: "0 2px 18px rgba(0,0,0,0.45)" }}
            >
              {h1}
            </h1>
            <p
              className="mt-3 max-w-2xl text-lg text-green-50"
              style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}
            >
              {intro}
            </p>

            {/* Buscador local */}
            <form action="/search" method="get" className="mt-6 flex max-w-xl overflow-hidden rounded-xl bg-white shadow-lg">
              <input type="hidden" name="municipio" value={municipioSlug} />
              <div className="flex flex-1 items-center gap-2 px-4">
                <Search className="h-5 w-5 shrink-0 text-gray-400" />
                <input
                  type="text"
                  name="q"
                  placeholder={`¿Qué buscas en ${placeName}?`}
                  className="w-full bg-transparent py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  aria-label={`Buscar en ${placeName}`}
                />
              </div>
              <button
                type="submit"
                className="bg-green-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-800"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-10">
            <div className="lg:col-span-2">
              <SearchResults results={results} />
            </div>

            <aside className="mt-10 space-y-8 lg:mt-0">
              {categoryLinks.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Categorías populares</h2>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {categoryLinks.map((c) => (
                      <Link key={c.href} href={c.href}>
                        <Card className="group h-full transition-all hover:border-green-200 hover:shadow-sm">
                          <CardContent className="flex items-center gap-2 p-3">
                            {c.icon && <span className="text-lg">{c.icon}</span>}
                            <span className="text-sm font-medium text-gray-800 group-hover:text-green-700">
                              {c.name}
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {nearbyLinks.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{nearbyTitle}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nearbyLinks.map((n) => (
                      <Link
                        key={n.href}
                        href={n.href}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {n.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>

        {/* CTA doble: captación de negocios + solicitud de usuarios. */}
        <div className="border-t bg-gray-50 py-12">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            <div className="rounded-2xl border border-green-100 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">¿Tienes un negocio en {placeName}?</h2>
              <p className="mt-2 text-gray-600">
                Crea tu perfil en Guía ZMG y aparece cuando tus vecinos busquen tus productos o servicios en {municipioName}.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/onboarding/vendedor?tipo=emprendedor"
                  className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
                >
                  Crear perfil Emprendedor
                </Link>
                <Link
                  href="/onboarding/vendedor?tipo=negocio"
                  className="rounded-lg border border-green-700 px-5 py-2.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
                >
                  Crear perfil Negocio
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">¿No encontraste lo que buscabas?</h2>
              <p className="mt-2 text-gray-600">
                Publica una solicitud y deja que los negocios de {placeName} te contacten con lo que necesitas.
              </p>
              <div className="mt-5">
                <Link
                  href="/marketplace/nuevo?type=REQUEST"
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  Crear solicitud
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
