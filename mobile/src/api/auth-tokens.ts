/**
 * Punto de extensión de autenticación para `client.ts`.
 *
 * La autenticación real (login, registro, refresh token) llega en la fase
 * A2 del roadmap. Este módulo existe ya para que el cliente HTTP tenga
 * ALGO a lo que llamar en `TOKEN_EXPIRED` / `SESSION_REVOKED` sin tener que
 * reescribir `client.ts` cuando A2 aterrice: solo hay que rellenar estas
 * funciones (guardar/leer de `expo-secure-store`, llamar al endpoint real de
 * refresh) y todo lo demás sigue funcionando igual.
 */
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'guiazmg:access-token';
const REFRESH_TOKEN_KEY = 'guiazmg:refresh-token';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

/**
 * Intercambia el refresh token por un access token nuevo. TODO(A2): reemplazar
 * por la llamada real a `/api/mobile/v1/auth/refresh`. Por ahora no hay
 * backend de auth, así que devuelve `null` (falla) — el cliente lo trata como
 * "no se pudo refrescar" y sigue el flujo de `SESSION_REVOKED`.
 */
export async function refreshAccessToken(): Promise<string | null> {
  return null;
}

/**
 * Se dispara cuando el backend responde `SESSION_REVOKED` (logout duro, p.ej.
 * contraseña cambiada en otro dispositivo). TODO(A2): conectar con el store
 * de sesión real para redirigir a login y limpiar estado de usuario.
 */
type SessionRevokedListener = () => void;
let sessionRevokedListener: SessionRevokedListener | null = null;

export function onSessionRevoked(listener: SessionRevokedListener): void {
  sessionRevokedListener = listener;
}

export function notifySessionRevoked(): void {
  sessionRevokedListener?.();
}
