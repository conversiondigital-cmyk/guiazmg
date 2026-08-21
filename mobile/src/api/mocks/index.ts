/**
 * Router de mocks: intercepta las rutas que el cliente real llamaría contra
 * `/api/mobile/v1` y devuelve datos de ejemplo con la MISMA envoltura
 * `{ ok, data, meta }` que usará la API real, para que apagar el mock
 * (`EXPO_PUBLIC_USE_MOCKS=false`) el día que la API exista no requiera tocar
 * ninguna pantalla.
 */
import type { ApiMeta, ApiResponse } from '../types';
import { getMockBusinessDetail, mockBusinessCards, mockBusinessPins } from './businesses';
import { mockCategories, mockMunicipalities } from './categories';

/** Simula latencia de red real para que los estados de carga se vean en desarrollo. */
const MOCK_DELAY_MS = 450;

function ok<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return { ok: true, data, meta };
}

function notFound(message: string): ApiResponse<never> {
  return { ok: false, error: { code: 'NOT_FOUND', message } };
}

/**
 * Resuelve una ruta mock. Devuelve `null` si la ruta no está mapeada (el
 * caller decide si eso es un error o un 404 real).
 */
export async function resolveMock(path: string, query: URLSearchParams): Promise<ApiResponse<unknown> | null> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  if (path === '/categories') {
    return ok(mockCategories);
  }

  if (path === '/municipalities') {
    return ok(mockMunicipalities);
  }

  if (path === '/businesses') {
    const categorySlug = query.get('category');
    const municipalitySlug = query.get('municipality');
    const search = query.get('q')?.toLowerCase();

    let items = mockBusinessCards;
    if (categorySlug) items = items.filter((b) => b.category?.slug === categorySlug);
    if (municipalitySlug) items = items.filter((b) => b.municipality?.slug === municipalitySlug);
    if (search) items = items.filter((b) => b.name.toLowerCase().includes(search));

    return ok(items, { total: items.length, page: 1, pageSize: items.length, hasMore: false });
  }

  if (path === '/businesses/pins') {
    return ok(mockBusinessPins);
  }

  const businessDetailMatch = path.match(/^\/businesses\/([^/]+)$/);
  if (businessDetailMatch) {
    const detail = getMockBusinessDetail(businessDetailMatch[1]);
    return detail ? ok(detail) : notFound('No encontramos ese negocio.');
  }

  return null;
}
