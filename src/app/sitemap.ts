export const dynamic = "force-dynamic"

import { getPublicAppUrl } from "@/lib/env"

const baseUrl = getPublicAppUrl()

export default async function sitemap() {
  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.85 },
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/feed`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/planes`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 },
  ]

  try {
    const { prisma } = await import("@/lib/prisma")

    const [categories, municipalities, businesses, listings, posts] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.municipality.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.business.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        select: { slug: true, updatedAt: true },
      }),
      prisma.marketplaceListing.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        select: { slug: true, category: { select: { slug: true } }, updatedAt: true },
      }),
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, publishedAt: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
    ])

    const municipalityUrls = municipalities.map((mun) => ({
      url: `${baseUrl}/${mun.slug}`,
      lastModified: mun.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }))

    const categoryUrls = categories.map((cat) => ({
      url: `${baseUrl}/categoria/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }))

    const seoLandingUrls = categories.flatMap((cat) =>
      municipalities.map((mun) => ({
        url: `${baseUrl}/${mun.slug}/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    )

    const businessUrls = businesses.map((biz) => ({
      url: `${baseUrl}/perfil/${biz.slug}`,
      lastModified: biz.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }))

    const marketplaceUrls = listings.map((listing) => ({
      url: `${baseUrl}/marketplace/${listing.category.slug}/${listing.slug}`,
      lastModified: listing.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

    const blogUrls = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

    return [
      ...staticRoutes,
      ...categoryUrls,
      ...municipalityUrls,
      ...seoLandingUrls,
      ...businessUrls,
      ...marketplaceUrls,
      ...blogUrls,
    ]
  } catch {
    return staticRoutes
  }
}
