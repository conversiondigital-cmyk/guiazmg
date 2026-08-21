// Emisión y verificación de tokens de la API móvil (Fase B1).
//
// Access token: JWT HS256 firmado con `MOBILE_JWT_SECRET` (secreto DEDICADO,
// distinto de `AUTH_SECRET` de la sesión web — aísla el radio de impacto si
// alguno de los dos se filtra). Vida corta (15 min) a propósito: si un access
// token se roba, el daño está acotado a esa ventana.
//
// Refresh token: opaco (32 bytes aleatorios en base64url), NO es un JWT. Se
// entrega tal cual al cliente pero en la base de datos se guarda solo su hash
// SHA-256 — así un dump de la tabla `mobile_refresh_tokens` no sirve para
// suplantar sesiones. SHA-256 y no bcrypt a propósito: el valor ya tiene alta
// entropía (256 bits), no necesita un KDF lento pensado para contraseñas
// humanas de baja entropía; usar bcrypt aquí solo agregaría costo de CPU sin
// beneficio real (y además trunca a 72 bytes).
import { SignJWT, jwtVerify, errors as joseErrors } from "jose"
import { randomBytes, createHash } from "node:crypto"

const ISSUER = "guiazmg"
const AUDIENCE = "guiazmg-mobile"

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
export const REFRESH_TOKEN_TTL_MS = 60 * 24 * 60 * 60 * 1000 // 60 días

function getSecretKey(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET
  if (!secret) {
    throw new Error("MOBILE_JWT_SECRET no está configurado")
  }
  return new TextEncoder().encode(secret)
}

export interface MobileAccessTokenClaims {
  sub: string
  email: string
  role: string
  sv: number
  act: boolean
}

export async function signMobileAccessToken(claims: MobileAccessTokenClaims): Promise<string> {
  return new SignJWT({
    email: claims.email,
    role: claims.role,
    sv: claims.sv,
    act: claims.act,
    typ: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(getSecretKey())
}

export type VerifyAccessTokenResult =
  | { ok: true; payload: MobileAccessTokenClaims & { iat: number; exp: number } }
  | { ok: false; reason: "expired" | "invalid" }

export async function verifyMobileAccessToken(token: string): Promise<VerifyAccessTokenResult> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    if (payload.typ !== "access" || typeof payload.sub !== "string") {
      return { ok: false, reason: "invalid" }
    }
    return {
      ok: true,
      payload: {
        sub: payload.sub,
        email: String(payload.email ?? ""),
        role: String(payload.role ?? ""),
        sv: Number(payload.sv ?? 0),
        act: !!payload.act,
        iat: Number(payload.iat ?? 0),
        exp: Number(payload.exp ?? 0),
      },
    }
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      return { ok: false, reason: "expired" }
    }
    return { ok: false, reason: "invalid" }
  }
}

// --- Refresh token opaco -----------------------------------------------

export function generateOpaqueRefreshToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function newFamilyId(): string {
  return randomBytes(16).toString("hex")
}
