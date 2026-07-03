import type { Profile } from "@/types"
import { getPublicAppUrl } from "@/lib/env"

const BASE_URL = getPublicAppUrl()

function cleanSchema<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && !(typeof v === "object" && Array.isArray(v) && v.length === 0))
  ) as T
}

function detectBusinessType(categoryName?: string | null): string {
  if (!categoryName) return "LocalBusiness"
  const map: Record<string, string> = {
    "Restaurantes": "Restaurant",
    "Salud": "MedicalBusiness",
    "Médicos": "MedicalBusiness",
    "Dentistas": "Dentist",
    "Abogados": "Attorney",
    "Automotriz": "AutomotiveBusiness",
    "Talleres": "AutomotiveBusiness",
    "Veterinarias": "VeterinaryCare",
    "Bienes Raíces": "RealEstateAgent",
    "Bienes Raices": "RealEstateAgent",
    "Educación": "EducationalOrganization",
    "Educacion": "EducationalOrganization",
    "Clases": "EducationalOrganization",
    "Eventos": "Event",
    "Tiendas": "Store",
    "Profesionales": "ProfessionalService",
    "Servicios": "ProfessionalService",
  }
  return map[categoryName] || "LocalBusiness"
}

export function organizationSchema() {
  return cleanSchema({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Guía ZMG",
    alternateName: "Guía ZMG - Directorio de negocios en Guadalajara y Zona Metropolitana",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [
      "https://facebook.com/guiazmg",
      "https://instagram.com/guiazmg",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+52-33-0000-0000",
      contactType: "customer service",
      areaServed: "MX-JAL",
      availableLanguage: ["Spanish"],
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Guadalajara",
      addressRegion: "Jalisco",
      addressCountry: "MX",
    },
  })
}

export function profileSchema(
  profile: Profile,
  rating?: { value: number; count: number }
) {
  const businessType = detectBusinessType(profile.category?.name)

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": businessType,
    name: profile.name,
    url: `${BASE_URL}/perfil/${profile.slug}`,
    telephone: profile.phone || undefined,
    email: profile.email || undefined,
    description: profile.shortDescription || profile.description || undefined,
    image: profile.logoUrl || profile.coverImageUrl || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: profile.municipality?.name || undefined,
      addressRegion: "Jalisco",
      addressCountry: "MX",
      streetAddress: profile.addressText || undefined,
      postalCode: profile.postalCode || undefined,
    },
    geo: profile.latitude && profile.longitude ? {
      "@type": "GeoCoordinates",
      latitude: profile.latitude,
      longitude: profile.longitude,
    } : undefined,
    openingHoursSpecification: profile.hours?.map((h: any) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
      ][h.dayOfWeek],
      opens: h.opensAt || undefined,
      closes: h.closesAt || undefined,
    })).filter(Boolean) || undefined,
    aggregateRating: (() => {
      // Prefiere el promedio/conteo reales calculados sobre todas las reseñas
      // visibles; si no se pasan, cae al cálculo sobre las reseñas incluidas.
      const count = rating?.count ?? profile._count?.reviews ?? 0
      if (count <= 0) return undefined
      const value =
        rating?.value ??
        (Array.isArray(profile.reviews) && profile.reviews.length > 0
          ? profile.reviews.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) / profile.reviews.length
          : 0)
      return {
        "@type": "AggregateRating",
        ratingValue: value.toFixed(1),
        reviewCount: count,
      }
    })(),
    sameAs: [
      profile.facebookUrl,
      profile.instagramUrl,
      profile.tiktokUrl,
      profile.youtubeUrl,
      profile.linkedinUrl,
    ].filter(Boolean) as string[] | undefined,
  }

  if (profile.whatsapp) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      telephone: profile.whatsapp,
      contactType: "sales",
      areaServed: "MX-JAL",
    }
  }

  if (profile.websiteUrl) {
    schema.sameAs = [...(schema.sameAs || []), profile.websiteUrl]
  }

  return cleanSchema(schema)
}

export const businessSchema = profileSchema

export function productSchema(listing: any) {
  return cleanSchema({
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description || undefined,
    image: listing.images?.[0]?.imageUrl || undefined,
    offers: {
      "@type": "Offer",
      price: listing.price ? Number(listing.price) : undefined,
      priceCurrency: "MXN",
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/marketplace/${listing.slug}`,
    },
    category: listing.category?.name || undefined,
  })
}

export function serviceSchema(request: any) {
  return cleanSchema({
    "@context": "https://schema.org",
    "@type": "Service",
    name: request.title,
    description: request.description || undefined,
    provider: {
      "@type": "Person",
      name: request.user?.name || undefined,
    },
    areaServed: request.municipality?.name
      ? {
          "@type": "City",
          name: request.municipality.name,
        }
      : undefined,
    category: request.category?.name || undefined,
  })
}

export function reviewSchema(review: any) {
  return cleanSchema({
    "@context": "https://schema.org",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: review.user?.name || "Anónimo",
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.comment || undefined,
    datePublished: review.createdAt ? new Date(review.createdAt).toISOString() : undefined,
    itemReviewed: {
      "@type": "LocalBusiness",
      name: review.profile?.name || undefined,
    },
  })
}

export function aggregateRatingSchema(stats: any) {
  return cleanSchema({
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    ratingValue: stats.averageRating?.toString() || "0",
    bestRating: "5",
    worstRating: "1",
    ratingCount: stats.totalReviews || 0,
  })
}

export function websiteSchema() {
  return cleanSchema({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Guía ZMG",
    alternateName: "Guía ZMG - Directorio de negocios en Guadalajara",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  })
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return cleanSchema({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  })
}

export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
