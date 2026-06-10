import { NextResponse } from "next/server"
import { apiLimiter } from "@/lib/security/rate-limit"

export async function GET(req: Request) {
  const rl = await apiLimiter(req)
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rl.resetTime - Date.now()) / 1000))) } }
    )
  }

  return NextResponse.json({
    success: true,
    service: "guiazmg-public-api",
    version: "v1",
    timestamp: new Date().toISOString(),
  })
}
