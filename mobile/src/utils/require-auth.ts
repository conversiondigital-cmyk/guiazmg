/**
 * Gate de sesión para acciones que la requieren (guardar en favoritos,
 * escribir reseña). Si hay sesión, ejecuta la acción de inmediato. Si no,
 * navega a login CONSERVANDO LA INTENCIÓN: `next` es la ruta actual con un
 * parámetro `autoIntent` añadido, así que al volver de iniciar sesión la
 * MISMA pantalla puede completar la acción que el usuario quería hacer en vez
 * de dejarlo de vuelta en el inicio.
 */
import { useRouter, useSegments } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/api/auth-context';

export function useRequireAuth() {
  const { user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const requireAuth = useCallback(
    (action: () => void, options?: { intent?: string; currentPath?: string }) => {
      if (user) {
        action();
        return;
      }
      const path = options?.currentPath ?? `/${segments.join('/')}`;
      const separator = path.includes('?') ? '&' : '?';
      const next = options?.intent ? `${path}${separator}autoIntent=${encodeURIComponent(options.intent)}` : path;
      router.push({ pathname: '/auth/login', params: { next } });
    },
    [user, router, segments],
  );

  return { requireAuth, isAuthenticated: Boolean(user) };
}
