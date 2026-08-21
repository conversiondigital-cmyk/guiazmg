// Cliente Redis compartido para la API móvil (cache de estado de usuario del
// guard, códigos de un solo uso de webview-session). Mismo patrón que
// `src/lib/security/rate-limit.ts`: si `REDIS_URL` no está seteada, o la
// conexión falla, se devuelve `null` y el llamador decide cómo degradar (en el
// guard: consulta directa a Prisma, NUNCA confiar ciegamente en el JWT).
type RedisClient = Awaited<ReturnType<typeof import("redis").createClient>>

const globalForMobileRedis = globalThis as unknown as {
  mobileRedisClientPromise: Promise<RedisClient | null> | null
}

export function getMobileRedisClient(): Promise<RedisClient | null> {
  if (!process.env.REDIS_URL) return Promise.resolve(null)

  if (!globalForMobileRedis.mobileRedisClientPromise) {
    globalForMobileRedis.mobileRedisClientPromise = (async () => {
      try {
        const { createClient } = await import("redis")
        const client = createClient({
          url: process.env.REDIS_URL,
          socket: { connectTimeout: 1500, reconnectStrategy: () => false },
        })
        client.on("error", () => {})
        await client.connect()
        return client
      } catch {
        globalForMobileRedis.mobileRedisClientPromise = null
        return null
      }
    })()
  }

  return globalForMobileRedis.mobileRedisClientPromise
}
