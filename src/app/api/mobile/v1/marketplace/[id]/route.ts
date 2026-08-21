// Detalle de una publicación de marketplace, proyectado a `ListingDetail`.
export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api/mobile/respond"
import { toListingDetail } from "@/lib/api/mobile/serializers"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let listing
  try {
    listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        price: true,
        type: true,
        condition: true,
        isBoosted: true,
        createdAt: true,
        favoriteCount: true,
        neighborhood: true,
        phone: true,
        whatsapp: true,
        views: true,
        status: true,
        deletedAt: true,
        category: { select: { name: true, slug: true, icon: true } },
        municipality: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
        user: { select: { id: true, name: true, image: true } },
      },
    })
  } catch (error) {
    console.error("[mobile/marketplace/id]", error instanceof Error ? error.message : error)
    return fail("INTERNAL_ERROR", 500, "No se pudo cargar la publicación.")
  }

  if (!listing || listing.deletedAt || listing.status !== "ACTIVE") {
    return fail("NOT_FOUND", 404, "Publicación no encontrada.")
  }

  return ok(toListingDetail(listing))
}
