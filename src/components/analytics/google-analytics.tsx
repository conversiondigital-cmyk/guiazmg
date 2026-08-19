import Script from "next/script"

// ID de medición de Google Analytics 4. Se toma de NEXT_PUBLIC_GA_ID (para poder
// cambiarlo por entorno) con un default fijo. Vacío → no se carga nada.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-YWQD1P0TJ1"

// Etiqueta de Google Analytics 4 (gtag.js). Estrategia afterInteractive para no
// bloquear el render. El CSP del proxy permite googletagmanager.com y
// *.google-analytics.com (script-src / connect-src).
export function GoogleAnalytics() {
  if (!GA_ID) return null
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  )
}
