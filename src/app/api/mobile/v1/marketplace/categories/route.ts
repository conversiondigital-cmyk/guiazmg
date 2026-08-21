// Categorías de marketplace (mismo dato que ya viaja dentro de `/catalog`,
// expuesto también suelto por si la app solo necesita refrescar esto sin
// repetir categorías/municipios).
export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api/mobile/respond"

export async function GET() {
  try {
    const categories = await prisma.marketplaceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, icon: true, sortOrder: true },
    })
    return ok(categories)
  } catch (error) {
    console.error("[mobile/marketplace/categories]", error instanceof Error ? error.message : error)
    return fail("INTERNAL_ERROR", 500, "No se pudieron cargar las categorías.")
  }
}
