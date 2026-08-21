/**
 * Hooks de React Query sobre `apiClient`. Las pantallas consumen ESTOS
 * hooks, nunca `apiClient` directo, para que carga/vacío/error y caché salgan
 * gratis y consistentes en toda la app.
 *
 * Contrato real (`/api/mobile/v1`, ver `guiazmg/src/app/api/mobile/v1/**`):
 * no existen `/categories`, `/municipalities`, `/businesses` ni
 * `/businesses/pins` sueltos — todo eso se deriva de `/catalog` y `/search`.
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiClient } from './client';
import type {
  BusinessCard,
  BusinessDetail,
  BusinessSearchFilters,
  Category,
  CategoryWithSubcategories,
  MapBusinessesResponse,
  MarketplaceCategory,
  MarketplaceListing,
  MarketplaceListingDetail,
  Municipality,
  MunicipalityWithNeighborhoods,
  Review,
} from './types';

const PAGE_SIZE = 20;

export type CatalogResponse = {
  categories: CategoryWithSubcategories[];
  municipalities: MunicipalityWithNeighborhoods[];
  marketplaceCategories: MarketplaceCategory[];
};

/** Catálogo completo (categorías + municipios + sub-filtros) para el bottom sheet de Explorar. Se pide UNA vez al arrancar y se cachea 10 min. */
export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: () => apiClient.get<CatalogResponse>('/catalog'),
    staleTime: 10 * 60 * 1000,
  });
}

/** Categorías planas, derivadas de `/catalog` (no hay endpoint `/categories` suelto en el backend real). */
export function useCategories() {
  const catalog = useCatalog();
  return {
    ...catalog,
    data: catalog.data?.categories.map((c): Category => ({ name: c.name, slug: c.slug, icon: c.icon })),
  };
}

/** Municipios planos, derivados de `/catalog` (no hay endpoint `/municipalities` suelto en el backend real). */
export function useMunicipalities() {
  const catalog = useCatalog();
  return {
    ...catalog,
    data: catalog.data?.municipalities.map((m): Municipality => ({ name: m.name, slug: m.slug })),
  };
}

export type HomeResponse = {
  featured: BusinessCard[];
  categories: Category[];
  recentListings: MarketplaceListing[];
  zones: Array<{ name: string; slug: string; municipality: Municipality }>;
};

/** Datos agregados de Inicio. Cada sección de la pantalla puede fallar sola sin tumbar las demás (mismo contrato tolerante que ya trae `/home`). */
export function useHome() {
  return useQuery({
    queryKey: ['home'],
    queryFn: () => apiClient.get<HomeResponse>('/home'),
  });
}

/** Directorio general (Mapa/lista sin filtros) — usa `/search` sin `q` ni filtros, mismo endpoint que Explorar. */
export function useBusinesses(filters: { category?: string; municipality?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ['businesses', filters],
    queryFn: () => apiClient.get<BusinessCard[]>('/search', { ...toSearchQuery(filters), limit: 50 }),
  });
}

/** Búsqueda/lista de Explorar, con scroll infinito de `PAGE_SIZE` en `PAGE_SIZE`. */
export function useSearchBusinesses(filters: BusinessSearchFilters) {
  return useInfiniteQuery({
    queryKey: ['search', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiClient.getPage<BusinessCard[]>('/search', {
        ...toSearchQuery(filters),
        page: pageParam,
        limit: filters.limit ?? PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => (lastPage.meta.hasMore ? allPages.length + 1 : undefined),
  });
}

/** Mapea los nombres de filtro que usa la UI (`onlyVerified`, `onlyOpenNow`, `maxDistanceKm`) a los que espera `GET /search` (`verified`, `openNow`, `maxDistance`). */
function toSearchQuery(filters: BusinessSearchFilters): Record<string, string | number | boolean | undefined> {
  return {
    q: filters.q,
    category: filters.category,
    subcategory: filters.subcategory,
    municipality: filters.municipality,
    neighborhood: filters.neighborhood,
    verified: filters.onlyVerified,
    openNow: filters.onlyOpenNow,
    minRating: filters.minRating,
    maxDistance: filters.maxDistanceKm,
    sort: filters.sort,
    lat: filters.lat,
    lng: filters.lng,
  };
}

/** Autocompletado: el backend real devuelve un arreglo plano de strings (nombres/categorías/tags), no `{businesses, categories}`. */
export function useSearchSuggestions(q: string) {
  return useQuery({
    queryKey: ['search-suggestions', q],
    queryFn: () => apiClient.get<string[]>('/search/suggestions', { q }),
    enabled: q.trim().length >= 2,
  });
}

export function useBusinessDetail(slug: string) {
  return useQuery({
    queryKey: ['business', slug],
    queryFn: () => apiClient.get<BusinessDetail>(`/businesses/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useBusinessReviews(slug: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['business-reviews', slug],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => apiClient.getPage<Review[]>(`/businesses/${slug}/reviews`, { page: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) => (lastPage.meta.hasMore ? allPages.length + 1 : undefined),
    enabled: Boolean(slug) && enabled,
  });
}

/** Bbox del mapa visible, en los 4 parámetros que espera `GET /map/businesses` (no un string único). */
export type MapBbox = { minLat: number; maxLat: number; minLng: number; maxLng: number };

/** Mapa: pines o clusters según zoom, para el bbox visible. `enabled` se apaga mientras el usuario sigue paneando (debounce en la pantalla). */
export function useMapBusinesses(bbox: MapBbox | null, zoom: number, enabled: boolean) {
  return useQuery({
    queryKey: ['map-businesses', bbox, zoom],
    queryFn: () =>
      apiClient.get<MapBusinessesResponse>('/map/businesses', {
        minLat: bbox?.minLat,
        maxLat: bbox?.maxLat,
        minLng: bbox?.minLng,
        maxLng: bbox?.maxLng,
        zoom,
      }),
    enabled: Boolean(bbox) && enabled,
    placeholderData: (previous) => previous,
  });
}

export function useMarketplaceCategories() {
  return useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: () => apiClient.get<MarketplaceCategory[]>('/marketplace/categories'),
    staleTime: 10 * 60 * 1000,
  });
}

export type MarketplaceFilters = { category?: string; municipality?: string; q?: string };

export function useMarketplaceListings(filters: MarketplaceFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['marketplace', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => apiClient.getPage<MarketplaceListing[]>('/marketplace', { ...filters, page: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) => (lastPage.meta.hasMore ? allPages.length + 1 : undefined),
  });
}

export function useMarketplaceListingDetail(id: string) {
  return useQuery({
    queryKey: ['marketplace-listing', id],
    queryFn: () => apiClient.get<MarketplaceListingDetail>(`/marketplace/${id}`),
    enabled: Boolean(id),
  });
}
