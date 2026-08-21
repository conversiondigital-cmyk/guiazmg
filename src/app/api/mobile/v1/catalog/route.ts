// Catálogo de referencia que la app pide UNA vez al arrancar y cachea en disco:
// categorías (+ giros), municipios (+ colonias) y categorías de marketplace, en
// una sola respuesta para evitar tres round-trips en el arranque en frío.
export const dynamic = "force-dynamic"

import { createHash } from "crypto"
import { NextRequest } from "next/server"
import { getCategories, getMunicipalities } from "@/lib/queries"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api/mobile/respond"

export async function GET(request: NextRequest) {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let municipalities: Awaited<ReturnType<typeof getMunicipalities>> = []
  let marketplaceCategories: Array<{ id: string; name: string; slug: string; icon: string | null; sortOrder: number }> = []

  try {
    ;[categories, municipalities, marketplaceCategories] = await Promise.all([
      getCategories(),
      getMunicipalities(),
      prisma.marketplaceCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true, icon: true, sortOrder: true },
      }),
    ])
  } catch (error) {
    console.error("[mobile/catalog]", error instanceof Error ? error.message : error)
    return fail("INTERNAL_ERROR", 500, "No se pudo cargar el catálogo.")
  }

  const data = {
    categories: categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      icon: c.icon ?? null,
      subcategories: c.subcategories.map((s) => ({ name: s.name, slug: s.slug })),
    })),
    municipalities: municipalities.map((m) => ({
      name: m.name,
      slug: m.slug,
      neighborhoods: m.neighborhoods.map((n) => ({ name: n.name, slug: n.slug })),
    })),
    marketplaceCategories: marketplaceCategories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon ?? null,
    })),
  }

  // ETag por contenido: la app manda `If-None-Match` en cada arranque; si el
  // catálogo no cambió (lo usual, cambia poco), responde 304 sin cuerpo.
  const etag = `"${createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 32)}"`
  const ifNoneMatch = request.headers.get("if-none-match")
  if (ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  }

  const response = ok(data)
  response.headers.set("ETag", etag)
  response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
  return response
}
