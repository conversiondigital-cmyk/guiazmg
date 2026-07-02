import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { classifyTraffic } from "@/lib/analytics/traffic"
import { z } from "zod"

// Registro de visita de entrada (1 por sesión desde el beacon). Público.
const schema = z.object({
  path: z.string().max(300).optional(),
  referrer: z.string().max(500).nullable().optional(),
  utmSource: z.string().max(120).nullable().optional(),
  utmMedium: z.string().max(120).nullable().optional(),
  utmCampaign: z.string().max(160).nullable().optional(),
})

// Throttle simple en memoria para evitar floods triviales (por instancia).
const seen = new Map<string, number>()

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"
    const now = Date.now()
    const last = seen.get(ip)
    if (last && now - last < 3000) return NextResponse.json({ ok: true })
    seen.set(ip, now)
    if (seen.size > 5000) {
      for (const [k, t] of seen) if (now - t > 60000) seen.delete(k)
    }

    const body = schema.parse(await request.json())
    const { channel, source } = classifyTraffic({
      referrer: body.referrer,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      selfHost: request.headers.get("host"),
    })

    await prisma.pageVisit.create({
      data: {
        path: (body.path || "/").slice(0, 300),
        referrer: body.referrer ? body.referrer.slice(0, 500) : null,
        channel,
        source,
        medium: body.utmMedium ? body.utmMedium.slice(0, 120) : null,
        campaign: body.utmCampaign ? body.utmCampaign.slice(0, 160) : null,
      },
    })
    return NextResponse.json({ ok: true })
  } catch {
    // Nunca romper la navegación por un fallo de analítica.
    return NextResponse.json({ ok: true })
  }
}
