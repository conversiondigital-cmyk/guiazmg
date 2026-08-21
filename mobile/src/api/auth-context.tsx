/**
 * Sesión real de la app (fase A2). `AuthProvider` hidrata al arrancar (usuario
 * cacheado primero para pintar sin parpadeo, luego confirma contra
 * `/auth/me`), expone `useAuth()` a toda la app, y reacciona a logout duro
 * disparado desde `client.ts` (`SESSION_REVOKED` sin poder refrescar).
 */
import { useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { apiClient, ApiError } from './client';
import * as authTokens from './auth-tokens';
import { getDeviceId } from './device-id';
import type { AuthMeResponse, AuthTokenPair, AuthUser, LoginResponse } from './types';

export type ConsentInput = {
  acceptedTermsAt: string;
  acceptedPrivacyAt: string;
  acceptedCommunityAt: string;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
} & ConsentInput;

type AuthContextValue = {
  user: AuthUser | null;
  /** `true` mientras se resuelve la sesión al arrancar (usuario cacheado + `/auth/me`). Nunca queda colgado: siempre resuelve a `true`/`false`. */
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchDeviceMeta() {
  const deviceId = await getDeviceId();
  return { deviceId, platform: 'android' as const };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Evita que dos logouts duros concurrentes (dos requests fallando a la vez)
  // disparen la navegación/alerta dos veces.
  const loggingOutRef = useRef(false);

  useEffect(() => {
    authTokens.setSessionListener(setUser);
    return () => authTokens.setSessionListener(null);
  }, []);

  const hardLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    try {
      await authTokens.clearSession();
      queryClient.clear();
      router.replace('/auth/login');
    } finally {
      loggingOutRef.current = false;
    }
  }, [queryClient, router]);

  useEffect(() => {
    authTokens.onSessionRevoked(() => {
      void hardLogout();
    });
    return () => authTokens.onSessionRevoked(null);
  }, [hardLogout]);

  // Arranque: pinta el usuario cacheado de inmediato (sin esperar red), y en
  // paralelo confirma/refresca contra el backend. Si no hay refresh token
  // guardado, no hay nada que confirmar — resuelve directo a "sin sesión".
  useEffect(() => {
    let mounted = true;
    (async () => {
      const cached = await authTokens.getCachedUser();
      if (mounted && cached) setUser(cached);

      const refreshToken = await authTokens.getRefreshToken();
      if (!refreshToken) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const accessToken = await authTokens.refreshAccessToken();
        if (!accessToken) throw new Error('no-token');
        const me = await apiClient.get<AuthMeResponse>('/auth/me');
        if (mounted) setUser(me);
        await authTokens.updateCachedUser(me);
      } catch {
        // Refresh token inválido/expirado/reusado, o `/auth/me` falló de
        // forma no recuperable: sesión honesta = sin sesión, nunca fingir que
        // sigue activa.
        await authTokens.clearSession();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const meta = await fetchDeviceMeta();
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
      deviceId: meta.deviceId,
      platform: meta.platform,
    });
    await authTokens.setSession(response, response.user);
    setUser(response.user);
    return response.user;
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    await apiClient.post('/auth/register', {
      name: input.name,
      email: input.email,
      password: input.password,
      acceptedTermsAt: input.acceptedTermsAt,
      acceptedPrivacyAt: input.acceptedPrivacyAt,
      acceptedCommunityAt: input.acceptedCommunityAt,
    });
    // El registro NO regresa tokens (mismo flujo que la web: puede requerir
    // verificación de correo). Se hace login inmediatamente después para que
    // la app no deje al usuario "creado pero afuera".
    await signIn(input.email, input.password);
  }, [signIn]);

  const signOut = useCallback(async () => {
    const refreshToken = await authTokens.getRefreshToken();
    await authTokens.clearSession();
    setUser(null);
    queryClient.clear();
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch {
        // El logout del lado del servidor es best-effort desde el cliente:
        // si la red falla, la sesión LOCAL ya está limpia (lo que importa
        // para este dispositivo); el refresh token de todas formas expira solo.
      }
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, signIn, signUp, signOut }),
    [user, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() debe usarse dentro de <AuthProvider>. Revisa src/app/_layout.tsx.');
  return ctx;
}

/** Códigos de error que `login.tsx`/`registro.tsx` traducen a mensaje humano. Re-exportado para no importar `ApiError` en cada pantalla. */
export { ApiError };
