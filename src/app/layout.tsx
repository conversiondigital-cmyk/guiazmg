import type { Metadata } from "next"
import { Geist, Geist_Mono, Manrope } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/providers/session-provider"
import { UserLocationProvider } from "@/components/location/user-location"
import { Toaster } from "@/components/ui/sonner"
import { SystemDialogHost } from "@/components/ui/system-dialog"
import { CookieConsent } from "@/components/legal/cookie-consent"
import { Analytics } from "@vercel/analytics/next"
import { TrafficBeacon } from "@/components/analytics/traffic-beacon"
import { validateEnv, getPublicAppUrl } from "@/lib/env"
import { getSeoSettings } from "@/lib/seo/settings"

validateEnv()

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// Tipografía del diseño de la landing.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
})

// Los metadatos base leen la configuración SEO editable en /admin/configuracion/seo
// (con defaults fuertes en @/lib/seo/settings). El template "%s | Guía ZMG" se
// mantiene para que las subpáginas antepongan su propio título.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings()
  return {
    metadataBase: new URL(getPublicAppUrl()),
    title: {
      default: seo.title,
      template: "%s | Guía ZMG",
    },
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title,
      description: seo.description,
      siteName: "Guía ZMG",
      locale: "es_MX",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": "/blog/rss.xml",
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    verification: {
      google: [
        "8kW42w_4Zz9e4qoNAHC_fGf7R2RBwK_DUl6-8lcN4Cg",
        "8iug59MImDZwInLWDt1DaSjapWrYiLv6NsR_XdGK7gA",
      ],
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable}`}>
      <body className="min-h-screen flex flex-col">
        <SessionProvider>
          <UserLocationProvider>
            {children}
            <Toaster />
            <SystemDialogHost />
            <CookieConsent />
          </UserLocationProvider>
        </SessionProvider>
        <Analytics />
        <TrafficBeacon />
      </body>
    </html>
  )
}
