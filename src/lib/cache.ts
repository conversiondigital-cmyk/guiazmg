interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const memoryStore = new Map<string, CacheEntry<any>>()

const ttlDefaults: Record<string, number> = {
  categories: 300,
  municipalities: 300,
  neighborhoods: 300,
  home: 60,
  landing: 300,
}

type RedisClient = Awaited<ReturnType<typeof import("redis").createClient>>

// Reuse a single Redis connection across operations instead of opening and
// closing one per call. Cached on globalThis so dev hot-reloads don't leak
// connections.
const globalForRedis = globalThis as unknown as {
  redisClientPromise: Promise<RedisClient | null> | null
}

function getRedisClient(): Promise<RedisClient | null> {
  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("REDIS_URL must be configured in production")
    }
    return Promise.resolve(null)
  }

  if (!globalForRedis.redisClientPromise) {
    globalForRedis.redisClientPromise = (async () => {
      try {
        const { createClient } = await import("redis")
        const client = createClient({ url: process.env.REDIS_URL })
        client.on("error", (err) => {
          console.error("[cache] redis client error:", err)
        })
        await client.connect()
        return client
      } catch (error) {
        console.error("[cache] redis connection failed, falling back to memory:", error)
        // Reset so a later call can retry the connection.
        globalForRedis.redisClientPromise = null
        return null
      }
    })()
  }

  return globalForRedis.redisClientPromise
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedisClient()
  if (redis) {
    try {
      const raw = await redis.get(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch (error) {
      console.error("[cache] get failed:", error)
    }
  }
  const entry = memoryStore.get(key)
  if (!entry || Date.now() > entry.expiresAt) {
    memoryStore.delete(key)
    return null
  }
  return entry.value
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const ttl = ttlSeconds ?? ttlDefaults[key.split(":")[0]] ?? 60
  const redis = await getRedisClient()
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), { EX: ttl })
      return
    } catch (error) {
      console.error("[cache] set failed:", error)
    }
  }
  memoryStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 })
}

export async function cacheDelete(pattern: string): Promise<void> {
  const redis = await getRedisClient()
  if (redis) {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) await redis.del(keys)
    } catch (error) {
      console.error("[cache] delete failed:", error)
    }
  }
  for (const key of memoryStore.keys()) {
    if (key.startsWith(pattern.replace("*", ""))) memoryStore.delete(key)
  }
}

export async function withCache<T>(
  key: string,
  fetch: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached
  const value = await fetch()
  await cacheSet(key, value, ttlSeconds)
  return value
}
