import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { MapPin, ArrowRight } from "@/lib/icons"

// Sección de inicio: "Explora por zona". Muestra las zonas de mayor prioridad y
// enlaza a la página completa /zonas. Se auto-consulta (server component) y si no
// hay zonas (o la tabla no existe aún) no renderiza nada.
export async function ZonesSection() {
  let zones: { name: string; slug: string; municipality: { name: string; slug: string } }[] = []
  try {
    zones = await prisma.zone.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
      take: 12,
      select: { name: true, slug: true, municipality: { select: { name: true, slug: true } } },
    })
  } catch {
    return null
  }
  if (zones.length === 0) return null

  return (
    <section className="border-t border-gray-100 bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#003527] md:text-3xl">Explora por zona</h2>
            <p className="mt-1 text-gray-500">
              Encuentra negocios y servicios cerca de ti, por zona de la Zona Metropolitana de Guadalajara.
            </p>
          </div>
          <Link
            href="/zonas"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 sm:inline-flex"
          >
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {zones.map((z) => (
            <Link
              key={`${z.municipality.slug}-${z.slug}`}
              href={`/${z.municipality.slug}/${z.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-green-200 hover:shadow-md"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-900 group-hover:text-green-700">
                  {z.name}
                </span>
                <span className="block truncate text-xs text-gray-400">{z.municipality.name}</span>
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/zonas"
          className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 sm:hidden"
        >
          Ver todas las zonas <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
