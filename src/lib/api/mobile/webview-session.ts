// Código opaco de un solo uso para el handoff app→webview (p. ej. abrir una
// pantalla del sitio web dentro de un WebView ya autenticado, sin exponer el
// access token de larga vida en una URL que puede quedar en logs/historial).
//
// Vida MUY corta (60s) y de un solo uso: se quema (borra) en cuanto se
// consume, exista o no la página `/auth/handoff` que lo consuma (esa página
// es de la Fase A2, fuera de este alcance — aquí solo el emisor/verificador).
//
// Se guarda en Redis si está disponible; si no, cae a un mapa en memoria del
// proceso (aceptable en dev: un código de 60s no necesita sobrevivir un
// restart, y en producción `REDIS_URL` es obligatorio para todo lo demás).
import { randomBytes } from "node:crypto"
import { getMobileRedisClient } from "./redis-client"

const CODE_TTL_SECONDS = 60

function keyFor(code: string): string {
  return `mobile:webview-session:${code}`
}

const memoryStore = new Map<string, { userId: string; expiresAt: number }>()

function cleanupMemoryStore(): void {
  const now = Date.now()
  for (const [code, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(code)
  }
}

export async function issueWebViewCode(userId: string): Promise<{ code: string; expiresIn: number }> {
  const code = randomBytes(24).toString("base64url")
  const redis = await getMobileRedisClient()

  if (redis) {
    try {
      await redis.set(keyFor(code), userId, { EX: CODE_TTL_SECONDS })
      return { code, expiresIn: CODE_TTL_SECONDS }
    } catch {
      // cae a memoria abajo
    }
  }

  cleanupMemoryStore()
  memoryStore.set(code, { userId, expiresAt: Date.now() + CODE_TTL_SECONDS * 1000 })
  return { code, expiresIn: CODE_TTL_SECONDS }
}

// Consume (quema) el código: si es válido, lo borra y devuelve el userId; si
// no existe o ya expiró, devuelve null. Un solo uso SIEMPRE, incluso si dos
// requests llegan casi al mismo tiempo (get+del no es perfectamente atómico
// contra una carrera, pero la ventana de 60s y el uso esperado — un solo
// consumidor, el WebView que se abre una vez — hacen el riesgo aceptable).
export async function consumeWebViewCode(code: string): Promise<{ userId: string } | null> {
  const redis = await getMobileRedisClient()

  if (redis) {
    try {
      // SEGURIDAD (fix un-solo-uso): get+del NO es atómico — dos consumos
      // concurrentes podían leer ambos el mismo código antes del del y canjear
      // DOS sesiones web (secuestro de sesión). GETDEL es atómico: solo un
      // consumidor recibe el userId, el resto obtiene null. Si el servidor Redis
      // es viejo y no soporta GETDEL, se cae al get+del de respaldo.
      let userId: string | null
      const anyRedis = redis as unknown as { getDel?: (k: string) => Promise<string | null> }
      if (typeof anyRedis.getDel === "function") {
        userId = await anyRedis.getDel(keyFor(code))
      } else {
        userId = await redis.get(keyFor(code))
        if (userId) await redis.del(keyFor(code))
      }
      if (!userId) return null
      return { userId }
    } catch {
      // cae a memoria abajo
    }
  }

  cleanupMemoryStore()
  const entry = memoryStore.get(code)
  if (!entry || entry.expiresAt <= Date.now()) return null
  memoryStore.delete(code)
  return { userId: entry.userId }
}
