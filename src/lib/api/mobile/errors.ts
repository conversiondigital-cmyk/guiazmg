// Catálogo de códigos de error de la API móvil (namespace /api/mobile/v1/*).
//
// REGLA DURA: los valores de `MobileErrorCode` son estables dentro de v1 y JAMÁS
// cambian de significado. Hay apps instaladas en teléfonos de usuarios reales que
// no se pueden forzar a actualizar de un día para otro: si un código empieza a
// significar algo distinto, una app vieja puede tomar una decisión de UX
// incorrecta (p. ej. cerrar sesión cuando en realidad debía mostrar "reintenta").
// Si algún día un código deja de tener sentido, se AGREGA uno nuevo, nunca se
// reutiliza ni resignifica el existente.

export type MobileErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "TOKEN_EXPIRED"
  | "SESSION_REVOKED"
  | "INVALID_CREDENTIALS"
  | "INVALID_REFRESH"
  | "REFRESH_EXPIRED"
  | "REFRESH_REUSED"
  | "CONSENT_REQUIRED"
  | "EMAIL_NOT_VERIFIED"
  | "ACCOUNT_DISABLED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "APP_VERSION_UNSUPPORTED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"

// Código HTTP que le corresponde a cada error. Se usa como default en `fail()`
// de `respond.ts`, aunque el llamador siempre puede pasar el status explícito.
export const MOBILE_ERROR_HTTP_STATUS: Record<MobileErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  TOKEN_EXPIRED: 401,
  SESSION_REVOKED: 401,
  INVALID_CREDENTIALS: 401,
  INVALID_REFRESH: 401,
  REFRESH_EXPIRED: 401,
  REFRESH_REUSED: 401,
  CONSENT_REQUIRED: 403,
  EMAIL_NOT_VERIFIED: 403,
  ACCOUNT_DISABLED: 403,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  APP_VERSION_UNSUPPORTED: 426,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
}

// Constantes individuales por si algún handler prefiere importar el literal en
// vez de escribirlo a mano (evita typos silenciosos, p. ej. "UNAUTHORIZED").
export const MOBILE_ERROR_CODES: { [K in MobileErrorCode]: K } = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  SESSION_REVOKED: "SESSION_REVOKED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  INVALID_REFRESH: "INVALID_REFRESH",
  REFRESH_EXPIRED: "REFRESH_EXPIRED",
  REFRESH_REUSED: "REFRESH_REUSED",
  CONSENT_REQUIRED: "CONSENT_REQUIRED",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  APP_VERSION_UNSUPPORTED: "APP_VERSION_UNSUPPORTED",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
}
