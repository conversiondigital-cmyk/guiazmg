import type { CategoryWithSubcategories, MarketplaceCategory, MunicipalityWithNeighborhoods } from '../types';

/**
 * Colonias por municipio, para el filtro municipio→colonia del bottom sheet.
 * Zapopan lleva primero los barrios objetivo de la fase 1 del producto
 * (Zapopan norte: Zona Real, Jardín Real, Valle Real, Providencia, Andares y
 * Puerta de Hierro) — son reales, no un placeholder de relleno.
 */
const NEIGHBORHOODS_BY_MUNICIPALITY: Record<string, string[]> = {
  guadalajara: ['Americana', 'Centro', 'Chapalita', 'Providencia', 'Lafayette'],
  zapopan: ['Zona Real', 'Jardín Real', 'Valle Real', 'Andares', 'Puerta de Hierro', 'Ciudad Granja', 'Base Aérea', 'Santa Margarita'],
  tlaquepaque: ['Centro', 'Las Juntas', 'El Álamo'],
  tonala: ['Loma Dorada', 'Centro', 'Jalisco'],
  tlajomulco: ['Santa Fe', 'Chulavista', 'Centro'],
};

export const mockMunicipalities: MunicipalityWithNeighborhoods[] = [
  { name: 'Guadalajara', slug: 'guadalajara', neighborhoods: NEIGHBORHOODS_BY_MUNICIPALITY.guadalajara.map((name) => ({ name, slug: name })) },
  { name: 'Zapopan', slug: 'zapopan', neighborhoods: NEIGHBORHOODS_BY_MUNICIPALITY.zapopan.map((name) => ({ name, slug: name })) },
  { name: 'Tlaquepaque', slug: 'tlaquepaque', neighborhoods: NEIGHBORHOODS_BY_MUNICIPALITY.tlaquepaque.map((name) => ({ name, slug: name })) },
  { name: 'Tonalá', slug: 'tonala', neighborhoods: NEIGHBORHOODS_BY_MUNICIPALITY.tonala.map((name) => ({ name, slug: name })) },
  { name: 'Tlajomulco de Zúñiga', slug: 'tlajomulco', neighborhoods: NEIGHBORHOODS_BY_MUNICIPALITY.tlajomulco.map((name) => ({ name, slug: name })) },
];

/** Subcategorías de ejemplo por categoría, para el filtro del bottom sheet. */
const SUBCATEGORIES_BY_CATEGORY: Record<string, string[]> = {
  'comida-y-restaurantes': ['Tacos', 'Mariscos', 'Café y postres', 'Comida corrida', 'Antojitos'],
  'salud-y-bienestar': ['Dental', 'General', 'Nutrición', 'Psicología'],
  'hogar-y-servicios': ['Plomería', 'Electricidad', 'Limpieza', 'Jardinería'],
  'belleza-y-cuidado-personal': ['Estética', 'Barbería', 'Uñas', 'Spa'],
  'autos-y-talleres': ['Mecánica general', 'Hojalatería', 'Llantera', 'Eléctrico automotriz'],
  educacion: ['Regularización', 'Idiomas', 'Música', 'Preescolar'],
};

export const mockCategories: CategoryWithSubcategories[] = [
  { name: 'Comida y restaurantes', slug: 'comida-y-restaurantes', icon: '🌮', subcategories: SUBCATEGORIES_BY_CATEGORY['comida-y-restaurantes'].map((name) => ({ name, slug: name })) },
  { name: 'Salud y bienestar', slug: 'salud-y-bienestar', icon: '🩺', subcategories: SUBCATEGORIES_BY_CATEGORY['salud-y-bienestar'].map((name) => ({ name, slug: name })) },
  { name: 'Hogar y servicios', slug: 'hogar-y-servicios', icon: '🔧', subcategories: SUBCATEGORIES_BY_CATEGORY['hogar-y-servicios'].map((name) => ({ name, slug: name })) },
  { name: 'Belleza y cuidado personal', slug: 'belleza-y-cuidado-personal', icon: '💇', subcategories: SUBCATEGORIES_BY_CATEGORY['belleza-y-cuidado-personal'].map((name) => ({ name, slug: name })) },
  { name: 'Autos y talleres', slug: 'autos-y-talleres', icon: '🚗', subcategories: SUBCATEGORIES_BY_CATEGORY['autos-y-talleres'].map((name) => ({ name, slug: name })) },
  { name: 'Educación', slug: 'educacion', icon: '🎓', subcategories: SUBCATEGORIES_BY_CATEGORY.educacion.map((name) => ({ name, slug: name })) },
  { name: 'Mascotas', slug: 'mascotas', icon: '🐾', subcategories: [] },
  { name: 'Deportes y fitness', slug: 'deportes-y-fitness', icon: '🏋️', subcategories: [] },
];

/** Las 10 categorías raíz del marketplace (fijas por producto) — únicas que sí traen `id` en el contrato real. */
export const mockMarketplaceCategories: MarketplaceCategory[] = [
  { id: 'mkt_productos', name: 'Productos', slug: 'productos', icon: '📦' },
  { id: 'mkt_servicios', name: 'Servicios', slug: 'servicios', icon: '🛠️' },
  { id: 'mkt_empleos', name: 'Empleos', slug: 'empleos', icon: '💼' },
  { id: 'mkt_mascotas', name: 'Mascotas', slug: 'mascotas', icon: '🐶' },
  { id: 'mkt_vehiculos', name: 'Vehículos', slug: 'vehiculos', icon: '🚙' },
  { id: 'mkt_inmuebles', name: 'Inmuebles', slug: 'inmuebles', icon: '🏠' },
  { id: 'mkt_eventos', name: 'Eventos', slug: 'eventos', icon: '🎉' },
  { id: 'mkt_comida', name: 'Comida', slug: 'comida', icon: '🍱' },
  { id: 'mkt_clases', name: 'Clases', slug: 'clases', icon: '📚' },
  { id: 'mkt_comunidad', name: 'Comunidad', slug: 'comunidad', icon: '🤝' },
];
