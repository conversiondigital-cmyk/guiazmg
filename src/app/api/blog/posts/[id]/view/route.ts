/**
 * POST /api/blog/posts/[id]/view
 * Increments view counter. Uses Redis to debounce per-IP (1 view per 24h per post per IP).
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
// Redis client inline — same pattern as src/lib/cache.ts
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

  // Debounce via Redis (if available)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  const key = `blog:view:${id}:${ip}`

  try {
    const redis = await tryRedis()
    if (redis) {
      const seen = await redis.get(key)
      if (seen) return NextResponse.json({ ok: true, counted: false })
      await redis.setEx(key, 86400, "1") // 24h TTL
    }
  } catch {
    // Redis unavailable — still count
  }

  await prisma.post.updateMany({
    where: { id, status: "PUBLISHED" },
    data: { viewCount: { increment: 1 } },
  })

  return NextResponse.json({ ok: true, counted: true })
}
