export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSearch } from "@/components/home/hero-search"
import { CategoryGrid } from "@/components/home/category-grid"
import { FeaturedBusinesses } from "@/components/home/featured-businesses"
import { StatsSection } from "@/components/home/stats-section"
import { BenefitsSection } from "@/components/home/benefits-section"
import { MunicipalitiesSection } from "@/components/home/municipalities-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { CTASection } from "@/components/home/cta-section"
import { getCategories, getFeaturedBusinesses, getMunicipalities } from "@/lib/queries"
import { prisma } from "@/lib/prisma"

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let businesses: Awaited<ReturnType<typeof getFeaturedBusinesses>> = []
  let municipalities: Awaited<ReturnType<typeof getMunicipalities>> = []
  let categoryCounts: { id: string; _count: { businesses: number } }[] = []

  try {
    ;[categories, businesses, municipalities, categoryCounts] = await Promise.all([
      getCategories(),
      getFeaturedBusinesses(),
      getMunicipalities(),
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, _count: { select: { businesses: true } } },
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
        <HeroSearch />
        <CategoryGrid categories={categoriesWithCounts as any} />
        <FeaturedBusinesses businesses={businesses} />
        <StatsSection />
        <BenefitsSection />
        <MunicipalitiesSection municipalities={municipalities} />
        <CTASection />
        <TestimonialsSection />
      </main>
      <Footer />
    </>
  )
}
