/**
 * Datos mock de negocios reales-en-forma (nombres y giros verosímiles de la
 * ZMG), NO datos reales de terceros. Sirven para desarrollar la UI en modo
 * `EXPO_PUBLIC_USE_MOCKS=1` (opt-in) sin pegarle al backend real.
 *
 * *** DATOS DE PRUEBA *** — nombres, teléfonos y coordenadas son de ejemplo.
 * Los teléfonos usan el prefijo de área 33 (GDL) pero NO corresponden a
 * negocios reales; nunca se deben marcar en la vida real.
 */
import type { BusinessCard, BusinessDetail, BusinessHour, BusinessPin, Review } from '../types';
import { mockCategories, mockMunicipalities } from './categories';

const categoryBySlug = (slug: string) => {
  const found = mockCategories.find((c) => c.slug === slug);
  return found ? { name: found.name, slug: found.slug, icon: found.icon } : null;
};
const municipalityBySlug = (slug: string) => {
  const found = mockMunicipalities.find((m) => m.slug === slug);
  return found ? { name: found.name, slug: found.slug } : null;
};

/** Horario típico de comercio (10am-8pm, cerrado domingo). */
const RETAIL_HOURS: BusinessHour[] = [
  { dayOfWeek: 0, opensAt: null, closesAt: null, isClosed: true },
  { dayOfWeek: 1, opensAt: '10:00', closesAt: '20:00', isClosed: false },
  { dayOfWeek: 2, opensAt: '10:00', closesAt: '20:00', isClosed: false },
  { dayOfWeek: 3, opensAt: '10:00', closesAt: '20:00', isClosed: false },
  { dayOfWeek: 4, opensAt: '10:00', closesAt: '20:00', isClosed: false },
  { dayOfWeek: 5, opensAt: '10:00', closesAt: '20:00', isClosed: false },
  { dayOfWeek: 6, opensAt: '10:00', closesAt: '18:00', isClosed: false },
];

/** Horario de antojitos/restaurante (abre en la tarde-noche, cierra tarde). */
const EVENING_FOOD_HOURS: BusinessHour[] = [
  { dayOfWeek: 0, opensAt: null, closesAt: null, isClosed: true },
  { dayOfWeek: 1, opensAt: '18:00', closesAt: '23:30', isClosed: false },
  { dayOfWeek: 2, opensAt: '18:00', closesAt: '23:30', isClosed: false },
  { dayOfWeek: 3, opensAt: '18:00', closesAt: '23:30', isClosed: false },
  { dayOfWeek: 4, opensAt: '18:00', closesAt: '01:00', isClosed: false },
  { dayOfWeek: 5, opensAt: '18:00', closesAt: '01:00', isClosed: false },
  { dayOfWeek: 6, opensAt: '13:00', closesAt: '01:00', isClosed: false },
];

/** Horario de oficina/consultorio (lunes a viernes 9-6, sábado medio día). */
const OFFICE_HOURS: BusinessHour[] = [
  { dayOfWeek: 0, opensAt: null, closesAt: null, isClosed: true },
  { dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00', isClosed: false },
  { dayOfWeek: 2, opensAt: '09:00', closesAt: '18:00', isClosed: false },
  { dayOfWeek: 3, opensAt: '09:00', closesAt: '18:00', isClosed: false },
  { dayOfWeek: 4, opensAt: '09:00', closesAt: '18:00', isClosed: false },
  { dayOfWeek: 5, opensAt: '09:00', closesAt: '18:00', isClosed: false },
  { dayOfWeek: 6, opensAt: '09:00', closesAt: '14:00', isClosed: false },
];

function isOpenNowFromHours(hours: BusinessHour[]): boolean {
  const now = new Date();
  const today = hours.find((h) => h.dayOfWeek === now.getDay());
  if (!today || today.isClosed || !today.opensAt || !today.closesAt) return false;
  const [oh, om] = today.opensAt.split(':').map(Number);
  const [ch, cm] = today.closesAt.split(':').map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const opens = oh * 60 + om;
  let closes = ch * 60 + cm;
  if (closes <= opens) closes += 24 * 60;
  return nowMin >= opens && nowMin < closes;
}

type Seed = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  municipality: string;
  neighborhoodName: string;
  latitude: number;
  longitude: number;
  isVerified: boolean;
  isFeatured: boolean;
  isBoosted: boolean;
  rating: number | null;
  reviewCount: number;
  hours: BusinessHour[];
  phone: string;
  reviews: Review[];
};

const seeds: Seed[] = [
  {
    id: 'biz_1',
    slug: 'taqueria-el-buen-pastor',
    name: 'Taquería El Buen Pastor',
    shortDescription: 'Tacos al pastor y de asada, trompo desde las 6pm.',
    description:
      'Trompo al pastor cortado a mano, salsas caseras y horario extendido los fines de semana. Servicio en mesa y para llevar.',
    category: 'comida-y-restaurantes',
    municipality: 'guadalajara',
    neighborhoodName: 'Americana',
    latitude: 20.6736,
    longitude: -103.3644,
    isVerified: true,
    isFeatured: false,
    isBoosted: true,
    rating: 4.6,
    reviewCount: 128,
    hours: EVENING_FOOD_HOURS,
    phone: '3312340001',
    reviews: [
      { id: 'rev_1_1', authorName: 'Ana R.', rating: 5, title: null, comment: 'El mejor trompo de la Americana.', createdAt: '2026-07-02T20:00:00.000Z', ownerResponse: null },
      { id: 'rev_1_2', authorName: 'Luis M.', rating: 4, title: null, comment: 'Rico pero hay que llegar temprano.', createdAt: '2026-06-18T21:00:00.000Z', ownerResponse: null },
      { id: 'rev_1_3', authorName: 'Karla V.', rating: 5, title: null, comment: 'Las salsas son caseras de verdad.', createdAt: '2026-05-30T02:00:00.000Z', ownerResponse: null },
    ],
  },
  {
    id: 'biz_2',
    slug: 'clinica-dental-zapopan-norte',
    name: 'Clínica Dental Zapopan Norte',
    shortDescription: 'Odontología general, ortodoncia y urgencias dentales.',
    description: 'Consultorio con 3 dentistas certificados. Atendemos urgencias el mismo día y planes de ortodoncia a meses sin intereses.',
    category: 'salud-y-bienestar',
    municipality: 'zapopan',
    neighborhoodName: 'Ciudad Granja',
    latitude: 20.7236,
    longitude: -103.4128,
    isVerified: true,
    isFeatured: true,
    isBoosted: false,
    rating: 4.9,
    reviewCount: 64,
    hours: OFFICE_HOURS,
    phone: '3312340002',
    reviews: [
      { id: 'rev_2_1', authorName: 'Jorge P.', rating: 5, title: null, comment: 'Muy profesionales, sin dolor.', createdAt: '2026-07-10T15:00:00.000Z', ownerResponse: null },
      { id: 'rev_2_2', authorName: 'Marcela T.', rating: 5, title: null, comment: 'Excelente atención con mis hijos.', createdAt: '2026-06-02T18:00:00.000Z', ownerResponse: null },
    ],
  },
  {
    id: 'biz_3',
    slug: 'plomeria-express-tlaquepaque',
    name: 'Plomería Express Tlaquepaque',
    shortDescription: 'Fugas, boilers y destape de drenaje. Servicio a domicilio.',
    description: 'Servicio a domicilio en toda la zona de Tlaquepaque. Presupuesto sin costo antes de cualquier trabajo.',
    category: 'hogar-y-servicios',
    municipality: 'tlaquepaque',
    neighborhoodName: 'Centro',
    latitude: 20.6407,
    longitude: -103.3126,
    isVerified: false,
    isFeatured: false,
    isBoosted: false,
    rating: null,
    reviewCount: 0,
    hours: RETAIL_HOURS,
    phone: '3312340003',
    reviews: [],
  },
  {
    id: 'biz_4',
    slug: 'estudio-belleza-tonala',
    name: 'Estudio de Belleza Tonalá',
    shortDescription: 'Corte, color y tratamientos capilares.',
    description: 'Estilistas con más de 10 años de experiencia. Manejamos productos profesionales de marca reconocida.',
    category: 'belleza-y-cuidado-personal',
    municipality: 'tonala',
    neighborhoodName: 'Loma Dorada',
    latitude: 20.6229,
    longitude: -103.2346,
    isVerified: true,
    isFeatured: false,
    isBoosted: false,
    rating: 4.3,
    reviewCount: 21,
    hours: RETAIL_HOURS,
    phone: '3312340004',
    reviews: [{ id: 'rev_4_1', authorName: 'Diana S.', rating: 4, title: null, comment: 'Buen trabajo con el color.', createdAt: '2026-07-15T19:00:00.000Z', ownerResponse: null }],
  },
  {
    id: 'biz_5',
    slug: 'taller-mecanico-tlajomulco',
    name: 'Taller Mecánico Tlajomulco',
    shortDescription: 'Afinación, frenos y diagnóstico computarizado.',
    description: 'Diagnóstico computarizado gratis con cualquier servicio. Refacciones originales o genéricas, tú decides.',
    category: 'autos-y-talleres',
    municipality: 'tlajomulco',
    neighborhoodName: 'Santa Fe',
    latitude: 20.5044,
    longitude: -103.4433,
    isVerified: true,
    isFeatured: false,
    isBoosted: false,
    rating: 4.1,
    reviewCount: 9,
    hours: RETAIL_HOURS,
    phone: '3312340005',
    reviews: [{ id: 'rev_5_1', authorName: 'Ricardo A.', rating: 4, title: null, comment: 'Buen precio y rápido.', createdAt: '2026-06-20T16:00:00.000Z', ownerResponse: null }],
  },
  {
    id: 'biz_6',
    slug: 'mariscos-la-costa-chapalita',
    name: 'Mariscos La Costa Chapalita',
    shortDescription: 'Camarones, pescado zarandeado y cocteles frescos.',
    description: 'Producto fresco todos los días. Especialidad en pescado zarandeado los fines de semana.',
    category: 'comida-y-restaurantes',
    municipality: 'guadalajara',
    neighborhoodName: 'Chapalita',
    latitude: 20.6668,
    longitude: -103.4053,
    isVerified: true,
    isFeatured: false,
    isBoosted: false,
    rating: 4.5,
    reviewCount: 87,
    hours: RETAIL_HOURS,
    phone: '3312340006',
    reviews: [{ id: 'rev_6_1', authorName: 'Paty G.', rating: 5, title: null, comment: 'El coctel de camarón es enorme.', createdAt: '2026-07-01T18:00:00.000Z', ownerResponse: null }],
  },
  {
    id: 'biz_7',
    slug: 'gimnasio-fuerza-andares',
    name: 'Gimnasio Fuerza Andares',
    shortDescription: 'Pesas, funcional y clases grupales.',
    description: 'Área de pesas libre, máquinas de cardio y clases grupales de funcional todos los días.',
    category: 'deportes-y-fitness',
    municipality: 'zapopan',
    neighborhoodName: 'Andares',
    latitude: 20.7205,
    longitude: -103.3893,
    isVerified: true,
    isFeatured: true,
    isBoosted: true,
    rating: 4.7,
    reviewCount: 152,
    hours: RETAIL_HOURS,
    phone: '3312340007',
    reviews: [{ id: 'rev_7_1', authorName: 'Sergio L.', rating: 5, title: null, comment: 'Instalaciones muy limpias.', createdAt: '2026-07-18T13:00:00.000Z', ownerResponse: null }],
  },
  {
    id: 'biz_8',
    slug: 'veterinaria-huellitas-providencia',
    name: 'Veterinaria Huellitas Providencia',
    shortDescription: 'Consulta, vacunación y estética canina.',
    description: 'Atención de urgencias y consulta general. Contamos con estética canina y venta de alimento.',
    category: 'mascotas',
    municipality: 'guadalajara',
    neighborhoodName: 'Providencia',
    latitude: 20.6907,
    longitude: -103.3813,
    isVerified: true,
    isFeatured: false,
    isBoosted: false,
    rating: 4.8,
    reviewCount: 43,
    hours: OFFICE_HOURS,
    phone: '3312340008',
    reviews: [],
  },
  {
    id: 'biz_9',
    slug: 'panaderia-el-trigal-tonala',
    name: 'Panadería El Trigal Tonalá',
    shortDescription: 'Pan dulce, bolillo y pasteles por encargo.',
    description: 'Horneado diario desde las 6am. Aceptamos pedidos de pastel con 48 horas de anticipación.',
    category: 'comida-y-restaurantes',
    municipality: 'tonala',
    neighborhoodName: 'Centro',
    latitude: 20.6197,
    longitude: -103.2374,
    isVerified: false,
    isFeatured: false,
    isBoosted: false,
    rating: 4.2,
    reviewCount: 15,
    hours: RETAIL_HOURS,
    phone: '3312340009',
    reviews: [],
  },
  {
    id: 'biz_10',
    slug: 'escuela-idiomas-tlajomulco',
    name: 'Escuela de Idiomas Tlajomulco',
    shortDescription: 'Inglés para niños, jóvenes y adultos.',
    description: 'Grupos reducidos y maestros certificados. Niveles desde principiante hasta preparación para exámenes internacionales.',
    category: 'educacion',
    municipality: 'tlajomulco',
    neighborhoodName: 'Chulavista',
    latitude: 20.4761,
    longitude: -103.4587,
    isVerified: true,
    isFeatured: false,
    isBoosted: false,
    rating: 4.4,
    reviewCount: 12,
    hours: OFFICE_HOURS,
    phone: '3312340010',
    reviews: [],
  },
  {
    id: 'biz_11',
    slug: 'spa-relax-las-juntas',
    name: 'Spa Relax Las Juntas',
    shortDescription: 'Masajes relajantes y faciales.',
    description: 'Ambiente tranquilo, aceites naturales y paquetes de pareja disponibles con reservación.',
    category: 'belleza-y-cuidado-personal',
    municipality: 'tlaquepaque',
    neighborhoodName: 'Las Juntas',
    latitude: 20.6157,
    longitude: -103.2957,
    isVerified: true,
    isFeatured: true,
    isBoosted: false,
    rating: 4.9,
    reviewCount: 38,
    hours: RETAIL_HOURS,
    phone: '3312340011',
    reviews: [],
  },
  {
    id: 'biz_12',
    slug: 'llantera-el-rapido-base-aerea',
    name: 'Llantera El Rápido Base Aérea',
    shortDescription: 'Llantas, balanceo y alineación.',
    description: 'Balanceo computarizado y revisión de suspensión sin costo con la compra de 2 llantas o más.',
    category: 'autos-y-talleres',
    municipality: 'zapopan',
    neighborhoodName: 'Base Aérea',
    latitude: 20.5223,
    longitude: -103.3934,
    isVerified: false,
    isFeatured: false,
    isBoosted: false,
    rating: 3.9,
    reviewCount: 6,
    hours: RETAIL_HOURS,
    phone: '3312340012',
    reviews: [],
  },
];

function toCard(seed: Seed): BusinessCard {
  return {
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    shortDescription: seed.shortDescription,
    logoUrl: null,
    coverImageUrl: null,
    category: categoryBySlug(seed.category),
    municipality: municipalityBySlug(seed.municipality),
    neighborhood: { name: seed.neighborhoodName, slug: seed.neighborhoodName },
    isVerified: seed.isVerified,
    isFeatured: seed.isFeatured,
    isBoosted: seed.isBoosted,
    rating: seed.rating,
    reviewCount: seed.reviewCount,
    lat: seed.latitude,
    lng: seed.longitude,
    distanceKm: null,
    isOpenNow: isOpenNowFromHours(seed.hours),
  };
}

export const mockBusinessCards: BusinessCard[] = seeds.map(toCard);

export const mockBusinessPins: BusinessPin[] = seeds.map((seed) => ({
  id: seed.id,
  slug: seed.slug,
  name: seed.name,
  lat: seed.latitude,
  lng: seed.longitude,
  icon: categoryBySlug(seed.category)?.icon ?? null,
  isVerified: seed.isVerified,
}));

const mockBusinessDetails: Record<string, BusinessDetail> = Object.fromEntries(
  seeds.map((seed) => [
    seed.slug,
    {
      ...toCard(seed),
      description: seed.description,
      phone: seed.phone,
      whatsapp: `52${seed.phone}`,
      email: null,
      websiteUrl: null,
      addressText: `Calle de ejemplo s/n, Col. ${seed.neighborhoodName}, ${municipalityBySlug(seed.municipality)?.name ?? ''}`,
      socials: { facebookUrl: null, instagramUrl: null, tiktokUrl: null, youtubeUrl: null, linkedinUrl: null },
      hours: seed.hours,
      images: [],
      tags: [],
      reviewsPreview: seed.reviews.slice(0, 5),
      isFavorite: false,
      plan: null,
    } satisfies BusinessDetail,
  ]),
);

export function getMockBusinessDetail(slug: string): BusinessDetail | null {
  return mockBusinessDetails[slug] ?? null;
}

export function getMockBusinessReviews(slug: string): Review[] {
  const seed = seeds.find((s) => s.slug === slug);
  return seed?.reviews ?? [];
}
