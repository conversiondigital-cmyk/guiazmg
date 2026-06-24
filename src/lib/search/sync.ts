import { prisma } from "@/lib/prisma"
import { indexProfile, removeProfile, type MeiliProfile } from "@/lib/search/meilisearch"

// Sincroniza un negocio con el índice de Meilisearch tras crear / aprobar / editar.
// Es no-op si Meilisearch no está configurado (getMeiliClient devuelve null), así que
// se puede llamar siempre sin riesgo. Fire-and-forget: nunca lanza.
export async function syncProfileToSearch(id: string): Promise<void> {
  try {
    const p = await prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        status: true,
        isVerified: true,
        isFeatured: true,
        coverImageUrl: true,
        category: { select: { name: true, slug: true } },
        municipality: { select: { name: true } },
      },
    })

    // Solo se indexan negocios públicos (ACTIVE). Si dejó de estarlo, se quita del índice.
    if (!p || p.status !== "ACTIVE") {
      await removeProfile(id)
      return
    }

    const doc: MeiliProfile = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      categoryName: p.category?.name ?? null,
      categorySlug: p.category?.slug ?? null,
      municipalityName: p.municipality?.name ?? null,
      isVerified: p.isVerified,
      isFeatured: p.isFeatured,
      coverImageUrl: p.coverImageUrl,
      _text: [p.name, p.shortDescription, p.description, p.category?.name, p.municipality?.name]
        .filter(Boolean)
        .join(" "),
    }
    await indexProfile(doc)
  } catch (err) {
    console.error("[search-sync] error:", err instanceof Error ? err.message : String(err))
  }
}

export async function removeProfileFromSearch(id: string): Promise<void> {
  await removeProfile(id)
}
