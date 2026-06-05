import { createHmac, timingSafeEqual } from "node:crypto"

function getSecret(): string {
  const secret = process.env.CSRF_SECRET
  if (!secret) throw new Error("CSRF_SECRET environment variable is required")
  return secret
}

export function generateCsrfToken(sessionId: string): string {
  const secret = getSecret()
  const timestamp = Math.floor(Date.now() / 1000)
  const payload = `${sessionId}:${timestamp}`
  const hmac = createHmac("sha256", secret).update(payload).digest("hex")
  return `${timestamp}:${hmac}`
}

export function validateCsrfToken(token: string, sessionId: string): boolean {
  try {
    const secret = getSecret()
    const parts = token.split(":")
    if (parts.length !== 2) return false
    const [timestamp, hmac] = parts
    const payload = `${sessionId}:${timestamp}`
    const expected = createHmac("sha256", secret).update(payload).digest("hex")
    return timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))
  } catch {
    return false
  }
}

export function csrfProtection() {
  return async (request: Request): Promise<Response | null> => {
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return null
    const token = request.headers.get("Csrf-Token")
    const sessionId =
      request.headers.get("x-session-id") ||
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      ""
    if (!token || !sessionId || !validateCsrfToken(token, sessionId)) {
      return new Response(JSON.stringify({ error: "CSRF token inválido" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }
    return null
  }
}
