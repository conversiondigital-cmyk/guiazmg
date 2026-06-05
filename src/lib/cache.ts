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

async function getRedisClient() {
  try {
    const { createClient } = await import("redis")
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("REDIS_URL must be configured in production")
      }
      return null
    }
    const client = createClient({ url: redisUrl })
    await client.connect()
    return client
  } catch {
    return null
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = process.env.REDIS_URL ? await getRedisClient() : null
  if (redis) {
    try {
      const raw = await redis.get(key)
      await redis.quit().catch(() => {})
      return raw ? JSON.parse(raw) : null
    } catch {
      await redis.quit().catch(() => {})
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
  const redis = process.env.REDIS_URL ? await getRedisClient() : null
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), { EX: ttl })
      await redis.quit().catch(() => {})
      return
    } catch {
      await redis.quit().catch(() => {})
    }
  }
  memoryStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 })
}

export async function cacheDelete(pattern: string): Promise<void> {
  const redis = process.env.REDIS_URL ? await getRedisClient() : null
  if (redis) {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) await redis.del(keys)
      await redis.quit().catch(() => {})
    } catch {
      await redis.quit().catch(() => {})
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
