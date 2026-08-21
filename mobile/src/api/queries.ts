/**
 * Hooks de React Query sobre `apiClient`. Las pantallas consumen ESTOS
 * hooks, nunca `apiClient` directo, para que carga/vacío/error y caché salgan
 * gratis y consistentes en toda la app.
 */
import { useQuery } from '@tanstack/react-query';

import { apiClient } from './client';
import type { BusinessCard, BusinessDetail, BusinessPin, Category, Municipality } from './types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get<Category[]>('/categories'),
  });
}

export function useMunicipalities() {
  return useQuery({
    queryKey: ['municipalities'],
    queryFn: () => apiClient.get<Municipality[]>('/municipalities'),
  });
}

export function useBusinesses(filters: { category?: string; municipality?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ['businesses', filters],
    queryFn: () => apiClient.get<BusinessCard[]>('/businesses', filters),
  });
}

export function useBusinessPins() {
  return useQuery({
    queryKey: ['business-pins'],
    queryFn: () => apiClient.get<BusinessPin[]>('/businesses/pins'),
  });
}

export function useBusinessDetail(slug: string) {
  return useQuery({
    queryKey: ['business', slug],
    queryFn: () => apiClient.get<BusinessDetail>(`/businesses/${slug}`),
    enabled: Boolean(slug),
  });
}
