// Detalle de negocio para la app: `toBusinessDetail` sobre `getProfileBySlug`
// (misma consulta cacheada... salvo que NO está cacheada — `getProfileBySlug`
// no usa `unstable_cache` porque incluye `isFavorite`/reviews del usuario en
// consultas futuras; se deja tal cual para no cambiar semántica de la web).
export const dynamic = "force-dynamic"

import { getProfileBySlug } from "@/lib/queries"
import { ok, fail } from "@/lib/api/mobile/respond"
import { toBusinessDetail } from "@/lib/api/mobile/serializers"

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let profile: Awaited<ReturnType<typeof getProfileBySlug>>
  try {
    profile = await getProfileBySlug(slug)
  } catch (error) {
    console.error("[mobile/businesses/slug]", error instanceof Error ? error.message : error)
    return fail("INTERNAL_ERROR", 500, "No se pudo cargar el negocio.")
  }

  if (!profile || profile.status !== "ACTIVE") {
    return fail("NOT_FOUND", 404, "Negocio no encontrado.")
  }

  const detail = toBusinessDetail({
    ...profile,
    reviewCount: profile._count?.reviews ?? 0,
  } as unknown as Parameters<typeof toBusinessDetail>[0])

  return ok(detail)
}
