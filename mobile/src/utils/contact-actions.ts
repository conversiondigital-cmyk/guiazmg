/**
 * Acciones de contacto (llamar / WhatsApp / cómo llegar) compartidas entre la
 * ficha de negocio y la de marketplace. Cada acción:
 * 1) dispara la telemetría ANTES de intentar abrir la app externa (si se
 *    espera a que resuelva el `Linking`, el evento se pierde porque el
 *    usuario ya pasó a segundo plano);
 * 2) si `canOpenURL` falla (WhatsApp no instalado, etc.), degrada a copiar el
 *    dato al portapapeles con un aviso — nunca a una pantalla en blanco.
 */
import * as Clipboard from 'expo-clipboard';
import { Alert, Linking } from 'react-native';

import { trackEvent, type AnalyticsEventType } from '@/api/analytics';

async function openOrCopy(url: string, fallbackValue: string, fallbackLabel: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // sigue al fallback
  }

  await Clipboard.setStringAsync(fallbackValue);
  Alert.alert('No pudimos abrir la app', `Copiamos ${fallbackLabel} al portapapeles para que lo pegues donde lo necesites.`);
}

export async function callPhone(phone: string, trackType: AnalyticsEventType, trackExtra: { businessId?: string; listingId?: string }) {
  await trackEvent(trackType, trackExtra);
  await openOrCopy(`tel:${phone}`, phone, 'el teléfono');
}

export async function openWhatsapp(
  whatsapp: string,
  message: string,
  trackType: AnalyticsEventType,
  trackExtra: { businessId?: string; listingId?: string },
) {
  await trackEvent(trackType, trackExtra);
  const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  await openOrCopy(url, whatsapp, 'el número de WhatsApp');
}

export async function openDirections(
  destination: { latitude: number; longitude: number; label: string },
  trackExtra: { businessId?: string },
) {
  await trackEvent('MAP_CLICK', trackExtra);
  const query = encodeURIComponent(destination.label);
  const url = `https://www.google.com/maps/search/?api=1&query=${destination.latitude},${destination.longitude}(${query})`;
  await openOrCopy(url, `${destination.latitude}, ${destination.longitude}`, 'la ubicación');
}

export async function openWebsite(url: string, businessId?: string) {
  await trackEvent('WEBSITE_CLICK', { businessId });
  await openOrCopy(url, url, 'el sitio web');
}
