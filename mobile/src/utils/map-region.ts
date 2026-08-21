/**
 * Conversión región de `react-native-maps` -> bbox/zoom que entiende
 * `/map/businesses`. Aproximación estándar (Web Mercator) suficiente para
 * decidir "pines vs. clusters", no para navegación de precisión.
 */
import type { Region } from 'react-native-maps';

export const ZMG_INITIAL_REGION: Region = {
  latitude: 20.6597,
  longitude: -103.3496,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

/** El backend rechaza (`VALIDATION_ERROR`) un bbox de más de esto de lado — ver `MAX_BBOX_DEGREES` en `map/businesses/route.ts`. */
const MAX_BBOX_DEGREES = 1.4;

/** Bbox en los 4 parámetros que espera `GET /map/businesses` (`minLat/maxLat/minLng/maxLng`), no un string único. Recortado al máximo que el backend acepta. */
export function regionToBbox(region: Region): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDelta = Math.min(region.latitudeDelta, MAX_BBOX_DEGREES);
  const lngDelta = Math.min(region.longitudeDelta, MAX_BBOX_DEGREES);
  return {
    minLng: region.longitude - lngDelta / 2,
    maxLng: region.longitude + lngDelta / 2,
    minLat: region.latitude - latDelta / 2,
    maxLat: region.latitude + latDelta / 2,
  };
}

export function regionToZoom(region: Region): number {
  const zoom = Math.log2(360 / region.longitudeDelta);
  return Math.max(1, Math.min(20, Math.round(zoom)));
}
