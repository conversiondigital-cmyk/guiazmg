// ISR: se sirve desde caché y se regenera cada 5 min (las ediciones del hero la
// revalidan al instante vía revalidatePath en /api/admin/hero).
export const revalidate = 300

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { CategoryGrid } from "@/components/home/category-grid"
import { FeaturedBusinesses } from "@/components/home/featured-businesses"
import { CTASection } from "@/components/home/cta-section"
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel"
import { getCategories, getFeaturedBusinesses } from "@/lib/queries"
import { getHeroImages } from "@/lib/hero-images"
import { getHeroConfig, DEFAULT_HERO_CONFIG, type HeroConfig } from "@/lib/hero-config"
import { organizationSchema, websiteSchema, safeJsonLd } from "@/lib/seo/schema"

export const metadata = {
  alternates: { canonical: "/" },
}

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let businesses: Awaited<ReturnType<typeof getFeaturedBusinesses>> = []
  let heroImages: string[] = []
  let heroConfig: HeroConfig = DEFAULT_HERO_CONFIG

  try {
    ;[categories, businesses, heroImages, heroConfig] = await Promise.all([
      getCategories(),
      getFeaturedBusinesses(),
      getHeroImages(),
      getHeroConfig(),
    ])
  } catch {
    // DB no disponible — renderiza con estado vacío
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteSchema()) }} />
      <Header />
      <main
        className="flex-1 bg-[#f8f9ff] text-[#0b1c30]"
        style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}
      >
        <HeroCarousel images={heroImages} config={heroConfig} />
        <CategoryGrid categories={categories as any} />
        <FeaturedBusinesses businesses={businesses} />
        <CTASection />
        <TestimonialsCarousel />
      </main>
      <Footer />
    </>
  )
}
