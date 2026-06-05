export const dynamic = "force-dynamic"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSearch } from "@/components/home/hero-search"
import { CategoryGrid } from "@/components/home/category-grid"
import { FeaturedBusinesses } from "@/components/home/featured-businesses"
import { MunicipalitiesSection } from "@/components/home/municipalities-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { CTASection } from "@/components/home/cta-section"
import { getCategories, getFeaturedBusinesses, getMunicipalities } from "@/lib/queries"
import { prisma } from "@/lib/prisma"

export default async function HomePage() {
  const [categories, businesses, municipalities, categoryCounts] = await Promise.all([
    getCategories(),
    getFeaturedBusinesses(),
    getMunicipalities(),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, _count: { select: { businesses: true } } },
    }),
  ])

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
        <MunicipalitiesSection municipalities={municipalities} />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
