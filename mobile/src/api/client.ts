/**
 * Cliente HTTP de la API móvil de Guía ZMG.
 *
 * Entiende el contrato `{ ok:true, data, meta }` / `{ ok:false, error }`
 * (ver `types.ts`). Cuando `EXPO_PUBLIC_USE_MOCKS=true` (default en A0,
 * porque `/api/mobile/v1` todavía no existe en el backend), las llamadas se
 * resuelven contra `mocks/` en vez de hacer red real — mismo shape de
 * respuesta, así que apagar el mock más adelante es un solo flag.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { onSessionRevoked as registerSessionRevokedListener } from './auth-tokens';
import * as authTokens from './auth-tokens';
import { apiConfig } from './config';
import { getDeviceId } from './device-id';
import { resolveMock } from './mocks';
import type { ApiErrorCode, ApiResponse } from './types';

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
  const accessToken = await authTokens.getAccessToken();

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
  const query = buildQueryString(options.query);

  if (apiConfig.useMocks) {
    const mockResponse = (await resolveMock(path, query)) as ApiResponse<T> | null;
    if (!mockResponse) {
      throw new ApiError('NOT_FOUND', `No hay mock definido para ${path}. Agrégalo en src/api/mocks/.`);
    }
    return unwrap(mockResponse);
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

  let payload: ApiResponse<T>;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError('SERVER_ERROR', 'El servidor respondió algo inesperado. Intenta de nuevo.');
  }

  if (payload.ok) {
    return unwrap(payload);
  }

  const { code, message } = payload.error;

  if (code === 'TOKEN_EXPIRED' && !options.skipAuthRetry) {
    const newAccessToken = await authTokens.refreshAccessToken();
    if (newAccessToken) {
      return request<T>(path, { ...options, skipAuthRetry: true });
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
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
