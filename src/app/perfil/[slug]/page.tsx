// ISR: el perfil se cachea y se regenera cada 5 min; las ediciones del negocio
// lo revalidan al instante (revalidatePath en la API de negocios).
export const revalidate = 300

import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BusinessDetail } from "@/components/business/business-detail"
import { BusinessActions } from "@/components/business/business-actions"
import { TrackBusinessView } from "@/components/business/track-business-view"
import { ClaimButton } from "@/components/business/claim-button"
import { BusinessPromotions } from "@/components/business/business-promotions"
import { BusinessReviews } from "@/components/business/business-reviews"
import { BusinessGallery } from "@/components/business/business-gallery"
import { BusinessHours } from "@/components/business/business-hours"
import { SimilarBusinesses } from "@/components/business/similar-businesses"
import { getBusinessBySlug } from "@/lib/queries"
import { prisma } from "@/lib/prisma"
import { getPublicAppUrl } from "@/lib/env"
import { profileSchema, breadcrumbSchema, safeJsonLd } from "@/lib/seo/schema"
import { DistanceBadge } from "@/components/location/distance-badge"

interface BusinessPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BusinessPageProps) {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) return { title: "No encontrado" }
  const baseUrl = getPublicAppUrl()

  const title = `${business.name} | Guía ZMG`
  const description = business.shortDescription || `Encuentra ${business.name} en Guía ZMG. Teléfono, WhatsApp, horarios, ubicación y reseñas.`

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `${baseUrl}/perfil/${slug}` },
  }
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)

  if (!business || business.status !== "ACTIVE") {
    notFound()
  }

  // Promedio y conteo reales sobre TODAS las reseñas visibles (no solo las 10
  // que se cargan para mostrar) y excluyendo las rechazadas por moderación.
  const ratingStats = await prisma.review.aggregate({
    where: { businessId: business.id, status: { not: "REJECTED" } },
    _avg: { rating: true },
    _count: true,
  })
  const avgRating = ratingStats._avg.rating ?? 0
  const reviewCount = ratingStats._count

  const baseUrl = getPublicAppUrl()
  const url = `${baseUrl}/perfil/${business.slug}`

  const breadcrumbItems = [
    { name: "Inicio", url: baseUrl },
    ...(business.category ? [{ name: business.category.name, url: `${baseUrl}/categoria/${business.category.slug}` }] : []),
    { name: business.name, url },
  ]

  const jsonLd = profileSchema(business, { value: avgRating, count: reviewCount })
  const breadcrumbLd = breadcrumbSchema(breadcrumbItems)

  const images = business.id
    ? await prisma.profileImage.findMany({
        where: { businessId: business.id },
        orderBy: { sortOrder: "asc" },
      })
    : []

  const similarBusinesses = business.categoryId
    ? await prisma.profile.findMany({
        where: {
          categoryId: business.categoryId,
          id: { not: business.id },
          status: "ACTIVE",
        },
        take: 6,
        include: {
          municipality: true,
        },
      })
    : []

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <TrackBusinessView businessId={business.id} />
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-green-700 transition-colors">Inicio</Link>
            <span className="mx-2">/</span>
            {business.category && (
              <>
                <Link
                  href={`/categoria/${business.category.slug}`}
                  className="hover:text-green-700 transition-colors"
                >
                  {business.category.name}
                </Link>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-gray-900">{business.name}</span>
          </nav>

          {business.latitude != null && business.longitude != null && (
            <div className="mb-4">
              <DistanceBadge lat={business.latitude} lng={business.longitude} interactive className="text-sm" />
            </div>
          )}

          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <BusinessDetail business={business} avgRating={avgRating} reviewCount={reviewCount} />
              <BusinessPromotions promotions={business.coupons} />
              {business.hours && business.hours.length > 0 && (
                <BusinessHours hours={business.hours as any} />
              )}
              {images.length > 0 && (
                <BusinessGallery images={images.map((img) => ({ id: img.id, url: img.imageUrl, alt: undefined }))} />
              )}
              <BusinessReviews reviews={business.reviews} businessId={business.id} totalCount={reviewCount} />
              {similarBusinesses.length > 0 && (
                <SimilarBusinesses businesses={similarBusinesses as any} />
              )}
            </div>
            <div className="mt-6 lg:mt-0">
              <div className="lg:sticky lg:top-24">
                <BusinessActions business={business} />
                <div className="mt-4">
                  <ClaimButton businessId={business.id} businessName={business.name} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
