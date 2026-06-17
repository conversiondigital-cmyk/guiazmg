import type { Metadata } from "next"
import { Geist, Geist_Mono, Manrope } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "@/components/ui/sonner"
import { SystemDialogHost } from "@/components/ui/system-dialog"
import { CookieConsent } from "@/components/legal/cookie-consent"
import { validateEnv } from "@/lib/env"

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

export const metadata: Metadata = {
  title: {
    default: "Guía ZMG - Buscador Local de la Zona Metropolitana de Guadalajara",
    template: "%s | Guía ZMG",
  },
  description:
    "Encuentra negocios, profesionales y servicios en Guadalajara, Zapopan, Tlaquepaque, Tonalá y Tlajomulco. Búsqueda hiperlocal rápida y sencilla.",
  keywords: [
    "Guadalajara",
    "Zapopan",
    "Tlaquepaque",
    "Tonalá",
    "Tlajomulco",
    "negocios locales",
    "directorio",
    "servicios",
    "profesionales",
  ],
  openGraph: {
    title: "Guía ZMG - Buscador Local",
    description:
      "Encuentra negocios, profesionales y servicios en la Zona Metropolitana de Guadalajara.",
    siteName: "Guía ZMG",
    locale: "es_MX",
    type: "website",
  },
  alternates: {
    types: {
      "application/rss+xml": "/blog/rss.xml",
    },
  },
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
          {children}
          <Toaster />
          <SystemDialogHost />
          <CookieConsent />
        </SessionProvider>
      </body>
    </html>
  )
}
