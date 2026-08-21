/**
 * Cliente y persistencia de React Query. Persistir en AsyncStorage permite
 * que, al reabrir la app sin conexión, las últimas listas/fichas vistas
 * sigan disponibles (aunque marcadas como datos viejos) en vez de una
 * pantalla en blanco.
 */
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError } from './client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min: los directorios de negocios no cambian segundo a segundo.
      gcTime: 24 * 60 * 60 * 1000, // 24h en caché para que la persistencia tenga sentido offline.
      retry: (failureCount: number, error: unknown) => {
        // Errores de negocio (validación, 404, permisos) no se resuelven reintentando.
        if (error instanceof ApiError) {
          const noRetryCodes = ['VALIDATION_ERROR', 'NOT_FOUND', 'FORBIDDEN', 'UNAUTHORIZED', 'SESSION_REVOKED'];
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
