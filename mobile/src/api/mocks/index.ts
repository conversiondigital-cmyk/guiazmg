/**
 * Router de mocks: intercepta las rutas que el cliente real llamaría contra
 * `/api/mobile/v1` y devuelve datos de ejemplo con la MISMA envoltura
 * `{ ok, data, meta }` y las MISMAS formas que el backend real (ver
 * `guiazmg/src/lib/api/mobile/serializers.ts`), para que activar
 * `EXPO_PUBLIC_USE_MOCKS=1` sea un desarrollo fiel sin pegarle a la red.
 */
import type { ApiMeta, ApiResponse, BusinessCard, MapBusinessesResponse } from '../types';
import { getMockBusinessDetail, getMockBusinessReviews, mockBusinessCards, mockBusinessPins } from './businesses';
import { mockCategories, mockMarketplaceCategories, mockMunicipalities } from './categories';
import { getMockMarketplaceListing, mockMarketplaceListings } from './marketplace';

/** Simula latencia de red real para que los estados de carga se vean en desarrollo. */
const MOCK_DELAY_MS = 450;

function ok<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return { ok: true, data, meta };
}

function notFound(message: string): ApiResponse<never> {
  return { ok: false, error: { code: 'NOT_FOUND', message } };
}

function paginate<T>(items: T[], query: URLSearchParams): { items: T[]; meta: ApiMeta } {
  const page = Number(query.get('page') ?? '1') || 1;
  const limit = Number(query.get('limit') ?? '20') || 20;
  const start = (page - 1) * limit;
  const pageItems = items.slice(start, start + limit);
  return {
    items: pageItems,
    meta: { page, limit, total: items.length, hasMore: start + limit < items.length },
  };
}

function filterBusinesses(query: URLSearchParams): BusinessCard[] {
  const category = query.get('category');
  const municipality = query.get('municipality');
  const q = query.get('q')?.toLowerCase();
  const onlyVerified = query.get('verified') === 'true';
  const onlyOpenNow = query.get('openNow') === 'true';
  const minRating = query.get('minRating') ? Number(query.get('minRating')) : undefined;

  let items = mockBusinessCards;
  if (category) items = items.filter((b) => b.category?.slug === category);
  if (municipality) items = items.filter((b) => b.municipality?.slug === municipality);
  if (q) {
    items = items.filter(
      (b) => b.name.toLowerCase().includes(q) || (b.shortDescription ?? '').toLowerCase().includes(q),
    );
  }
  if (onlyVerified) items = items.filter((b) => b.isVerified);
  if (minRating) items = items.filter((b) => (b.rating ?? 0) >= minRating);
  if (onlyOpenNow) items = items.filter((b) => b.isOpenNow === true);

  const sort = query.get('sort');
  if (sort === 'rating') items = [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (sort === 'newest') items = [...items].slice().reverse();

  return items;
}

/** Zoom < 12 agrupa en clusters (redondeo ~0.1°, ~10km). */
function resolveMapBusinesses(query: URLSearchParams): MapBusinessesResponse {
  const zoom = Number(query.get('zoom') ?? '14');
  const minLat = Number(query.get('minLat'));
  const maxLat = Number(query.get('maxLat'));
  const minLng = Number(query.get('minLng'));
  const maxLng = Number(query.get('maxLng'));
  const hasBbox = [minLat, maxLat, minLng, maxLng].every((n) => !Number.isNaN(n));

  const withinBbox = hasBbox
    ? mockBusinessPins.filter(
        (pin) => pin.lng != null && pin.lat != null && pin.lng >= minLng && pin.lng <= maxLng && pin.lat >= minLat && pin.lat <= maxLat,
      )
    : mockBusinessPins;

  if (zoom >= 12) {
    return { mode: 'pins', pins: withinBbox };
  }

  const buckets = new Map<string, { lat: number; lng: number; count: number }>();
  for (const pin of withinBbox) {
    if (pin.lat == null || pin.lng == null) continue;
    const key = `${pin.lat.toFixed(1)}:${pin.lng.toFixed(1)}`;
    const existing = buckets.get(key);
    if (existing) existing.count += 1;
    else buckets.set(key, { lat: pin.lat, lng: pin.lng, count: 1 });
  }
  return { mode: 'clusters', clusters: Array.from(buckets.values()) };
}

/**
 * Resuelve una ruta mock. Devuelve `null` si la ruta no está mapeada (el
 * caller decide si eso es un error o un 404 real).
 */
export async function resolveMock(path: string, query: URLSearchParams): Promise<ApiResponse<unknown> | null> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  if (path === '/health') {
    return ok({ service: 'guiazmg-mobile-api-mock', version: 'v1', timestamp: new Date().toISOString() });
  }

  if (path === '/config') {
    return ok({
      minAppVersion: '1.0.0',
      latestAppVersion: '1.0.0',
      forceUpdate: false,
      maintenanceMode: false,
      featureFlags: { payments: false },
      webViewUrls: {
        blog: 'https://guiazmg.com/blog',
        terms: 'https://guiazmg.com/terminos',
        privacy: 'https://guiazmg.com/privacidad',
        dashboard: 'https://guiazmg.com/dashboard',
        checkout: 'https://guiazmg.com/checkout',
      },
    });
  }

  if (path === '/catalog') {
    return ok({
      categories: mockCategories,
      municipalities: mockMunicipalities,
      marketplaceCategories: mockMarketplaceCategories,
    });
  }

  if (path === '/home') {
    return ok({
      featured: mockBusinessCards.filter((b) => b.isBoosted || b.isFeatured).slice(0, 6),
      categories: mockCategories.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon })),
      recentListings: mockMarketplaceListings.slice(0, 10),
      zones: mockMunicipalities.slice(0, 6).map((m) => ({ name: m.name, slug: m.slug, municipality: { name: m.name, slug: m.slug } })),
    });
  }

  if (path === '/search') {
    const items = filterBusinesses(query);
    const { items: pageItems, meta } = paginate(items, query);
    return ok(pageItems, meta);
  }

  if (path === '/search/suggestions') {
    const q = (query.get('q') ?? '').toLowerCase().trim();
    if (!q) return ok([]);
    const names = mockBusinessCards.filter((b) => b.name.toLowerCase().includes(q)).map((b) => b.name);
    const cats = mockCategories.filter((c) => c.name.toLowerCase().includes(q)).map((c) => c.name);
    return ok(Array.from(new Set([...cats, ...names])).slice(0, 8));
  }

  const reviewsMatch = path.match(/^\/businesses\/([^/]+)\/reviews$/);
  if (reviewsMatch) {
    const reviews = getMockBusinessReviews(reviewsMatch[1]);
    const { items, meta } = paginate(reviews, query);
    return ok(items, meta);
  }

  const businessDetailMatch = path.match(/^\/businesses\/([^/]+)$/);
  if (businessDetailMatch) {
    const detail = getMockBusinessDetail(businessDetailMatch[1]);
    return detail ? ok(detail) : notFound('No encontramos ese negocio.');
  }

  if (path === '/map/businesses') {
    return ok(resolveMapBusinesses(query), { hasMore: false });
  }

  if (path === '/marketplace/categories') {
    return ok(mockMarketplaceCategories);
  }

  if (path === '/marketplace') {
    const category = query.get('category');
    const municipality = query.get('municipality');
    const q = query.get('q')?.toLowerCase();

    let items = mockMarketplaceListings;
    if (category) items = items.filter((l) => l.category?.slug === category);
    if (municipality) items = items.filter((l) => l.municipality?.name === municipality);
    if (q) items = items.filter((l) => l.title.toLowerCase().includes(q));

    const { items: pageItems, meta } = paginate(items, query);
    return ok(pageItems, meta);
  }

  const marketplaceDetailMatch = path.match(/^\/marketplace\/([^/]+)$/);
  if (marketplaceDetailMatch) {
    const detail = getMockMarketplaceListing(marketplaceDetailMatch[1]);
    return detail ? ok(detail) : notFound('Esta publicación ya no está disponible.');
  }

  if (path === '/events') {
    // POST de telemetría: el mock solo confirma recepción.
    return ok({ accepted: 1 });
  }

  return null;
}
