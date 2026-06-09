export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { CategoryGrid } from "@/components/home/category-grid"
import { FeaturedBusinesses } from "@/components/home/featured-businesses"
import { StatsSection } from "@/components/home/stats-section"
import { BenefitsSection } from "@/components/home/benefits-section"
import { MunicipalitiesSection } from "@/components/home/municipalities-section"
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel"
import { CTASection } from "@/components/home/cta-section"
import { LatestBlogPosts } from "@/components/home/latest-blog-posts"
import { getCategories, getFeaturedBusinesses, getMunicipalities } from "@/lib/queries"
import { prisma } from "@/lib/prisma"

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let businesses: Awaited<ReturnType<typeof getFeaturedBusinesses>> = []
  let municipalities: Awaited<ReturnType<typeof getMunicipalities>> = []
  let categoryCounts: { id: string; _count: { businesses: number } }[] = []
  let latestPosts: any[] = []

  try {
    ;[categories, businesses, municipalities, categoryCounts, latestPosts] = await Promise.all([
      getCategories(),
      getFeaturedBusinesses(),
      getMunicipalities(),
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, _count: { select: { businesses: true } } },
      }),
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        take: 3,
        select: {
          id: true, title: true, slug: true, excerpt: true,
          coverImageUrl: true, category: true, readTimeMinutes: true, publishedAt: true,
          author: { select: { name: true } },
        },
      }),
    ])
  } catch {
    // DB no disponible — renderiza con estado vacío
  }

  const categoriesWithCounts = categories.map((cat) => ({
    ...cat,
    _count: categoryCounts.find((c) => c.id === cat.id)?._count || { businesses: 0 },
  }))

  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroCarousel />
        <CategoryGrid categories={categoriesWithCounts as any} />
        <FeaturedBusinesses businesses={businesses} />
        <StatsSection />
        <BenefitsSection />
        <MunicipalitiesSection municipalities={municipalities} />
        <LatestBlogPosts posts={latestPosts} />
        <CTASection />
        <TestimonialsCarousel />
      </main>
      <Footer />
    </>
  )
}
