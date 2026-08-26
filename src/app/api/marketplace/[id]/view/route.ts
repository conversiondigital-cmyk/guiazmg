/**
 * POST /api/marketplace/[id]/view
 * Incrementa el contador de vistas de una publicación del marketplace.
 * Debounce por IP vía Redis (1 vista por 24 h por publicación por IP) — mismo
 * patrón que /api/blog/posts/[id]/view. Solo cuenta publicaciones ACTIVE.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Cliente Redis inline — mismo patrón que src/lib/cache.ts
async function tryRedis() {
  try {
    const { createClient } = await import("redis")
    if (!process.env.REDIS_URL) return null
    const client = createClient({ url: process.env.REDIS_URL })
    await client.connect()
    return client
  } catch { return null }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  const key = `mkt:view:${id}:${ip}`

  try {
    const redis = await tryRedis()
    if (redis) {
      const seen = await redis.get(key)
      if (seen) return NextResponse.json({ ok: true, counted: false })
      await redis.setEx(key, 86400, "1") // 24 h TTL
    }
  } catch {
    // Redis no disponible — se cuenta de todos modos
  }

  await prisma.marketplaceListing.updateMany({
    where: { id, status: "ACTIVE", deletedAt: null },
    data: { views: { increment: 1 } },
  })

  return NextResponse.json({ ok: true, counted: true })
}
