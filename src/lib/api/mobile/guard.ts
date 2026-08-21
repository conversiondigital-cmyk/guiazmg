// Guard de autenticación para rutas privadas del namespace móvil
// (/api/mobile/v1/*). El proxy YA NO redirige este namespace a /auth/login
// (ver `src/proxy.ts`, allowlist `publicPrefixPaths`): cada handler que
// requiera sesión debe llamar a `requireMobileAuth` explícitamente y devolver
// su resultado si falla.
//
// FASE B1 (implementación real):
//   1. Verifica la firma del access token (JWT propio, `MOBILE_JWT_SECRET`,
//      NO el `AUTH_SECRET` de la sesión web) con `verifyMobileAccessToken`.
//   2. Expirado → 401 TOKEN_EXPIRED (código DISTINTO de UNAUTHENTICATED: el
//      cliente nativo usa esa diferencia para refrescar en vez de desloguear).
//   3. Estado del usuario cacheado en Redis 60s (misma ventana que el
//      callback `jwt` de `src/lib/auth.ts`) para no pegarle a Postgres en cada
//      request autenticado. Si Redis está caído, degrada a consulta DIRECTA a
//      Prisma — nunca a "confiar en el JWT" tal cual venía firmado.
//   4. `sessionVersion` del token vs. el valor fresco no coincide, o el
//      usuario ya no está activo → 401 SESSION_REVOKED (mismo mecanismo de
//      revocación que ya usa la web: bumpear `User.sessionVersion` mata sesión
//      web y móvil a la vez).
//   5. `opts.requireConsent` sin términos aceptados → 403 CONSENT_REQUIRED.
//   6. `opts.roles` sin el rol requerido → 403 FORBIDDEN.
import type { NextRequest } from "next/server"
import { fail } from "./respond"
import { verifyMobileAccessToken } from "./tokens"
import { getMobileRedisClient } from "./redis-client"
import { prisma } from "@/lib/prisma"

export interface MobileAuthContext {
  userId: string
  email: string
  role: string
  acceptedTerms: boolean
}

export type MobileAuthResult =
  | { ok: true; auth: MobileAuthContext }
  | { ok: false; response: ReturnType<typeof fail> }

export interface RequireMobileAuthOptions {
  requireConsent?: boolean
  roles?: string[]
}

const BEARER_PREFIX = "Bearer "
const USERSTATE_TTL_SECONDS = 60

interface CachedUserState {
  sv: number
  role: string
  active: boolean
  acceptedTerms: boolean
}

function userStateCacheKey(userId: string): string {
  return `mobile:userstate:${userId}`
}

async function fetchFreshUserState(userId: string): Promise<CachedUserState | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true, deletedAt: true, sessionVersion: true, acceptedTermsAt: true },
  })
  if (!user || !user.isActive || user.deletedAt) return null
  return {
    sv: user.sessionVersion,
    role: user.role,
    active: true,
    acceptedTerms: !!user.acceptedTermsAt,
  }
}

// Estado del usuario para el `sub` del token: intenta Redis (TTL 60s); si no
// hay Redis o falla, cae a consulta directa a Prisma (nunca a confiar
// ciegamente en los claims del JWT sin revalidar contra la BD).
async function getUserState(userId: string): Promise<CachedUserState | null> {
  const key = userStateCacheKey(userId)
  const redis = await getMobileRedisClient()

  if (redis) {
    try {
      const cached = await redis.get(key)
      if (cached) return JSON.parse(cached) as CachedUserState
    } catch {
      // sigue abajo: degrada a Prisma
    }

    const fresh = await fetchFreshUserState(userId)
    if (fresh) {
      try {
        await redis.set(key, JSON.stringify(fresh), { EX: USERSTATE_TTL_SECONDS })
      } catch {
        // cache best-effort; el request continúa con el valor fresco igual
      }
    }
    return fresh
  }

  return fetchFreshUserState(userId)
}

// Invalida el cache de estado de un usuario (p. ej. tras logout global o un
// cambio de rol/estado hecho por admin). Best-effort: si Redis no está
// disponible, la próxima lectura de todos modos cae a Prisma directo.
export async function invalidateMobileUserState(userId: string): Promise<void> {
  const redis = await getMobileRedisClient()
  if (!redis) return
  try {
    await redis.del(userStateCacheKey(userId))
  } catch {
    // no-op
  }
}

export async function requireMobileAuth(
  req: NextRequest,
  opts?: RequireMobileAuthOptions
): Promise<MobileAuthResult> {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization")

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    return {
      ok: false,
      response: fail("UNAUTHENTICATED", 401, "Falta el encabezado Authorization Bearer."),
    }
  }

  const token = header.slice(BEARER_PREFIX.length).trim()
  if (!token) {
    return {
      ok: false,
      response: fail("UNAUTHENTICATED", 401, "El token Bearer viene vacío."),
    }
  }

  const verified = await verifyMobileAccessToken(token)
  if (!verified.ok) {
    if (verified.reason === "expired") {
      return {
        ok: false,
        response: fail("TOKEN_EXPIRED", 401, "El access token expiró, usa /auth/refresh."),
      }
    }
    return {
      ok: false,
      response: fail("UNAUTHENTICATED", 401, "El token es inválido."),
    }
  }

  const { sub, sv, role: tokenRole } = verified.payload
  const state = await getUserState(sub)

  if (!state || !state.active || state.sv !== sv) {
    return {
      ok: false,
      response: fail("SESSION_REVOKED", 401, "La sesión fue revocada. Vuelve a iniciar sesión."),
    }
  }

  if (opts?.requireConsent && !state.acceptedTerms) {
    return {
      ok: false,
      response: fail("CONSENT_REQUIRED", 403, "Debes aceptar los términos y condiciones."),
    }
  }

  if (opts?.roles && opts.roles.length > 0 && !opts.roles.includes(state.role)) {
    return {
      ok: false,
      response: fail("FORBIDDEN", 403, "No tienes permiso para acceder a este recurso."),
    }
  }

  return {
    ok: true,
    auth: {
      userId: sub,
      email: verified.payload.email,
      role: state.role ?? tokenRole,
      acceptedTerms: state.acceptedTerms,
    },
  }
}
