/**
 * Ubicación en foreground (solo). Patrón obligatorio de producto: se muestra
 * un modal PROPIO explicando el beneficio ANTES del diálogo del sistema
 * operativo (ver `LocationPermissionModal`) — Google Play exige esto y
 * duplicar el aviso reduce el rechazo del usuario al diálogo nativo.
 *
 * - Se pide la PRIMERA VEZ que el usuario toca "Cerca de mí", nunca al
 *   arrancar la app.
 * - Se cachea la última posición con TTL para no pedir GPS en cada pantalla.
 * - Si el usuario deniega, NUNCA se vuelve a preguntar automáticamente: la
 *   pantalla ofrece elegir municipio a mano en su lugar.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export type Coordinates = { latitude: number; longitude: number };

export type LocationState =
  | { status: 'unknown' }
  | { status: 'granted'; coords: Coordinates }
  | { status: 'denied' }
  | { status: 'error'; message: string };

const CACHE_KEY = 'guiazmg:last-known-location';
const DENIED_KEY = 'guiazmg:location-denied';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

type CachedLocation = Coordinates & { cachedAt: number };

async function readCache(): Promise<Coordinates | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLocation;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return { latitude: parsed.latitude, longitude: parsed.longitude };
  } catch {
    return null;
  }
}

async function writeCache(coords: Coordinates): Promise<void> {
  try {
    const payload: CachedLocation = { ...coords, cachedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Sin caché no pasa nada grave: la próxima vez se vuelve a pedir el fix real.
  }
}

/** `true` si el usuario ya denegó antes — así la UI ofrece el picker manual sin volver a preguntar. */
export async function hasUserDeniedLocation(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DENIED_KEY)) === 'true';
  } catch {
    return false;
  }
}

async function markDenied(): Promise<void> {
  try {
    await AsyncStorage.setItem(DENIED_KEY, 'true');
  } catch {
    // no-op
  }
}

/**
 * Pide el permiso al SO (el modal propio de "por qué" ya se mostró antes de
 * llamar esto — ver `LocationPermissionModal`) y devuelve la posición.
 * Usa caché si sigue vigente para no golpear el GPS en cada llamada.
 */
export async function requestLocation(): Promise<LocationState> {
  const cached = await readCache();
  if (cached) return { status: 'granted', coords: cached };

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      await markDenied();
      return { status: 'denied' };
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    await writeCache(coords);
    return { status: 'granted', coords };
  } catch {
    return { status: 'error', message: 'No pudimos obtener tu ubicación. Intenta de nuevo.' };
  }
}

/** Última posición cacheada, sin pedir permiso ni GPS (para pintar distancia si ya se tenía). */
export async function getCachedLocation(): Promise<Coordinates | null> {
  return readCache();
}
