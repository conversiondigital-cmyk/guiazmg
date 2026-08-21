/**
 * Estado de sesión que consume `client.ts` para autenticar peticiones y
 * reaccionar a `TOKEN_EXPIRED`/`SESSION_REVOKED`.
 *
 * Reparto deliberado de dónde vive cada token:
 * - `refreshToken` → `expo-secure-store` (Keychain/Keystore): es lo único que
 *   sobrevive a que se mate el proceso, así que es lo único que vale la pena
 *   proteger con almacenamiento cifrado nativo.
 * - `accessToken` → SOLO memoria de proceso (variable de módulo). Vive 15 min
 *   (`expiresIn`), así que perderlo al matar la app no cuesta nada: el
 *   arranque siguiente lo repone con un refresh. Guardarlo en disco sería
 *   superficie de ataque sin beneficio.
 *
 * Refresco con cola: si N peticiones concurrentes reciben `TOKEN_EXPIRED` a la
 * vez, TODAS comparten la misma promesa de refresh (`refreshInFlight`) en vez
 * de disparar N llamadas a `/auth/refresh` en paralelo. Es necesario porque el
 * refresh ROTA (el token viejo se invalida al usarse): si dos requests
 * refrescaran en paralelo, la segunda usaría un refresh token ya quemado por
 * la primera y el backend lo trataría como `REFRESH_REUSED` → sesión cerrada
 * sola. Ver `rotateRefreshToken` en el backend.
 */
import * as SecureStore from 'expo-secure-store';

import type { AuthTokenPair, AuthUser } from './types';

const REFRESH_TOKEN_KEY = 'guiazmg:refresh-token';
/** Cache local (no sensible: solo para pintar la UI de inmediato al abrir la app) del último usuario autenticado. */
const CACHED_USER_KEY = 'guiazmg:cached-user';

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;

type SessionListener = (user: AuthUser | null) => void;
let sessionListener: SessionListener | null = null;

type SessionRevokedListener = () => void;
let sessionRevokedListener: SessionRevokedListener | null = null;

/** El `AuthProvider` se suscribe aquí para reaccionar a cambios de sesión disparados desde `client.ts` (fuera de React). */
export function setSessionListener(listener: SessionListener | null): void {
  sessionListener = listener;
}

export function onSessionRevoked(listener: SessionRevokedListener | null): void {
  sessionRevokedListener = listener;
}

export function notifySessionRevoked(): void {
  sessionRevokedListener?.();
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** `true` si el access token en memoria sigue vigente (con 10s de margen para relojes/latencia). */
export function hasFreshAccessToken(): boolean {
  return Boolean(accessToken) && Date.now() < accessTokenExpiresAt - 10_000;
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Guarda el par de tokens tras login/register/refresh y notifica al `AuthProvider`. */
export async function setSession(tokens: AuthTokenPair, user: AuthUser): Promise<void> {
  accessToken = tokens.accessToken;
  accessTokenExpiresAt = Date.now() + tokens.expiresIn * 1000;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  await cacheUser(user);
  sessionListener?.(user);
}

/** Actualiza solo el par de tokens (resultado de `/auth/refresh`), sin tocar el usuario cacheado. */
async function setTokensOnly(tokens: AuthTokenPair): Promise<void> {
  accessToken = tokens.accessToken;
  accessTokenExpiresAt = Date.now() + tokens.expiresIn * 1000;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

/** Actualiza SOLO el usuario cacheado (p.ej. tras `/auth/me` al arrancar), sin tocar los tokens ya vigentes. */
export async function updateCachedUser(user: AuthUser): Promise<void> {
  await cacheUser(user);
  sessionListener?.(user);
}

async function cacheUser(user: AuthUser | null): Promise<void> {
  try {
    if (user) {
      await SecureStore.setItemAsync(CACHED_USER_KEY, JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync(CACHED_USER_KEY);
    }
  } catch {
    // Cache best-effort: si falla, el próximo arranque simplemente no
    // precarga el usuario mientras `/auth/me` resuelve.
  }
}

/** Usuario cacheado de la última sesión (para pintar la UI de inmediato mientras `/auth/me` confirma). */
export async function getCachedUser(): Promise<AuthUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(CACHED_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/** Limpia todo rastro de sesión local (no llama al backend — eso lo hace `useAuth().signOut`). */
export async function clearSession(): Promise<void> {
  accessToken = null;
  accessTokenExpiresAt = 0;
  await Promise.all([
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
    cacheUser(null),
  ]);
  sessionListener?.(null);
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Intercambia el refresh token por un access token nuevo. Deduplicado: si ya
 * hay un refresh en curso, todas las llamadas concurrentes esperan la MISMA
 * promesa en vez de rotar el token dos veces (ver nota de arriba).
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function doRefresh(): Promise<string | null> {
  const currentRefreshToken = await getRefreshToken();
  if (!currentRefreshToken) return null;

  try {
    // Import perezoso para evitar un ciclo `client.ts` <-> `auth-tokens.ts`
    // (client.ts importa este módulo; este módulo necesita `apiClient.post`).
    const { apiClient } = await import('./client');
    const response = await apiClient.post<AuthTokenPair>('/auth/refresh', {
      refreshToken: currentRefreshToken,
    });
    await setTokensOnly(response);
    return response.accessToken;
  } catch {
    // INVALID_REFRESH / REFRESH_EXPIRED / REFRESH_REUSED / SESSION_REVOKED /
    // red caída: en todos los casos el resultado práctico es el mismo, "no se
    // pudo refrescar" — `client.ts` decide el logout duro con este `null`.
    return null;
  }
}
