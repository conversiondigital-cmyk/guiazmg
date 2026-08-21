/**
 * Datos mock del marketplace. *** DATOS DE PRUEBA *** — precios, vendedores
 * y descripciones son de ejemplo, no publicaciones reales.
 */
import type { MarketplaceListingDetail, MarketplaceListing, MarketplaceSeller } from '../types';
import { mockMarketplaceCategories, mockMunicipalities } from './categories';

const categoryBySlug = (slug: string) => {
  const found = mockMarketplaceCategories.find((c) => c.slug === slug);
  return found ? { name: found.name, slug: found.slug, icon: found.icon } : null;
};
const municipalityBySlug = (slug: string) => {
  const found = mockMunicipalities.find((m) => m.slug === slug);
  return found ? { name: found.name } : null;
};

const sellers: Record<string, MarketplaceSeller> = {
  sel_1: { id: 'sel_1', name: 'Fernanda O.', image: null },
  sel_2: { id: 'sel_2', name: 'Héctor M.', image: null },
  sel_3: { id: 'sel_3', name: 'Rosa I.', image: null },
};

type ListingSeed = {
  id: string;
  title: string;
  price: number | null;
  category: string;
  municipality: string;
  condition: string;
  createdAt: string;
  sellerId: string;
  description: string;
  phone: string;
};

const listingSeeds: ListingSeed[] = [
  {
    id: 'lst_1',
    title: 'Refrigerador Mabe 14 pies, poco uso',
    price: 4500,
    category: 'productos',
    municipality: 'guadalajara',
    condition: 'good',
    createdAt: '2026-08-15T12:00:00.000Z',
    sellerId: 'sel_1',
    description: 'Refrigerador en buen estado, sin detalles de funcionamiento. Se vende por cambio de casa. Incluye charolas originales.',
    phone: '3312350001',
  },
  {
    id: 'lst_2',
    title: 'Se busca ayudante de albañil, pago semanal',
    price: null,
    category: 'empleos',
    municipality: 'zapopan',
    condition: 'new',
    createdAt: '2026-08-18T09:00:00.000Z',
    sellerId: 'sel_2',
    description: 'Vacante para ayudante de albañil en obra en Zapopan. Pago semanal, se ofrece comida. Interesados comunicarse por WhatsApp.',
    phone: '3312350002',
  },
  {
    id: 'lst_3',
    title: 'Cachorros Schnauzer con cartilla',
    price: 3500,
    category: 'mascotas',
    municipality: 'tlaquepaque',
    condition: 'new',
    createdAt: '2026-08-10T15:00:00.000Z',
    sellerId: 'sel_3',
    description: 'Camada de 4 cachorros Schnauzer, ya desparasitados y con primera vacuna. Listos para entregar.',
    phone: '3312350003',
  },
  {
    id: 'lst_4',
    title: 'Nissan March 2018, único dueño',
    price: 165000,
    category: 'vehiculos',
    municipality: 'tonala',
    condition: 'good',
    createdAt: '2026-08-05T11:00:00.000Z',
    sellerId: 'sel_1',
    description: 'Nissan March 2018, 68,000 km, servicios de agencia al corriente, factura original.',
    phone: '3312350004',
  },
  {
    id: 'lst_5',
    title: 'Departamento en renta, 2 recámaras',
    price: 8500,
    category: 'inmuebles',
    municipality: 'tlajomulco',
    condition: 'good',
    createdAt: '2026-08-17T18:00:00.000Z',
    sellerId: 'sel_2',
    description: 'Departamento de 2 recámaras, 1 baño, cocina integral. Incluye 1 cajón de estacionamiento.',
    phone: '3312350005',
  },
  {
    id: 'lst_6',
    title: 'Clases particulares de matemáticas (secundaria/prepa)',
    price: 200,
    category: 'clases',
    municipality: 'guadalajara',
    condition: 'new',
    createdAt: '2026-08-12T16:00:00.000Z',
    sellerId: 'sel_3',
    description: 'Clases a domicilio o por videollamada, $200/hora. Enfoque en preparación de exámenes.',
    phone: '3312350006',
  },
  {
    id: 'lst_7',
    title: 'Bicicleta de montaña rodada 26',
    price: 2200,
    category: 'productos',
    municipality: 'zapopan',
    condition: 'like_new',
    createdAt: '2026-07-28T10:00:00.000Z',
    sellerId: 'sel_1',
    description: 'Bicicleta rodada 26, 21 velocidades. Muy poco uso, se vende con candado y luces.',
    phone: '3312350007',
  },
  {
    id: 'lst_8',
    title: 'Mesa de banquetes para eventos (renta)',
    price: 80,
    category: 'eventos',
    municipality: 'tlaquepaque',
    condition: 'good',
    createdAt: '2026-08-09T08:00:00.000Z',
    sellerId: 'sel_2',
    description: 'Renta de mesas plegables para 8 personas, $80 por evento. Entrega y recolección con costo extra.',
    phone: '3312350008',
  },
];

function toListing(seed: ListingSeed): MarketplaceListing {
  return {
    id: seed.id,
    slug: seed.id,
    title: seed.title,
    price: seed.price !== null ? String(seed.price) : null,
    type: 'SALE',
    condition: seed.condition,
    coverImageUrl: null,
    municipality: municipalityBySlug(seed.municipality),
    neighborhood: null,
    createdAt: seed.createdAt,
    category: categoryBySlug(seed.category),
    isBoosted: false,
    favoriteCount: 0,
  };
}

export const mockMarketplaceListings: MarketplaceListing[] = listingSeeds.map(toListing);

const mockListingDetails: Record<string, MarketplaceListingDetail> = Object.fromEntries(
  listingSeeds.map((seed) => [
    seed.id,
    {
      ...toListing(seed),
      description: seed.description,
      images: [],
      seller: sellers[seed.sellerId],
      phone: seed.phone,
      whatsapp: `52${seed.phone}`,
      views: 0,
    } satisfies MarketplaceListingDetail,
  ]),
);

export function getMockMarketplaceListing(id: string): MarketplaceListingDetail | null {
  return mockListingDetails[id] ?? null;
}
