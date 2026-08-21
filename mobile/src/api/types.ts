/**
 * Tipos espejo del contrato de la API móvil de Guía ZMG (`/api/mobile/v1`,
 * todavía no existe en el backend — ver `mobile/README.md`).
 *
 * *** COPIA MANUAL ***: estos tipos NO se generan del schema de Prisma ni de
 * ningún OpenAPI compartido. Alguien tiene que actualizarlos a mano cuando el
 * contrato del backend cambie (campo nuevo, renombrado, tipo distinto). Si
 * ves un campo aquí que ya no existe en la API real, o falta uno que sí
 * existe, este archivo está desincronizado — corrígelo antes de seguir.
 *
 * Espejo de los modelos reales en `prisma/schema.prisma` (`Profile`,
 * `Category`, `Municipality`, `Review`), aplanados para consumo móvil.
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
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Metadatos de paginación / listas. */
export type ApiMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
};

/**
 * Códigos de error estables que el cliente puede usar para tomar decisiones
 * (reintentar, refrescar token, cerrar sesión, mostrar mensaje específico).
 * Cualquier código no listado aquí se trata como `UNKNOWN`.
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'SESSION_REVOKED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

/** Municipio de la Zona Metropolitana de Guadalajara (y alrededores). */
export type Municipality = {
  id: string;
  name: string;
  slug: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
};

/**
 * Tarjeta de negocio para listas (búsqueda, categoría, home). Versión
 * aplanada de `Profile` — solo lo que la tarjeta necesita pintar.
 */
export type BusinessCard = {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  category?: Category | null;
  municipality?: Municipality | null;
  neighborhoodName?: string | null;
  isVerified: boolean;
  isPremium: boolean;
  isBoosted: boolean;
  /** Promedio de reseñas propias del sitio (no de Google). `null` si aún no tiene ninguna. */
  rating: number | null;
  reviewCount: number;
};

/** Pin de mapa: lo mínimo para dibujar un marcador. */
export type BusinessPin = {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  category?: Category | null;
  isPremium: boolean;
};

export type BusinessHour = {
  /** 0 = domingo … 6 = sábado, como `Date.getDay()`. */
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

export type Review = {
  id: string;
  userName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

/** Detalle completo de negocio (pantalla de ficha). */
export type BusinessDetail = BusinessCard & {
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  addressText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images: string[];
  hours: BusinessHour[];
  reviews: Review[];
};

export type Paginated<T> = {
  items: T[];
};
