/**
 * Configuración remota (`GET /config`, público, sin sesión). La app la
 * consulta al arrancar, ANTES de mostrar nada más pesado: es la palanca de
 * emergencia del dueño del producto para forzar actualización o avisar
 * mantenimiento sin depender de que Google/Apple aprueben un build nuevo.
 */
import { useQuery } from '@tanstack/react-query';

import { apiClient } from './client';
import type { AppRemoteConfig } from './types';

export function useAppConfig() {
  return useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiClient.get<AppRemoteConfig>('/config'),
    staleTime: 5 * 60 * 1000,
    // Si falla (sin red al abrir la app por primera vez), no bloqueamos al
    // usuario para siempre: `_layout.tsx` solo actúa sobre datos que sí
    // llegaron, nunca asume `forceUpdate`/`maintenanceMode` porque la
    // petición falló.
    retry: 2,
  });
}

/** Compara versiones semánticas simples (`"1.2.0" < "1.3.0"`). Suficiente para `minAppVersion`, no un SemVer completo (sin pre-release/build metadata). */
export function isVersionLower(current: string, minimum: string): boolean {
  const a = current.split('.').map((n) => Number(n) || 0);
  const b = minimum.split('.').map((n) => Number(n) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av < bv) return true;
    if (av > bv) return false;
  }
  return false;
}
