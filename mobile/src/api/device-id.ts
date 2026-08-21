/**
 * Identificador de instalación estable (no personal, no rastrea al usuario
 * entre apps): un UUID generado una vez y guardado en AsyncStorage. Se manda
 * como header `X-Device-Id` para telemetría/soporte ("qué instalación reportó
 * este error"), nunca como identidad de autenticación.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'guiazmg:device-id';

let cachedDeviceId: string | null = null;

function generateId(): string {
  // No dependemos de `crypto.randomUUID()` (no disponible en todos los motores
  // JS de RN todavía): generador simple suficiente para un id de instalación.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }

    const generated = generateId();
    await AsyncStorage.setItem(STORAGE_KEY, generated);
    cachedDeviceId = generated;
    return generated;
  } catch {
    // Si AsyncStorage falla (raro), no bloqueamos la llamada a la API por esto.
    return generateId();
  }
}
