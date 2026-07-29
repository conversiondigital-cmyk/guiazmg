// Mantiene "despierta" la base Redis (Upstash): sin tráfico, Upstash la archiva
// por inactividad. Se llama desde un cron diario para que reciba un latido cada
// día. Nunca lanza (un fallo aquí no debe romper el cron).
export async function touchRedis(): Promise<boolean> {
  const url = process.env.REDIS_URL
  if (!url) return false
  try {
    const { createClient } = await import("redis")
    const client = createClient({
      url: url.replace(/^redis:\/\//, "rediss://"), // Upstash requiere TLS
      socket: { connectTimeout: 4000, reconnectStrategy: () => false },
    })
    client.on("error", () => {})
    await client.connect()
    // Clave con expiración: registra actividad sin acumular datos.
    await client.set("keepalive:guiazmg", String(Date.now()), { EX: 7 * 24 * 60 * 60 })
    await client.disconnect()
    return true
  } catch {
    return false
  }
}
