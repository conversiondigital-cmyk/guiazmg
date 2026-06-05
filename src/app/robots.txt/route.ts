import { NextResponse } from "next/server"
import { getPublicAppUrl } from "@/lib/env"

export async function GET() {
  const baseUrl = getPublicAppUrl()

  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /editor/
Disallow: /agente/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /checkout
Disallow: /marketplace/nuevo
Disallow: /registrar-negocio

Sitemap: ${baseUrl}/sitemap.xml`

  return new NextResponse(robots, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
