import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { enforceRateLimits, getClientIp } from "@/lib/security/request-rate-limit"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Consolidación de dominio para SEO: si se entra por un alias *.vercel.app del
  // deploy de PRODUCCIÓN (p. ej. guiazmg.vercel.app, que Google estaba indexando
  // como duplicado), se redirige 308 (permanente) a guiazmg.com. Los previews
  // (VERCEL_ENV="preview", host con hash) NO se redirigen, para poder probarlos.
  const host = req.headers.get("host") || ""
  const isProdVercelHost =
    host.endsWith(".vercel.app") &&
    (process.env.VERCEL_ENV === "production" || host === "guiazmg.vercel.app")
  if (isProdVercelHost) {
    const canonical = new URL(req.nextUrl.pathname + req.nextUrl.search, "https://guiazmg.com")
    return NextResponse.redirect(canonical, 308)
  }

  // Auth.js v5 cifra la cookie de sesión usando salt = nombre de la cookie, y en
  // HTTPS la nombra con prefijo __Secure-. getToken por defecto (sin NEXTAUTH_URL,
  // que v5 ya no usa) busca la cookie SIN prefijo y con salt equivocado, por lo que
  // en producción nunca encuentra la sesión. Hay que indicarle nombre/salt correctos.
  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" || req.nextUrl.protocol === "https:"
  const sessionCookieName = isHttps ? "__Secure-authjs.session-token" : "authjs.session-token"
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: isHttps,
    cookieName: sessionCookieName,
    salt: sessionCookieName,
  })
  const isLoggedIn = !!token
  const role = token?.role as string | undefined

  const authCredentialsPath = pathname === "/api/auth/callback/credentials" || pathname === "/api/auth/signin/credentials"
  if (authCredentialsPath && req.method === "POST") {
    try {
      const cloned = req.clone()
      let email = ""
      const contentType = req.headers.get("content-type") || ""

      if (contentType.includes("application/json")) {
        const body = await cloned.json().catch(() => null)
        email = String(body?.email || "").toLowerCase()
      } else {
        const form = await cloned.formData().catch(() => null)
        email = String(form?.get("email") || "").toLowerCase()
      }

      const ip = getClientIp(req)
      const rateLimited = await enforceRateLimits([
        { key: `auth:login:ip:${ip}`, windowMs: 60_000, maxRequests: 10 },
        ...(email ? [{ key: `auth:login:email:${email}`, windowMs: 60_000, maxRequests: 5 }] : []),
      ])

      if (rateLimited) return rateLimited
    } catch {
      // fall through to normal handling
    }
  }

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.mercadopago.com https://*.stripe.com https://js.sentry-cdn.com https://va.vercel-scripts.com https://maps.googleapis.com https://maps.gstatic.com https://static.cloudflareinsights.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.mercadopago.com https://*.stripe.com https://sentry.io https://*.ingest.sentry.io wss://*.sentry.io https://va.vercel-scripts.com https://maps.googleapis.com https://maps.gstatic.com https://places.googleapis.com https://cloudflareinsights.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
    "frame-src https://*.mercadopago.com https://*.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")

  const securityHeaders = new Headers({
    "Content-Security-Policy": csp,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  })

  // Aplica los headers de seguridad también a las respuestas de redirect.
  const redirectWith = (url: URL) => {
    const res = NextResponse.redirect(url)
    securityHeaders.forEach((v, k) => res.headers.set(k, v))
    return res
  }

  // Candado GLOBAL de consentimiento: un usuario logueado que NO aceptó términos
  // (p. ej. registro con Google donde dio "atrás") NO puede usar el sitio logueado;
  // se le manda a /auth/bienvenido hasta que acepte (o cancele). Con OAuth la cuenta
  // se crea al autenticar, así que sin este candado global la sesión quedaba usable
  // sin consentir. Staff (admin/editor/agente) exento. Se excluyen las páginas de
  // auth (incl. la propia bienvenida y signout) y las APIs para no romper el flujo
  // de aceptar/cancelar.
  const acceptedTerms = (token as { acceptedTerms?: boolean } | null)?.acceptedTerms
  const isStaff = role === "ADMIN" || role === "EDITOR" || role === "SALES_AGENT"
  // Se gatea solo cuando el token dice EXPLÍCITAMENTE que no aceptó (===false).
  // Los nuevos registros con Google traen la bandera desde el login, así que se
  // gatean de inmediato. Un token viejo (bandera ausente = undefined) NO se gatea
  // aquí para no arriesgar loops a usuarios ya consentidos; se resuelve solo en
  // cuanto su token se refresca (o con re-login). Los layouts privados igual
  // exigen aceptación por BD como respaldo.
  if (
    isLoggedIn &&
    acceptedTerms === false &&
    !isStaff &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    pathname !== "/favicon.ico"
  ) {
    const url = new URL("/auth/bienvenido", req.url)
    url.searchParams.set("next", pathname)
    return redirectWith(url)
  }

  const origin = req.headers.get("origin") || ""
  const allowedOrigins = [
    "http://localhost:3100",
    process.env.NEXT_PUBLIC_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[]

  if (allowedOrigins.includes(origin)) {
    securityHeaders.set("Access-Control-Allow-Origin", origin)
    securityHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    securityHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Csrf-Token, X-Session-Id")
    securityHeaders.set("Access-Control-Max-Age", "86400")
  }

  if (pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: securityHeaders })
    }
  }

  const publicExactPaths = new Set([
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/reset-password",
    "/auth/forgot-password",
    "/terminos",
    "/privacidad",
    "/aviso-legal",
    "/politica-cookies",
    "/normas-comunidad",
    "/search",
    "/mapa",
    "/planes",
    "/emprendedores",
    "/negocios",
    "/onboarding",
    "/onboarding/vendedor",
    "/feed",
    "/solicitudes",
    "/ventas-de-cochera",
    "/robots.txt",
    "/sitemap.xml",
    // Webhooks de pagos: los llama el proveedor sin sesión y se verifican por
    // firma (HMAC / Stripe signature). Sin esto, el proxy los mandaría a login.
    "/api/payments/webhook",
    "/api/payments/stripe/webhook",
  ])
  const publicPrefixPaths = ["/perfil", "/categoria", "/preguntas", "/reclamar", "/usuario", "/eventos", "/blog", "/promociones", "/contacto", "/uploads", "/demo", "/api/auth", "/api/public", "/api/health", "/api/analytics", "/api/cron"]
  const publicMarketplacePaths = pathname === "/marketplace" || (pathname.startsWith("/marketplace/") && !pathname.startsWith("/marketplace/nuevo"))

  if (publicExactPaths.has(pathname) || publicPrefixPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) || publicMarketplacePaths) {
    return NextResponse.next({ headers: securityHeaders })
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname === "/favicon.ico") {
    return NextResponse.next({ headers: securityHeaders })
  }

  // Áreas PRIVADas (requieren sesión). Todo lo demás es contenido público SEO:
  // en particular las landings de municipio/zona/colonia viven en /{municipio}/…
  // con slug dinámico y NO pueden allowlistarse por prefijo estático, así que el
  // proxy solo bloquea estas rutas conocidas y deja pasar el resto. Sin esto,
  // Googlebot recibía un 307 a /auth/login en cada landing (no indexable).
  const privatePrefixes = [
    "/dashboard",
    "/cuenta",
    "/admin",
    "/agente",
    "/editor",
    "/checkout",
    "/registrar-negocio",
    "/reportar",
    "/marketplace/nuevo",
  ]
  const requiresAuth =
    pathname.startsWith("/api/") ||
    privatePrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))

  if (requiresAuth && !isLoggedIn) {
    const loginUrl = new URL("/auth/login", req.url)
    // Se conserva la query string, no solo el pathname: así el enlace de la promo
    // (/registrar-negocio?promo=1) sobrevive el rebote a login y el ida-y-vuelta de
    // Google, y el código de días gratis se autocompleta al final del registro.
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search)
    return redirectWith(loginUrl)
  }

  const resolvedRole = role

  if (pathname.startsWith("/admin") && resolvedRole !== "ADMIN") {
    return redirectWith(new URL("/dashboard", req.url))
  }

  if (pathname.startsWith("/agente") && resolvedRole !== "SALES_AGENT" && resolvedRole !== "ADMIN") {
    return redirectWith(new URL("/dashboard", req.url))
  }

  if (pathname.startsWith("/editor") && resolvedRole !== "EDITOR" && resolvedRole !== "ADMIN") {
    return redirectWith(new URL("/dashboard", req.url))
  }

  return NextResponse.next({ headers: securityHeaders })
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
}
