/**
 * Telemetría de la app móvil (`POST /api/mobile/v1/events`).
 *
 * Diferencia clave contra el sitio web: no existe `navigator.sendBeacon` en
 * React Native, y el patrón típico es que el usuario toca "Llamar"/"WhatsApp"
 * y la app pasa a segundo plano DE INMEDIATO — un `fetch` suelto en ese
 * instante se puede perder si la red está lenta o el proceso se congela.
 *
 * Por eso: los eventos se encolan primero en AsyncStorage (escritura síncrona
 * de intención, sobrevive a que la app se vaya a background) y se despachan
 * por lotes. Reintenta con backoff simple; tras `MAX_ATTEMPTS` fallos
 * consecutivos de un evento, se descarta (no crece la cola sin límite). La
 * cola se vacía también al volver a primer plano (`AppState`).
 *
 * Esto alimenta las estadísticas que los negocios PAGAN por ver (clics a
 * llamar/WhatsApp/sitio/mapa, vistas de ficha). Si esto no reporta, el
 * producto que un negocio pagó se degrada en silencio — no es opcional.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';

import { apiClient } from './client';
import { getDeviceId } from './device-id';

/**
 * Mismo catálogo que acepta `POST /events` en el backend
 * (`src/app/api/mobile/v1/events/route.ts`, `EVENT_TYPES`). `PHONE_CLICK` y
 * `WHATSAPP_CLICK` son genéricos: el `businessId` vs. `listingId` que viaje en
 * el evento es lo que distingue "llamó a un negocio" de "llamó por un
 * artículo del marketplace" — el backend NO tiene tipos separados
 * `MARKETPLACE_PHONE_CLICK`/`MARKETPLACE_WHATSAPP_CLICK`.
 */
export type AnalyticsEventType =
  | 'BUSINESS_VIEW'
  | 'LISTING_VIEW'
  | 'MARKETPLACE_VIEW'
  | 'WHATSAPP_CLICK'
  | 'PHONE_CLICK'
  | 'WEBSITE_CLICK'
  | 'MAP_CLICK'
  | 'WAZE_CLICK'
  | 'FACEBOOK_CLICK'
  | 'INSTAGRAM_CLICK'
  | 'TIKTOK_CLICK'
  | 'LEAD_GENERATED'
  | 'SEARCH_EXECUTED'
  | 'FAVORITE_ADDED'
  | 'REVIEW_CREATED'
  | 'BOOST_PURCHASED'
  | 'MEMBERSHIP_PURCHASED'
  | 'COUPON_REDEEMED';

export type AnalyticsEvent = {
  eventType: AnalyticsEventType;
  businessId?: string;
  listingId?: string;
  marketplaceListingId?: string;
  metadata: Record<string, unknown> & { source: 'mobile' };
  occurredAt: string;
};

type QueuedEvent = AnalyticsEvent & { attempts: number };

const QUEUE_KEY = 'guiazmg:analytics-queue';
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;
const FLUSH_DEBOUNCE_MS = 800;

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

/** `cuid`/`cuid2` de Prisma: alfanumérico, típicamente 24-25 caracteres, empieza con letra. Suficiente para descartar los ids de ejemplo del modo mock (`biz_1`, `lst_1`...) antes de mandarlos a un endpoint que los rechazaría con VALIDATION_ERROR. */
function isLikelyCuid(id: string | undefined): boolean {
  return Boolean(id) && /^[a-z][a-z0-9]{20,}$/i.test(id as string);
}

async function readQueue(): Promise<QueuedEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Si falla escribir la cola no hay mucho más que hacer: el evento se
    // pierde, pero no queremos que una falla de AsyncStorage tumbe la acción
    // del usuario (llamar/whatsapp ya se disparó antes de esto).
  }
}

function scheduleFlush(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushQueue();
  }, FLUSH_DEBOUNCE_MS);
}

/** Encola el evento de inmediato (síncrono a AsyncStorage) y programa el envío. */
export async function trackEvent(
  eventType: AnalyticsEventType,
  extra: { businessId?: string; listingId?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  const deviceId = await getDeviceId();
  const event: QueuedEvent = {
    eventType,
    // El endpoint solo acepta ids con forma de `cuid`; los ids de ejemplo del
    // modo mock no lo son, así que se filtran aquí para no ensuciar la cola
    // con un batch que el backend real rechazaría entero por un evento suelto.
    businessId: isLikelyCuid(extra.businessId) ? extra.businessId : undefined,
    listingId: isLikelyCuid(extra.listingId) ? extra.listingId : undefined,
    metadata: { source: 'mobile', deviceId, ...extra.metadata },
    occurredAt: new Date().toISOString(),
    attempts: 0,
  };

  const queue = await readQueue();
  queue.push(event);
  await writeQueue(queue);
  scheduleFlush();
}

/** Envía la cola por lotes. Idempotente: si ya se está vaciando, no corre en paralelo. */
export async function flushQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;

  try {
    let queue = await readQueue();
    if (queue.length === 0) return;

    while (queue.length > 0) {
      const batch = queue.slice(0, BATCH_SIZE);
      try {
        await apiClient.post('/events', { events: batch.map(({ attempts: _attempts, ...event }) => event) });
        queue = queue.slice(batch.length);
        await writeQueue(queue);
      } catch {
        // Falló el batch completo: sube el contador de intentos de cada evento
        // del batch, descarta los que llegaron al máximo, y se detiene (se
        // reintentará en el próximo flush programado o al volver a foreground).
        const withAttempts = batch.map((event) => ({ ...event, attempts: event.attempts + 1 }));
        const survivors = withAttempts.filter((event) => event.attempts < MAX_ATTEMPTS);
        queue = [...survivors, ...queue.slice(batch.length)];
        await writeQueue(queue);
        break;
      }
    }
  } finally {
    flushing = false;
  }
}

/** Se llama una vez desde `_layout.tsx` para vaciar la cola al volver a primer plano. */
export function registerAnalyticsAppStateListener(): () => void {
  const handleChange = (state: AppStateStatus) => {
    if (state === 'active') void flushQueue();
  };
  const subscription = AppState.addEventListener('change', handleChange);
  // Intento inicial por si quedaron eventos de la sesión anterior.
  void flushQueue();
  return () => subscription.remove();
}
