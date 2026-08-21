import type { Category, Municipality } from '../types';

export const mockMunicipalities: Municipality[] = [
  { id: 'mun_gdl', name: 'Guadalajara', slug: 'guadalajara' },
  { id: 'mun_zap', name: 'Zapopan', slug: 'zapopan' },
  { id: 'mun_tlq', name: 'Tlaquepaque', slug: 'tlaquepaque' },
  { id: 'mun_ton', name: 'Tonalá', slug: 'tonala' },
  { id: 'mun_tlj', name: 'Tlajomulco de Zúñiga', slug: 'tlajomulco' },
];

export const mockCategories: Category[] = [
  { id: 'cat_comida', name: 'Comida y restaurantes', slug: 'comida-y-restaurantes', icon: 'utensils' },
  { id: 'cat_salud', name: 'Salud y bienestar', slug: 'salud-y-bienestar', icon: 'heart-pulse' },
  { id: 'cat_hogar', name: 'Hogar y servicios', slug: 'hogar-y-servicios', icon: 'wrench' },
  { id: 'cat_belleza', name: 'Belleza y cuidado personal', slug: 'belleza-y-cuidado-personal', icon: 'scissors' },
  { id: 'cat_autos', name: 'Autos y talleres', slug: 'autos-y-talleres', icon: 'car' },
  { id: 'cat_educacion', name: 'Educación', slug: 'educacion', icon: 'graduation-cap' },
];
