import { prisma } from "@/lib/prisma"

// Tope por defecto cuando el negocio no tiene una membresía activa (mismo criterio
// generoso que usa el endpoint de creación para no bloquear en el lanzamiento).
const DEFAULT_CAP = 100

export type CatalogType = "PRODUCT" | "SERVICE"

// Uso vs. tope de un tipo de publicación (PRODUCT o SERVICE) para el dueño.
// Cuenta las publicaciones no borradas de ese tipo en todos sus negocios y suma el
// tope del plan de cada negocio (maxListings para productos, maxServices para
// servicios). Devuelve también businessIds para reutilizar la consulta de filas.
export async function getCatalogUsage(ownerId: string, type: CatalogType) {
  const businesses = await prisma.profile.findMany({
    where: { ownerId },
    select: {
      id: true,
      memberships: {
        // TRIAL (cupón) cuenta como activa, igual que en el endpoint de creación.
        where: { status: { in: ["ACTIVE", "TRIAL"] } },
        select: { plan: { select: { maxListings: true, maxServices: true } } },
        take: 1,
      },
    },
  })

  const businessIds = businesses.map((b) => b.id)
  const used = businessIds.length
    ? await prisma.listing.count({
        where: { businessId: { in: businessIds }, deletedAt: null, type },
      })
    : 0

  const limit = businesses.reduce((sum, b) => {
    const plan = b.memberships[0]?.plan
    const cap = plan ? (type === "SERVICE" ? plan.maxServices : plan.maxListings) : DEFAULT_CAP
    return sum + (cap ?? DEFAULT_CAP)
  }, 0)

  return { used, limit, businessIds }
}
