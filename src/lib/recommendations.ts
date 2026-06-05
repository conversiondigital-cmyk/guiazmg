import { prisma } from "@/lib/prisma"

export async function getSimilarBusinesses(businessId: string, limit = 4) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { categoryId: true, municipalityId: true, neighborhoodId: true, id: true },
  })
  if (!business) return []

  const similar = await prisma.business.findMany({
    where: {
      id: { not: business.id },
      status: "ACTIVE",
      deletedAt: null,
      OR: [
        { categoryId: business.categoryId, municipalityId: business.municipalityId },
        { categoryId: business.categoryId, neighborhoodId: business.neighborhoodId },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      category: { select: { name: true, slug: true } },
      municipality: { select: { name: true, slug: true } },
      neighborhood: { select: { name: true, slug: true } },
    },
    take: limit,
    orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
  })

  return similar
}

export async function getPopularInCategory(categorySlug: string, limit = 6) {
  return prisma.business.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      category: { slug: categorySlug },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      category: { select: { name: true, slug: true } },
      municipality: { select: { name: true, slug: true } },
    },
    take: limit,
    orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
  })
}
