import { NextResponse } from "next/server"
import { rateLimit, getTrustedClientIp } from "@/lib/security/rate-limit"

export function getClientIp(request: Request): string {
  return getTrustedClientIp(request)
}

export async function enforceRateLimits(
  entries: Array<{ key: string; windowMs: number; maxRequests: number }>
): Promise<NextResponse | null> {
  for (const entry of entries) {
    const result = await rateLimit(entry.key, {
      windowMs: entry.windowMs,
      maxRequests: entry.maxRequests,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Demasiadas solicitudes. Intenta más tarde.",
          resetTime: result.resetTime,
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000)).toString(),
          },
        }
      )
    }
  }

  return null
}
