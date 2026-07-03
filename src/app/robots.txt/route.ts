import { NextResponse } from "next/server"
import { getPublicAppUrl } from "@/lib/env"
import { getSeoSettings, defaultRobotsTxt } from "@/lib/seo/settings"

export async function GET() {
  const baseUrl = getPublicAppUrl()
  const seo = await getSeoSettings()

  // Si el admin definió un robots.txt propio en la config, se respeta tal cual;
  // si no, se usa el default (bloquea panel/rutas privadas + enlaza el sitemap
  // cuando está habilitado).
  const robots = seo.robotsTxt || defaultRobotsTxt(baseUrl, seo.sitemapEnabled)

  return new NextResponse(robots, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
