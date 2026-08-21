/**
 * Datos mock de negocios reales-en-forma (nombres y giros verosímiles de la
 * ZMG), NO datos reales de terceros. Sirven para desarrollar la UI mientras
 * `/api/mobile/v1` no existe — ver `EXPO_PUBLIC_USE_MOCKS` en `client.ts`.
 */
import type { BusinessCard, BusinessDetail, BusinessPin } from '../types';
import { mockCategories, mockMunicipalities } from './categories';

const categoryBySlug = (slug: string) => mockCategories.find((c) => c.slug === slug) ?? null;
const municipalityBySlug = (slug: string) => mockMunicipalities.find((m) => m.slug === slug) ?? null;

export const mockBusinessCards: BusinessCard[] = [
  {
    id: 'biz_1',
    slug: 'taqueria-el-buen-pastor',
    name: 'Taquería El Buen Pastor',
    shortDescription: 'Tacos al pastor y de asada, trompo desde las 6pm.',
    logoUrl: null,
    coverImageUrl: null,
    category: categoryBySlug('comida-y-restaurantes'),
    municipality: municipalityBySlug('guadalajara'),
    neighborhoodName: 'Americana',
    isVerified: true,
    isPremium: false,
    isBoosted: true,
    rating: 4.6,
    reviewCount: 128,
  },
  {
    id: 'biz_2',
    slug: 'clinica-dental-zapopan-norte',
    name: 'Clínica Dental Zapopan Norte',
    shortDescription: 'Odontología general, ortodoncia y urgencias dentales.',
    logoUrl: null,
    coverImageUrl: null,
    category: categoryBySlug('salud-y-bienestar'),
    municipality: municipalityBySlug('zapopan'),
    neighborhoodName: 'Ciudad Granja',
    isVerified: true,
    isPremium: true,
    isBoosted: false,
    rating: 4.9,
    reviewCount: 64,
  },
  {
    id: 'biz_3',
    slug: 'plomeria-express-tlaquepaque',
    name: 'Plomería Express Tlaquepaque',
    shortDescription: 'Fugas, boilers y destape de drenaje. Servicio a domicilio.',
    logoUrl: null,
    coverImageUrl: null,
    category: categoryBySlug('hogar-y-servicios'),
    municipality: municipalityBySlug('tlaquepaque'),
    neighborhoodName: 'Centro',
    isVerified: false,
    isPremium: false,
    isBoosted: false,
    rating: null,
    reviewCount: 0,
  },
  {
    id: 'biz_4',
    slug: 'estudio-belleza-tonala',
    name: 'Estudio de Belleza Tonalá',
    shortDescription: 'Corte, color y tratamientos capilares.',
    logoUrl: null,
    coverImageUrl: null,
    category: categoryBySlug('belleza-y-cuidado-personal'),
    municipality: municipalityBySlug('tonala'),
    neighborhoodName: 'Loma Dorada',
    isVerified: true,
    isPremium: false,
    isBoosted: false,
    rating: 4.3,
    reviewCount: 21,
  },
  {
    id: 'biz_5',
    slug: 'taller-mecanico-tlajomulco',
    name: 'Taller Mecánico Tlajomulco',
    shortDescription: 'Afinación, frenos y diagnóstico computarizado.',
    logoUrl: null,
    coverImageUrl: null,
    category: categoryBySlug('autos-y-talleres'),
    municipality: municipalityBySlug('tlajomulco'),
    neighborhoodName: 'Santa Fe',
    isVerified: true,
    isPremium: false,
    isBoosted: false,
    rating: 4.1,
    reviewCount: 9,
  },
];

export const mockBusinessPins: BusinessPin[] = [
  {
    id: 'biz_1',
    slug: 'taqueria-el-buen-pastor',
    name: 'Taquería El Buen Pastor',
    latitude: 20.6736,
    longitude: -103.3644,
    category: categoryBySlug('comida-y-restaurantes'),
    isPremium: false,
  },
  {
    id: 'biz_2',
    slug: 'clinica-dental-zapopan-norte',
    name: 'Clínica Dental Zapopan Norte',
    latitude: 20.7236,
    longitude: -103.4128,
    category: categoryBySlug('salud-y-bienestar'),
    isPremium: true,
  },
  {
    id: 'biz_3',
    slug: 'plomeria-express-tlaquepaque',
    name: 'Plomería Express Tlaquepaque',
    latitude: 20.6407,
    longitude: -103.3126,
    category: categoryBySlug('hogar-y-servicios'),
    isPremium: false,
  },
];

const mockBusinessDetails: Record<string, BusinessDetail> = {
  'taqueria-el-buen-pastor': {
    ...mockBusinessCards[0],
    description:
      'Trompo al pastor cortado a mano, salsas caseras y horario extendido los fines de semana. Servicio en mesa y para llevar.',
    phone: '3312345678',
    whatsapp: '523312345678',
    email: null,
    websiteUrl: null,
    addressText: 'Av. Chapultepec 123, Col. Americana, Guadalajara',
    latitude: 20.6736,
    longitude: -103.3644,
    images: [],
    hours: [
      { dayOfWeek: 0, opensAt: null, closesAt: null, isClosed: true },
      { dayOfWeek: 1, opensAt: '18:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 2, opensAt: '18:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 3, opensAt: '18:00', closesAt: '23:30', isClosed: false },
      { dayOfWeek: 4, opensAt: '18:00', closesAt: '01:00', isClosed: false },
      { dayOfWeek: 5, opensAt: '18:00', closesAt: '01:00', isClosed: false },
      { dayOfWeek: 6, opensAt: '13:00', closesAt: '01:00', isClosed: false },
    ],
    reviews: [
      { id: 'rev_1', userName: 'Ana R.', rating: 5, comment: 'El mejor trompo de la Americana.', createdAt: '2026-07-02T20:00:00.000Z' },
      { id: 'rev_2', userName: 'Luis M.', rating: 4, comment: 'Rico pero hay que llegar temprano.', createdAt: '2026-06-18T21:00:00.000Z' },
    ],
  },
};

export function getMockBusinessDetail(slug: string): BusinessDetail | null {
  return mockBusinessDetails[slug] ?? null;
}
