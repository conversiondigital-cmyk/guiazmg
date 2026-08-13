// ISR: el perfil se cachea y se regenera cada 5 min; las ediciones del negocio
// lo revalidan al instante (revalidatePath en la API de negocios).
export const revalidate = 300

import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BusinessDetail } from "@/components/business/business-detail"
import { BusinessActions } from "@/components/business/business-actions"
import { BusinessSaveShare } from "@/components/business/business-save-share"
import { ReportButton } from "@/components/business/report-button"
import { BusinessMap } from "@/components/business/business-map"
import { getGoogleMapsApiKey } from "@/lib/maps-config"
import { TrackBusinessView } from "@/components/business/track-business-view"
import { ClaimButton } from "@/components/business/claim-button"
import { BusinessPromotions } from "@/components/business/business-promotions"
import { BusinessReviews } from "@/components/business/business-reviews"
import { BusinessGallery } from "@/components/business/business-gallery"
import { BusinessCatalog } from "@/components/business/business-catalog"
import { BusinessModality } from "@/components/business/business-modality"
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

  if (!business) {
    notFound()
  }

  // El dueño puede PREVISUALIZAR su negocio aunque aún no esté aprobado (en
  // revisión/borrador). Para el público, un negocio no ACTIVE sigue dando 404.
  // IMPORTANTE (costo/CPU): auth() fuerza render dinámico, así que SOLO se consulta
  // la sesión para negocios NO publicados (caso raro, vista previa del dueño). Los
  // ACTIVE —el grueso del tráfico— se renderizan cacheados vía ISR (revalidate).
  const isPublished = business.status === "ACTIVE"
  if (!isPublished) {
    const session = await auth()
    const isOwner = !!session?.user?.id && business.ownerId === session.user.id
    if (!isOwner) {
      notFound()
    }
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

  // Catálogo de productos del negocio (modelo Listing). Solo activos; se muestra
  // en el perfil público. Se toma la primera imagen de cada producto como portada.
  const catalog = await prisma.listing.findMany({
    where: { businessId: business.id, status: "ACTIVE", deletedAt: null },
    // Destacados primero, luego ALFABÉTICO por título: el catálogo se ve ordenado
    // aunque tenga muchos productos (antes era por fecha, sin orden legible).
    orderBy: [{ isBoosted: "desc" }, { title: "asc" }],
    take: 210, // cubre el tope del plan (100 productos + 100 servicios) con holgura
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      unit: true,
      type: true,
      isBoosted: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { imageUrl: true } },
    },
  })
  const catalogItems = catalog.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price != null ? Number(p.price) : null,
    unit: p.unit,
    type: p.type,
    image: p.images[0]?.imageUrl ?? null,
    isBoosted: p.isBoosted,
  }))

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
      {isPublished && <TrackBusinessView businessId={business.id} />}
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {!isPublished && (
            <div className="mb-6 flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {business.status === "INACTIVE" ? (
                <>
                  <span className="font-semibold">Tu membresía venció — tu negocio no aparece en el directorio.</span>
                  <span>
                    Tu cuenta sigue activa, pero tu perfil solo eres visible para ti. Renueva tu plan o canjea un
                    cupón para volver a aparecer:{" "}
                    <Link href="/dashboard/membresia" className="font-medium underline">Renovar membresía</Link>.
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold">Este perfil está en revisión — solo tú puedes verlo.</span>
                  <span>
                    Tu negocio aún no aparece en el directorio público. Un administrador lo revisará y, al aprobarlo,
                    será visible para todos. Mientras tanto puedes seguir completándolo desde{" "}
                    <Link href="/dashboard/negocio" className="font-medium underline">Mi negocio</Link>.
                  </span>
                </>
              )}
            </div>
          )}
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
              {business.latitude != null && business.longitude != null && (
                <BusinessMap
                  lat={business.latitude}
                  lng={business.longitude}
                  name={business.name}
                  businessId={business.id}
                  apiKey={await getGoogleMapsApiKey()}
                />
              )}
              <BusinessModality
                profileType={business.profileType}
                serviceModes={business.serviceModes}
                coverageArea={business.coverageArea}
                hasPhysicalLocation={business.hasPhysicalLocation}
                isFounder={business.isFounder}
                isBoosted={business.isBoosted}
              />
              <BusinessCatalog items={catalogItems} />
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
              <div className="space-y-4 lg:sticky lg:top-24">
                {isPublished && (
                  <BusinessSaveShare businessId={business.id} businessName={business.name} />
                )}
                <BusinessActions business={business} />
                <ClaimButton businessId={business.id} businessName={business.name} />
                {isPublished && (
                  <div className="pt-1 text-center">
                    <ReportButton businessId={business.id} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
