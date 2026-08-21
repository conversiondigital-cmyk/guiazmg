/**
 * Cliente y persistencia de React Query. Persistir en AsyncStorage permite
 * que, al reabrir la app sin conexión, las últimas listas/fichas vistas
 * sigan disponibles (aunque marcadas como datos viejos) en vez de una
 * pantalla en blanco.
 */
import { onlineManager, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { ApiError } from './client';

// Conecta React Query al estado REAL de la red del teléfono (no al
// `navigator.onLine` del navegador, que no existe en RN): mientras no hay
// red, las queries no reintentan en loop gastando batería, y en cuanto
// `NetInfo` confirma que volvió la conexión, dispara el reintento automático
// de todo lo que se quedó a medias (`onlineManager.setEventListener` es el
// hook oficial de `@tanstack/react-query` para esto).
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min: los directorios de negocios no cambian segundo a segundo.
      gcTime: 24 * 60 * 60 * 1000, // 24h en caché para que la persistencia tenga sentido offline.
      retry: (failureCount: number, error: unknown) => {
        // Errores de negocio (validación, 404, permisos) no se resuelven reintentando.
        if (error instanceof ApiError) {
          const noRetryCodes = ['VALIDATION_ERROR', 'NOT_FOUND', 'FORBIDDEN', 'UNAUTHENTICATED', 'SESSION_REVOKED', 'CONSENT_REQUIRED'];
          if (noRetryCodes.includes(error.code)) return false;
        }
        return failureCount < 2;
      },
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'guiazmg:react-query-cache',
});
