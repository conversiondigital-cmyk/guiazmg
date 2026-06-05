interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

class InMemoryStore {
  private hits: Map<string, { count: number; resetAt: number }>

  constructor() {
    this.hits = new Map()
  }

  increment(key: string, windowMs: number): { count: number; resetAt: number } {
    const now = Date.now()
    const existing = this.hits.get(key)

    if (!existing || now >= existing.resetAt) {
      const resetAt = now + windowMs
      const entry = { count: 1, resetAt }
      this.hits.set(key, entry)
      return entry
    }

    existing.count++
    return existing
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.hits) {
      if (now >= entry.resetAt) this.hits.delete(key)
    }
  }
}

const store = new InMemoryStore()
let redisClientPromise: Promise<any | null> | null = null

async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const { createClient } = await import("redis")
      const client = createClient({ url: redisUrl })
      client.on("error", () => {})
      await client.connect()
      return client
    })().catch(() => null)
  }

  return redisClientPromise
}

export function getTrustedClientIp(request: Request): string {
  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
  if (vercelIp) return vercelIp

  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) return cfIp

  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  if (forwarded) return forwarded

  return "unknown"
}

if (typeof setInterval !== "undefined") {
  setInterval(() => store.cleanup(), 60_000)
}

export async function rateLimit(
  key: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const { windowMs = 60_000, maxRequests = 60 } = config || {}

  const redis = await getRedisClient()
  if (redis) {
    try {
      const redisKey = `rate-limit:${key}:${windowMs}`
      const count = await redis.incr(redisKey)
      if (count === 1) {
        await redis.expire(redisKey, Math.ceil(windowMs / 1000))
      }

      const ttlSeconds = await redis.ttl(redisKey)
      const resetTime = Date.now() + Math.max(ttlSeconds, 1) * 1000

      return {
        success: count <= maxRequests,
        remaining: Math.max(0, maxRequests - count),
        resetTime,
      }
    } catch {
    }
  }

  const { count, resetAt } = store.increment(key, windowMs)
  return {
    success: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetTime: resetAt,
  }
}

export function rateLimitMiddleware(config?: RateLimitConfig) {
  return async (request: Request): Promise<RateLimitResult> => {
    const ip = getTrustedClientIp(request)
    return rateLimit(ip, config)
  }
}

export const apiLimiter = (request: Request) =>
  rateLimitMiddleware({ windowMs: 60000, maxRequests: 60 })(request)

export const authLimiter = (request: Request) =>
  rateLimitMiddleware({ windowMs: 60000, maxRequests: 10 })(request)

export const searchLimiter = (request: Request) =>
  rateLimitMiddleware({ windowMs: 60000, maxRequests: 30 })(request)

export const marketplaceLimiter = (request: Request) =>
  rateLimitMiddleware({ windowMs: 60000, maxRequests: 20 })(request)
