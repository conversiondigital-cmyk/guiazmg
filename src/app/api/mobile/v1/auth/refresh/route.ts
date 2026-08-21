// POST /api/mobile/v1/auth/refresh — rota un refresh token opaco por un par
// access+refresh nuevo. Detecta reuso (token ya rotado) y mata la familia
// entera en ese caso: es lo que hace aceptable guardar el refresh en el
// teléfono (ver `src/lib/api/mobile/refresh-tokens.ts`).
import type { NextRequest } from "next/server"
import { z } from "zod"
import { ok, fail } from "@/lib/api/mobile/respond"
import { rotateRefreshToken } from "@/lib/api/mobile/refresh-tokens"
import { enforceRateLimits, getClientIp } from "@/lib/security/request-rate-limit"

const refreshSchema = z.object({
  refreshToken: z.string().trim().min(1),
  deviceId: z.string().trim().max(200).optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail("VALIDATION_ERROR", 400, "El cuerpo debe ser JSON válido.")
  }

  const parsed = refreshSchema.safeParse(body)
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", 400, "Datos inválidos.", parsed.error.flatten())
  }

  const { refreshToken, deviceId } = parsed.data
  const ip = getClientIp(req)

  // Rate limit por IP primero (antes de saber a qué usuario pertenece el
  // token): protege contra sondeo masivo de refresh tokens robados/adivinados.
  const rateLimitedByIp = await enforceRateLimits([
    { key: `mobile:refresh:ip:${ip}`, windowMs: 60_000, maxRequests: 30 },
  ])
  if (rateLimitedByIp) {
    return fail("RATE_LIMITED", 429, "Demasiadas solicitudes. Intenta más tarde.")
  }

  const result = await rotateRefreshToken(refreshToken, {
    deviceId: deviceId ?? null,
    platform: null,
    appVersion: null,
    userAgent: req.headers.get("user-agent"),
    ip,
  })

  if (!result.ok) {
    switch (result.code) {
      case "INVALID_REFRESH":
        return fail("INVALID_REFRESH", 401, "El refresh token no es válido.")
      case "REFRESH_EXPIRED":
        return fail("REFRESH_EXPIRED", 401, "El refresh token expiró, inicia sesión de nuevo.")
      case "REFRESH_REUSED":
        return fail("REFRESH_REUSED", 401, "Este refresh token ya fue usado. Se cerró la sesión por seguridad.")
      case "SESSION_REVOKED":
        return fail("SESSION_REVOKED", 401, "La sesión fue revocada. Vuelve a iniciar sesión.")
    }
  }

  // Rate limit adicional por usuario, ya identificado tras la rotación exitosa.
  const rateLimitedByUser = await enforceRateLimits([
    { key: `mobile:refresh:${result.userId}`, windowMs: 60_000, maxRequests: 30 },
  ])
  if (rateLimitedByUser) {
    return fail("RATE_LIMITED", 429, "Demasiadas solicitudes. Intenta más tarde.")
  }

  return ok({
    accessToken: result.pair.accessToken,
    expiresIn: result.pair.expiresIn,
    refreshToken: result.pair.refreshToken,
    refreshExpiresAt: result.pair.refreshExpiresAt.toISOString(),
  })
}
