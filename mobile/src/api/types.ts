/**
 * Tipos espejo del contrato REAL de `/api/mobile/v1` (fase A2 — endpoint ya
 * existe en el backend, ver `guiazmg/src/app/api/mobile/v1/**` y
 * `guiazmg/src/lib/api/mobile/serializers.ts`/`errors.ts`).
 *
 * *** COPIA MANUAL ***: no se generan de un OpenAPI compartido. Si el backend
 * cambia un campo, este archivo se desincroniza en silencio — revisar contra
 * `serializers.ts` cuando algo no cuadre.
 */

/** Envoltura estándar de éxito de toda respuesta de la API. */
export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: ApiMeta;
};

/** Envoltura estándar de error de toda respuesta de la API. */
export type ApiFailure = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Metadatos de paginación / listas. */
export type ApiMeta = {
  page?: number;
  pageSize?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  nextCursor?: string | null;
};

/**
 * Códigos de error estables (`src/lib/api/mobile/errors.ts` en el backend,
 * namespace v1: NUNCA cambian de significado). `NETWORK_ERROR` y `UNKNOWN` son
 * sintéticos del CLIENTE (no vienen del servidor): el primero cuando `fetch`
 * ni siquiera respondió, el segundo como colchón ante un código futuro que
 * esta copia todavía no conoce.
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'TOKEN_EXPIRED'
  | 'SESSION_REVOKED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REFRESH'
  | 'REFRESH_EXPIRED'
  | 'REFRESH_REUSED'
  | 'CONSENT_REQUIRED'
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_DISABLED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'APP_VERSION_UNSUPPORTED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

/** Referencia mínima (categoría/municipio/colonia) tal como la sirve el backend: sin `id`, solo `name`+`slug`. */
export type RefLike = { name: string; slug: string };

export type Category = RefLike & {
  /** Emoji (no un nombre de icon set) — así lo guarda la BD, ver `prisma/seed.ts`. */
  icon: string | null;
};

export type CategoryWithSubcategories = Category & { subcategories: RefLike[] };

export type Municipality = RefLike;

export type MunicipalityWithNeighborhoods = Municipality & { neighborhoods: RefLike[] };

export type BusinessHour = {
  /** 0 = domingo … 6 = sábado, como `Date.getDay()`. */
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

/**
 * Tarjeta de negocio (listas: búsqueda, home, similares). Proyección ligera
 * real de `toBusinessCard()` — OJO: no trae `hours` completas (el servidor ya
 * resolvió `isOpenNow`), ni `isPremium` (el campo expuesto es `isFeatured`).
 */
export type BusinessCard = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  category: Category | null;
  municipality: Municipality | null;
  neighborhood: RefLike | null;
  isVerified: boolean;
  isFeatured: boolean;
  isBoosted: boolean;
  rating: number | null;
  reviewCount: number;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  /** `null` = el negocio no tiene horario cargado, no se puede afirmar nada. */
  isOpenNow: boolean | null;
};

/** Filtros que entiende `GET /search` (mapeados 1:1 al bottom sheet de Explorar). */
export type BusinessSearchFilters = {
  q?: string;
  category?: string;
  subcategory?: string;
  municipality?: string;
  neighborhood?: string;
  onlyVerified?: boolean;
  onlyOpenNow?: boolean;
  minRating?: number;
  maxDistanceKm?: number;
  sort?: 'relevance' | 'distance' | 'rating' | 'newest';
  lat?: number;
  lng?: number;
  page?: number;
  limit?: number;
};

/** Pin de mapa: el payload más chico posible (`GET /map/businesses`, modo `pins`). */
export type BusinessPin = {
  id: string;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
  icon: string | null;
  isVerified: boolean;
};

/** Cluster de pines cuando el zoom es bajo. */
export type MapCluster = { lat: number; lng: number; count: number };

export type MapBusinessesResponse = { mode: 'pins'; pins: BusinessPin[] } | { mode: 'clusters'; clusters: MapCluster[] };

/** Reseña individual (`GET /businesses/:slug/reviews`, con scroll infinito). */
export type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  authorName: string | null;
  createdAt: string;
  ownerResponse: { comment: string; createdAt: string } | null;
};

/** Preview de reseñas embebido en el detalle (máx. 5, sin paginar — ver `reviewsPreview`). */
export type BusinessDetailReviewPreview = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  authorName: string | null;
  createdAt: string;
};

/** Detalle completo de negocio (`GET /businesses/:slug`). */
export type BusinessDetail = BusinessCard & {
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  websiteUrl: string | null;
  addressText: string | null;
  socials: {
    facebookUrl: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
    youtubeUrl: string | null;
    linkedinUrl: string | null;
  };
  hours: BusinessHour[];
  images: string[];
  tags: Array<{ name: string; slug: string; icon: string | null }>;
  reviewsPreview: BusinessDetailReviewPreview[];
  /** `true` solo si hay sesión y el usuario ya lo guardó — el backend no expone favoritos móviles todavía más allá de este flag de lectura. */
  isFavorite: boolean;
  plan: string | null;
};

export type Paginated<T> = { items: T[] };

/** Categoría raíz del marketplace (las fijas del catálogo, con `id` — únicas que sí lo traen). */
export type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export type MarketplaceCondition = string;

/** Tarjeta de publicación del marketplace (`GET /marketplace`). El endpoint solo lista `ACTIVE`, así que no existe un campo `status` que degradar en la tarjeta. */
export type MarketplaceListing = {
  id: string;
  slug: string;
  title: string;
  /** Serializado como string (`Prisma.Decimal` → string, para no perder precisión). `null` = "a convenir". */
  price: string | null;
  type: string;
  condition: string | null;
  coverImageUrl: string | null;
  category: { name: string; slug: string; icon: string | null } | null;
  municipality: { name: string } | null;
  neighborhood: string | null;
  isBoosted: boolean;
  createdAt: string;
  favoriteCount: number;
};

export type MarketplaceSeller = { id: string; name: string | null; image: string | null };

/** Detalle de publicación (`GET /marketplace/:id`). Un anuncio vendido/expirado ya no existe para este endpoint (responde `NOT_FOUND`), así que no hay estado "no disponible" que pintar aquí. */
export type MarketplaceListingDetail = MarketplaceListing & {
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  images: string[];
  seller: MarketplaceSeller | null;
  views: number;
};

/** Config remota (`GET /config`, público, sin sesión — se consulta al arrancar). */
export type AppRemoteConfig = {
  minAppVersion: string;
  latestAppVersion: string;
  forceUpdate: boolean;
  maintenanceMode: boolean;
  featureFlags: Record<string, boolean>;
  webViewUrls: {
    blog: string;
    terms: string;
    privacy: string;
    dashboard: string;
    checkout: string;
  };
};

/** Usuario autenticado (`user` de login/register, y la forma de `GET /auth/me`). */
export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  acceptedTerms: boolean;
};

export type AuthMeResponse = AuthUser & {
  hasBusiness: boolean;
  unreadNotifications: number;
};

export type AuthTokenPair = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresAt: string;
};

export type LoginResponse = AuthTokenPair & { user: AuthUser };
