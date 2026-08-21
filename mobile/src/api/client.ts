/**
 * Cliente HTTP de la API móvil de Guía ZMG.
 *
 * Entiende el contrato `{ ok:true, data, meta }` / `{ ok:false, error }`
 * (ver `types.ts`). Por defecto habla con `/api/mobile/v1` REAL por HTTP.
 * `EXPO_PUBLIC_USE_MOCKS=true` es opt-in explícito para desarrollar la UI sin
 * backend a la mano — resuelve contra `mocks/` con el mismo shape de
 * respuesta, nunca es el camino por defecto.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { onSessionRevoked as registerSessionRevokedListener } from './auth-tokens';
import * as authTokens from './auth-tokens';
import { apiConfig } from './config';
import { getDeviceId } from './device-id';
import { resolveMock } from './mocks';
import type { ApiErrorCode, ApiMeta, ApiResponse } from './types';

export class ApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Salta el reintento automático de refresh de token (lo usa el propio refresh). */
  skipAuthRetry?: boolean;
};

const appVersion = Constants.expoConfig?.version ?? '0.0.0';

function buildQueryString(query?: RequestOptions['query']): URLSearchParams {
  const params = new URLSearchParams();
  if (!query) return params;
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params;
}

async function buildHeaders(): Promise<Record<string, string>> {
  const deviceId = await getDeviceId();
  const accessToken = authTokens.getAccessToken();

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-App-Version': appVersion,
    'X-Platform': Platform.OS,
    'X-Device-Id': deviceId,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

/**
 * Punto único de entrada: hace la llamada (real o mock) y devuelve `data` ya
 * desempaquetado, o lanza `ApiError` con el `code` estable del contrato.
 *
 * Maneja `TOKEN_EXPIRED` refrescando UNA vez y reintentando la llamada
 * original; `SESSION_REVOKED` dispara el listener de logout duro (ver
 * `auth-tokens.ts`) y lanza de inmediato, sin reintentar.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const payload = await requestRaw<T>(path, options);
  return unwrap(payload);
}

/**
 * Igual que `request`, pero devuelve `{ data, meta }` en vez de solo `data`.
 * Lo usan las listas con scroll infinito (`meta.hasMore`/`meta.page`) — ver
 * `useInfiniteQuery` en `queries.ts`. `request()` sigue siendo lo que usa
 * todo lo demás (no rompe consumidores existentes).
 */
export async function requestPage<T>(path: string, options: RequestOptions = {}): Promise<{ data: T; meta: ApiMeta }> {
  const payload = await requestRaw<T>(path, options);
  return { data: unwrap(payload), meta: payload.ok ? (payload.meta ?? {}) : {} };
}

async function requestRaw<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const query = buildQueryString(options.query);

  if (apiConfig.useMocks) {
    const mockResponse = (await resolveMock(path, query)) as ApiResponse<T> | null;
    if (!mockResponse) {
      throw new ApiError('NOT_FOUND', `No hay mock definido para ${path}. Agrégalo en src/api/mocks/.`);
    }
    return mockResponse;
  }

  const url = new URL(path.replace(/^\//, ''), `${apiConfig.apiUrl.replace(/\/$/, '')}/api/mobile/v1/`);
  query.forEach((value, key) => url.searchParams.set(key, value));

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      headers: await buildHeaders(),
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'No hay conexión a internet. Revisa tu red e intenta de nuevo.');
  }

  // Algunos endpoints (p.ej. `/auth/logout`) responden 204 sin cuerpo cuando
  // todo salió bien — `response.json()` lanza sobre un body vacío, así que
  // eso NO es un error del servidor, es éxito sin datos. Sin este caso, todo
  // 204 se reportaba como `INTERNAL_ERROR` aunque la operación sí funcionó.
  if (response.status === 204) {
    return { ok: true, data: undefined as T };
  }

  const rawBody = await response.text();
  if (!rawBody) {
    return { ok: true, data: undefined as T };
  }

  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new ApiError('INTERNAL_ERROR', 'El servidor respondió algo inesperado. Intenta de nuevo.');
  }

  if (payload.ok) {
    return payload;
  }

  const { code, message } = payload.error;

  if (code === 'TOKEN_EXPIRED' && !options.skipAuthRetry) {
    const newAccessToken = await authTokens.refreshAccessToken();
    if (newAccessToken) {
      return requestRaw<T>(path, { ...options, skipAuthRetry: true });
    }
    authTokens.notifySessionRevoked();
    throw new ApiError('SESSION_REVOKED', 'Tu sesión expiró. Vuelve a iniciar sesión.');
  }

  if (code === 'SESSION_REVOKED') {
    authTokens.notifySessionRevoked();
  }

  throw new ApiError(code, message);
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.ok) {
    throw new ApiError(response.error.code, response.error.message);
  }
  return response.data;
}

/** Suscribe un callback global a "sesión cerrada por el servidor" (ver auth-tokens.ts). */
export const onSessionRevoked = registerSessionRevokedListener;

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'GET', query }),
  getPage: <T>(path: string, query?: RequestOptions['query']) => requestPage<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
