// Proyecciones LIGERAS para la API móvil.
//
// Por qué existe este archivo: la ruta web de búsqueda (`search()`) hidrata
// cada resultado con `include` completo (memberships.plan, tags, hours × 7,
// _count…) porque una página SSR puede darse ese lujo. Un cliente nativo en
// datos móviles NO: 20 resultados con ese payload completo pesan varias
// decenas de KB y cargan campos que la tarjeta ni pinta. Aquí se define el
// contrato reducido que sí tiene sentido mandar por aire, y quién hace el
// cálculo pesado (abierto/cerrado) en el servidor para no mandar las 7 filas
// de horario a cada tarjeta.
//
// Las funciones son TOLERANTES A CAMPOS AUSENTES: aceptan cualquier objeto que
// tenga (parte de) la forma de una consulta Prisma sobre `Profile`, para poder
// alimentarlas directamente desde `select`/`include` distintos según la ruta
// (una tarjeta de búsqueda no necesita las mismas relaciones que un detalle).

import { getStatus, type BusinessHourRow } from "@/lib/hours"

// --- Tipos de entrada (forma mínima que necesita cada serializer) ----------

interface RefLike {
  name: string
  slug: string
}

interface CategoryLike extends RefLike {
  icon?: string | null
}

interface BusinessSourceBase {
  id: string
  slug: string
  name: string
  shortDescription?: string | null
  logoUrl?: string | null
  coverImageUrl?: string | null
  category?: CategoryLike | null
  municipality?: RefLike | null
  neighborhood?: RefLike | null
  isVerified?: boolean | null
  isFeatured?: boolean | null
  isBoosted?: boolean | null
  latitude?: number | null
  longitude?: number | null
  // Calculado fuera de este archivo (agregado de `Review`, o `ST_Distance` en
  // SQL crudo para la búsqueda por cercanía). Se aceptan ya resueltos porque
  // el serializer no debe disparar sus propias queries.
  rating?: number | null
  reviewCount?: number | null
  distanceKm?: number | null
  // Filas de horario (las 7, o las que existan) SOLO para calcular
  // `isOpenNow` aquí adentro; nunca se re-exportan completas en la tarjeta.
  hours?: BusinessHourRow[] | null
}

export interface BusinessCard {
  id: string
  slug: string
  name: string
  shortDescription: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  category: { name: string; slug: string; icon: string | null } | null
  municipality: { name: string; slug: string } | null
  neighborhood: { name: string; slug: string } | null
  isVerified: boolean
  isFeatured: boolean
  isBoosted: boolean
  rating: number | null
  reviewCount: number
  lat: number | null
  lng: number | null
  distanceKm: number | null
  isOpenNow: boolean | null
}

// `isOpenNow` se calcula aquí con la misma lógica de `getStatus` que usa la
// web (src/lib/hours.ts), reutilizada tal cual para que web y móvil NUNCA
// digan cosas distintas sobre si un negocio está abierto. `null` = no hay
// horario cargado (no se puede afirmar ni que sí ni que no).
function computeIsOpenNow(hours?: BusinessHourRow[] | null): boolean | null {
  if (!hours || hours.length === 0) return null
  return getStatus(hours).open
}

export function toBusinessCard(source: BusinessSourceBase): BusinessCard {
  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    shortDescription: source.shortDescription ?? null,
    logoUrl: source.logoUrl ?? null,
    coverImageUrl: source.coverImageUrl ?? null,
    category: source.category
      ? { name: source.category.name, slug: source.category.slug, icon: source.category.icon ?? null }
      : null,
    municipality: source.municipality ? { name: source.municipality.name, slug: source.municipality.slug } : null,
    neighborhood: source.neighborhood ? { name: source.neighborhood.name, slug: source.neighborhood.slug } : null,
    isVerified: !!source.isVerified,
    isFeatured: !!source.isFeatured,
    isBoosted: !!source.isBoosted,
    rating: source.rating ?? null,
    reviewCount: source.reviewCount ?? 0,
    lat: source.latitude ?? null,
    lng: source.longitude ?? null,
    distanceKm: source.distanceKm ?? null,
    isOpenNow: computeIsOpenNow(source.hours),
  }
}

// --- Pin de mapa: el payload más chico posible, para poder mandar cientos de
// negocios en un solo request al pintar el mapa sin reventar la red móvil. ---

export interface BusinessPin {
  id: string
  slug: string
  name: string
  lat: number | null
  lng: number | null
  icon: string | null
  isVerified: boolean
}

interface BusinessPinSource {
  id: string
  slug: string
  name: string
  latitude?: number | null
  longitude?: number | null
  isVerified?: boolean | null
  category?: { icon?: string | null } | null
}

export function toBusinessPin(source: BusinessPinSource): BusinessPin {
  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    lat: source.latitude ?? null,
    lng: source.longitude ?? null,
    icon: source.category?.icon ?? null,
    isVerified: !!source.isVerified,
  }
}

// --- Detalle: BusinessCard + todo lo que solo hace falta en la pantalla de
// ficha (nunca en una lista de 20 resultados). ---

export interface BusinessDetailReviewPreview {
  id: string
  rating: number
  title: string | null
  comment: string | null
  authorName: string | null
  createdAt: string
}

export interface BusinessDetail extends BusinessCard {
  description: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  websiteUrl: string | null
  addressText: string | null
  socials: {
    facebookUrl: string | null
    instagramUrl: string | null
    tiktokUrl: string | null
    youtubeUrl: string | null
    linkedinUrl: string | null
  }
  hours: Array<{ dayOfWeek: number; opensAt: string | null; closesAt: string | null; isClosed: boolean }>
  images: string[]
  tags: Array<{ name: string; slug: string; icon: string | null }>
  reviewsPreview: BusinessDetailReviewPreview[]
  isFavorite: boolean
  // Nombre del plan (string), NUNCA el objeto completo de `ProfileMembership`
  // (trae ids de proveedor de pago, período de facturación, etc. — nada de eso
  // le importa a la app y no debe viajar por la red).
  plan: string | null
}

interface BusinessDetailSource extends BusinessSourceBase {
  description?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  websiteUrl?: string | null
  addressText?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  tiktokUrl?: string | null
  youtubeUrl?: string | null
  linkedinUrl?: string | null
  images?: Array<{ imageUrl: string }> | null
  tags?: Array<{ tag: { name: string; slug: string; icon?: string | null } }> | null
  reviews?: Array<{
    id: string
    rating: number
    title?: string | null
    comment?: string | null
    createdAt: Date | string
    user?: { name?: string | null } | null
  }> | null
  memberships?: Array<{ plan?: { name?: string | null } | null }> | null
  isFavorite?: boolean | null
}

// --- Marketplace: tarjeta y detalle. Proyección ligera análoga a los
// negocios: la app no necesita `contactEmail` ni todas las imágenes en una
// lista, solo la portada. ---

export interface ListingCard {
  id: string
  slug: string
  title: string
  price: string | null
  type: string
  condition: string | null
  coverImageUrl: string | null
  category: { name: string; slug: string; icon: string | null } | null
  municipality: { name: string } | null
  neighborhood: string | null
  isBoosted: boolean
  createdAt: string
  favoriteCount: number
}

interface ListingSourceBase {
  id: string
  slug: string
  title: string
  price?: unknown
  type: string
  condition?: string | null
  category?: { name: string; slug: string; icon?: string | null } | null
  municipality?: { name: string } | null
  neighborhood?: string | null
  isBoosted?: boolean | null
  createdAt: Date | string
  favoriteCount?: number | null
  images?: Array<{ url: string }> | null
}

// `price` llega como `Prisma.Decimal` (o string/number ya serializado según el
// caller); se normaliza a string para no perder precisión ni arrastrar el tipo
// Decimal hasta el JSON (Next.js no lo serializa solo).
function priceToString(price: unknown): string | null {
  if (price === null || price === undefined) return null
  return String(price)
}

export function toListingCard(source: ListingSourceBase): ListingCard {
  return {
    id: source.id,
    slug: source.slug,
    title: source.title,
    price: priceToString(source.price),
    type: source.type,
    condition: source.condition ?? null,
    coverImageUrl: source.images?.[0]?.url ?? null,
    category: source.category
      ? { name: source.category.name, slug: source.category.slug, icon: source.category.icon ?? null }
      : null,
    municipality: source.municipality ? { name: source.municipality.name } : null,
    neighborhood: source.neighborhood ?? null,
    isBoosted: !!source.isBoosted,
    createdAt: typeof source.createdAt === "string" ? source.createdAt : source.createdAt.toISOString(),
    favoriteCount: source.favoriteCount ?? 0,
  }
}

export interface ListingDetail extends ListingCard {
  description: string | null
  phone: string | null
  whatsapp: string | null
  images: string[]
  seller: { id: string; name: string | null; image: string | null } | null
  views: number
}

interface ListingDetailSource extends ListingSourceBase {
  description?: string | null
  phone?: string | null
  whatsapp?: string | null
  views?: number | null
  user?: { id: string; name?: string | null; image?: string | null } | null
}

export function toListingDetail(source: ListingDetailSource): ListingDetail {
  const card = toListingCard(source)
  return {
    ...card,
    description: source.description ?? null,
    phone: source.phone ?? null,
    whatsapp: source.whatsapp ?? null,
    images: (source.images ?? []).map((img) => img.url),
    seller: source.user ? { id: source.user.id, name: source.user.name ?? null, image: source.user.image ?? null } : null,
    views: source.views ?? 0,
  }
}

export function toBusinessDetail(source: BusinessDetailSource): BusinessDetail {
  const card = toBusinessCard(source)

  return {
    ...card,
    description: source.description ?? null,
    phone: source.phone ?? null,
    whatsapp: source.whatsapp ?? null,
    email: source.email ?? null,
    websiteUrl: source.websiteUrl ?? null,
    addressText: source.addressText ?? null,
    socials: {
      facebookUrl: source.facebookUrl ?? null,
      instagramUrl: source.instagramUrl ?? null,
      tiktokUrl: source.tiktokUrl ?? null,
      youtubeUrl: source.youtubeUrl ?? null,
      linkedinUrl: source.linkedinUrl ?? null,
    },
    hours: (source.hours ?? []).map((h) => ({
      dayOfWeek: h.dayOfWeek,
      opensAt: h.opensAt ?? null,
      closesAt: h.closesAt ?? null,
      isClosed: h.isClosed,
    })),
    images: (source.images ?? []).map((img) => img.imageUrl),
    tags: (source.tags ?? []).map((t) => ({ name: t.tag.name, slug: t.tag.slug, icon: t.tag.icon ?? null })),
    reviewsPreview: (source.reviews ?? []).slice(0, 5).map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title ?? null,
      comment: r.comment ?? null,
      authorName: r.user?.name ?? null,
      createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString(),
    })),
    isFavorite: !!source.isFavorite,
    plan: source.memberships?.[0]?.plan?.name ?? null,
  }
}
