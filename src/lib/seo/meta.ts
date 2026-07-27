import type { Metadata } from "next"
import { getPublicAppUrl } from "@/lib/env"

const BASE_URL = getPublicAppUrl()
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`

export function generateMeta({
  title,
  description,
  image,
  url,
  canonical,
  noindex,
}: {
  title: string
  description: string
  image?: string
  url?: string
  canonical?: string
  noindex?: boolean
}): Metadata {
  const siteTitle = title.includes("Guía ZMG") ? title : `${title} | Guía ZMG`
  const ogImage = image || DEFAULT_IMAGE
  const canonicalUrl = canonical || url || BASE_URL

  return {
    // `absolute` evita que el template "%s | Guía ZMG" del layout raíz vuelva a
    // añadir el sufijo (si no, quedaba "… | Guía ZMG | Guía ZMG").
    title: { absolute: siteTitle },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: siteTitle,
      description,
      url: canonicalUrl,
      siteName: "Guía ZMG",
      locale: "es_MX",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description,
      images: [ogImage],
    },
    // Página "delgada": noindex pero SÍ follow, para que Google siga los enlaces
    // internos (colonias/categorías cercanas) y reparta autoridad.
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
  }
}
