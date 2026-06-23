import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { enforceRateLimits, getClientIp } from "@/lib/security/request-rate-limit"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

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
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.mercadopago.com https://*.stripe.com https://js.sentry-cdn.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.mercadopago.com https://*.stripe.com https://sentry.io https://o*.sentry.io wss://*.sentry.io",
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
    "/feed",
    "/solicitudes",
    "/ventas-de-cochera",
    "/robots.txt",
    "/sitemap.xml",
  ])
  const publicPrefixPaths = ["/perfil", "/categoria", "/preguntas", "/reclamar", "/usuario", "/eventos", "/blog", "/promociones", "/contacto", "/uploads", "/demo", "/api/auth", "/api/public", "/api/health", "/api/analytics"]
  const publicMarketplacePaths = pathname === "/marketplace" || (pathname.startsWith("/marketplace/") && !pathname.startsWith("/marketplace/nuevo"))

  if (publicExactPaths.has(pathname) || publicPrefixPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) || publicMarketplacePaths) {
    return NextResponse.next({ headers: securityHeaders })
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname === "/favicon.ico") {
    return NextResponse.next({ headers: securityHeaders })
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/auth/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const resolvedRole = role

  if (pathname.startsWith("/admin") && resolvedRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (pathname.startsWith("/agente") && resolvedRole !== "SALES_AGENT" && resolvedRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (pathname.startsWith("/editor") && resolvedRole !== "EDITOR" && resolvedRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next({ headers: securityHeaders })
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
}
