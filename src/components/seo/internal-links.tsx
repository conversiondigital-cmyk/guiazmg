import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ArrowRight, MapPin, Store } from "@/lib/icons"

interface InternalLinksProps {
  currentMunicipio: { slug: string; name: string }
  currentCategory: { slug: string; name: string }
}

export async function InternalLinks({ currentMunicipio, currentCategory }: InternalLinksProps) {
  const [categories, municipalities] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.municipality.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ])

  const otherCategories = categories.filter((c) => c.slug !== currentCategory.slug)
  const otherMunicipios = municipalities.filter((m) => m.slug !== currentMunicipio.slug)

  return (
    <div className="space-y-8">
      {otherCategories.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" />
            También en {currentMunicipio.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${currentMunicipio.slug}/${cat.slug}`}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {cat.name}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {otherMunicipios.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            {currentCategory.name} en otros municipios
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherMunicipios.map((mun) => (
              <Link
                key={mun.slug}
                href={`/${mun.slug}/${currentCategory.slug}`}
                className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100 transition-colors"
              >
                <MapPin className="h-3 w-3" />
                {mun.name}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
