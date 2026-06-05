import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getTrustedClientIp } from "./rate-limit"
import { handleCors } from "./cors"
import { generateCsrfToken, validateCsrfToken } from "./csrf"
import { auth } from "@/lib/auth"

type ApiHandler = (req: NextRequest, context: { session: any; csrfToken?: string }) => Promise<NextResponse>

interface ApiMiddlewareOptions {
  rateLimit?: { windowMs: number; maxRequests: number }
  requireAuth?: boolean
  requireRole?: string[]
  csrf?: boolean
}

export function withApiMiddleware(handler: ApiHandler, options: ApiMiddlewareOptions = {}) {
  return async (req: NextRequest) => {
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    if (options.rateLimit) {
      const ip = getTrustedClientIp(req)
      const result = await rateLimit(ip, options.rateLimit)
      if (!result.success) {
        return NextResponse.json(
          { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
          { status: 429, headers: { "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)) } }
        )
      }
    }

    if (options.csrf && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const token = req.headers.get("csrf-token")
      const authToken = req.headers.get("authorization")?.replace("Bearer ", "")
      const sessionId = authToken || "anonymous"
      if (!token || !validateCsrfToken(token, sessionId)) {
        return NextResponse.json({ error: "CSRF token inválido" }, { status: 403 })
      }
    }

    let session: any = null
    if (options.requireAuth || options.requireRole) {
      session = await auth()
      if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
      }
      if (options.requireRole && !options.requireRole.includes((session.user as any).role)) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
      }
    }

    const csrfToken = options.csrf ? generateCsrfToken(session?.user?.id || "anonymous") : undefined

    return handler(req, { session, csrfToken })
  }
}

export async function getCsrfToken(sessionId?: string): Promise<string> {
  return generateCsrfToken(sessionId || "anonymous")
}
