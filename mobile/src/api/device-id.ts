/**
 * Identificador de instalación estable (no personal, no rastrea al usuario
 * entre apps): un UUID v4 generado UNA vez y guardado en `expo-secure-store`
 * (Keychain/Keystore — más difícil de perder que AsyncStorage al limpiar
 * caché, y es donde vive el resto de la identidad del dispositivo desde A2).
 * Se manda como header `X-Device-Id` en TODA petición, para telemetría y para
 * que el backend asocie el refresh token a "este teléfono", nunca como
 * identidad de autenticación.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'guiazmg:device-id';

let cachedDeviceId: string | null = null;
let inFlight: Promise<string> | null = null;

function generateUuidV4(): string {
  // `expo-crypto` trae `randomUUID` respaldado por el generador criptográfico
  // nativo (no `Math.random`, que no tiene entropía suficiente para un id que
  // también se usa para atar refresh tokens a un dispositivo).
  if (typeof Crypto.randomUUID === 'function') {
    return Crypto.randomUUID();
  }
  // Respaldo (motor JS viejo sin `randomUUID`): sigue usando bytes aleatorios
  // criptográficos de `getRandomBytes`, no `Math.random()`.
  const bytes = Crypto.getRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function resolveDeviceId(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) return stored;

    const generated = generateUuidV4();
    await SecureStore.setItemAsync(STORAGE_KEY, generated);
    return generated;
  } catch {
    // Si SecureStore falla (raro), no bloqueamos la llamada a la API por
    // esto: se genera uno efímero para esta sesión de proceso.
    return generateUuidV4();
  }
}

/** Uuid v4 estable del dispositivo, generado la primera vez y cacheado en memoria + SecureStore. */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  if (!inFlight) {
    inFlight = resolveDeviceId().then((id) => {
      cachedDeviceId = id;
      return id;
    });
  }
  return inFlight;
}
