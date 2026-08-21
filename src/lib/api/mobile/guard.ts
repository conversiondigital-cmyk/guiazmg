// Guard de autenticación para rutas privadas del namespace móvil
// (/api/mobile/v1/*). El proxy YA NO redirige este namespace a /auth/login
// (ver `src/proxy.ts`, allowlist `publicPrefixPaths`): cada handler que
// requiera sesión debe llamar a `requireMobileAuth` explícitamente y devolver
// su resultado si falla.
//
// ESTADO EN B0 (esta fase): todavía no existe emisión de tokens propios (eso
// es B1 — login móvil con access/refresh token). Por ahora este guard solo
// verifica que venga un header `Authorization: Bearer <token>` y así prueba
// el contrato de transporte (401 JSON, nunca HTML) sin implementar todavía la
// verificación criptográfica real.
//
// PUNTO DE EXTENSIÓN PARA B1 (no implementar aquí todavía):
//   1. Verificar la firma del JWT propio con `jose` (ya disponible vía
//      next-auth) usando un secreto/clave dedicados al namespace móvil — NO
//      reutilizar `AUTH_SECRET` de la sesión web para no acoplar la rotación
//      de ambos sistemas.
//   2. Revisar `exp` → si venció, `fail("TOKEN_EXPIRED", 401, ...)`.
//   3. Cachear en Redis (TTL 60s, misma ventana que `REVALIDATE_MS` en
//      `src/lib/auth.ts`) el estado `{ isActive, sessionVersion }` del user
//      del token, para no pegarle a Postgres en cada request autenticado.
//   4. Comparar `sessionVersion` del token contra el valor fresco (cache o
//      BD): si no coincide, la sesión fue revocada en otro lado (logout
//      global, cambio de password, admin desactivó al usuario) →
//      `fail("SESSION_REVOKED", 401, ...)`.
//   5. Adjuntar `{ userId, role }` ya verificados al resultado para que el
//      handler no vuelva a tocar el token.
import type { NextRequest } from "next/server"
import { fail } from "./respond"

export interface MobileAuthContext {
  userId: string
  role?: string
}

export type MobileAuthResult =
  | { ok: true; auth: MobileAuthContext }
  | { ok: false; response: ReturnType<typeof fail> }

const BEARER_PREFIX = "Bearer "

export async function requireMobileAuth(req: NextRequest): Promise<MobileAuthResult> {
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

  // TODO(B1): reemplazar este stub por la verificación real descrita arriba.
  // A propósito NO se decodifica ni se confía en el token todavía: B0 solo
  // necesita demostrar que el 401 llega como JSON y que el proxy ya no
  // intercepta la ruta con un redirect HTML a /auth/login.
  return {
    ok: false,
    response: fail("UNAUTHENTICATED", 401, "Verificación de token pendiente de implementar (B1)."),
  }
}
