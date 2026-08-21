// POST /api/mobile/v1/auth/login — login por email/password de la app nativa.
// Reusa `verifyCredentials` (la MISMA validación que el login web) y emite un
// par access+refresh token propio del namespace móvil.
import type { NextRequest } from "next/server"
import { z } from "zod"
import { ok, fail } from "@/lib/api/mobile/respond"
import { verifyCredentials } from "@/lib/auth/credentials"
import { issueTokenPair } from "@/lib/api/mobile/refresh-tokens"
import { enforceRateLimits, getClientIp } from "@/lib/security/request-rate-limit"
import { prisma } from "@/lib/prisma"

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  deviceId: z.string().trim().max(200).optional(),
  platform: z.enum(["android", "ios"]).optional(),
  appVersion: z.string().trim().max(50).optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail("VALIDATION_ERROR", 400, "El cuerpo debe ser JSON válido.")
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", 400, "Datos inválidos.", parsed.error.flatten())
  }

  const { email, password, deviceId, platform, appVersion } = parsed.data
  const normalizedEmail = email.toLowerCase()

  // Mismas llaves que usa el login web (proxy sobre /api/auth/callback/credentials)
  // NO se reutilizan aquí a propósito: cada canal (web/móvil) tiene su propio
  // límite explícito, pero comparten el prefijo `auth:login:` para que un
  // atacante no pueda duplicar su presupuesto de intentos cambiando de canal.
  const ip = getClientIp(req)
  const rateLimited = await enforceRateLimits([
    { key: `auth:login:ip:${ip}`, windowMs: 60_000, maxRequests: 10 },
    { key: `auth:login:email:${normalizedEmail}`, windowMs: 60_000, maxRequests: 5 },
  ])
  if (rateLimited) {
    return fail("RATE_LIMITED", 429, "Demasiados intentos. Intenta más tarde.")
  }

  const credentialsUser = await verifyCredentials(normalizedEmail, password)
  if (!credentialsUser) {
    // Mensaje genérico a propósito: no distingue "no existe" de "contraseña
    // incorrecta" (evita enumeración de cuentas registradas).
    return fail("INVALID_CREDENTIALS", 401, "Correo o contraseña incorrectos.")
  }

  // `verifyCredentials` no expone `acceptedTermsAt` (no lo necesita el login
  // web). Una consulta extra y ligera por id para completar el claim `act` del
  // JWT y el flag `acceptedTerms` de la respuesta.
  const fresh = await prisma.user.findUnique({
    where: { id: credentialsUser.id },
    select: { acceptedTermsAt: true },
  })

  const userForToken = {
    id: credentialsUser.id,
    email: credentialsUser.email,
    role: credentialsUser.role,
    sessionVersion: credentialsUser.sessionVersion,
    acceptedTermsAt: fresh?.acceptedTermsAt ?? null,
  }

  const pair = await issueTokenPair(userForToken, {
    deviceId: deviceId ?? null,
    platform: platform ?? null,
    appVersion: appVersion ?? null,
    userAgent: req.headers.get("user-agent"),
    ip,
  })

  return ok({
    accessToken: pair.accessToken,
    expiresIn: pair.expiresIn,
    refreshToken: pair.refreshToken,
    refreshExpiresAt: pair.refreshExpiresAt.toISOString(),
    user: {
      id: credentialsUser.id,
      name: credentialsUser.name,
      email: credentialsUser.email,
      image: credentialsUser.image,
      role: credentialsUser.role,
      acceptedTerms: !!userForToken.acceptedTermsAt,
    },
  })
}
