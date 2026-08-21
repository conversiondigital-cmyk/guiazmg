/**
 * Bottom sheet de filtros de Explorar: categoría→subcategoría,
 * municipio→colonia, orden, rating mínimo, distancia máxima, switches.
 * Pie con "Limpiar" y "Ver N resultados". El orden por distancia se
 * deshabilita y explica si no hay ubicación.
 */
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef, useMemo } from 'react';
import { Switch, View } from 'react-native';

import type { CatalogResponse } from '@/api/queries';
import type { BusinessSearchFilters } from '@/api/types';
import { useTheme } from '@/theme/theme-provider';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Text } from '@/ui/Text';

export type ExploreFilters = Pick<
  BusinessSearchFilters,
  'category' | 'subcategory' | 'municipality' | 'neighborhood' | 'onlyVerified' | 'onlyOpenNow' | 'minRating' | 'maxDistanceKm' | 'sort'
>;

export const EMPTY_FILTERS: ExploreFilters = {};

/** Cuenta cuántos filtros "cuentan" para el badge "Filtros · N" del chip. */
export function countActiveFilters(filters: ExploreFilters): number {
  let count = 0;
  if (filters.category) count += 1;
  if (filters.subcategory) count += 1;
  if (filters.municipality) count += 1;
  if (filters.neighborhood) count += 1;
  if (filters.onlyVerified) count += 1;
  if (filters.onlyOpenNow) count += 1;
  if (filters.minRating) count += 1;
  if (filters.maxDistanceKm) count += 1;
  if (filters.sort && filters.sort !== 'relevance') count += 1;
  return count;
}

export type FilterBottomSheetProps = {
  catalog: CatalogResponse | undefined;
  filters: ExploreFilters;
  onChange: (next: ExploreFilters) => void;
  onClear: () => void;
  onApply: () => void;
  resultCount: number;
  hasLocation: boolean;
};

const RATING_OPTIONS = [3, 4, 4.5];
const DISTANCE_OPTIONS = [1, 5, 10];
const SORT_OPTIONS: { value: NonNullable<ExploreFilters['sort']>; label: string }[] = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'distance', label: 'Distancia' },
  { value: 'rating', label: 'Mejor calificados' },
  { value: 'newest', label: 'Más nuevos' },
];

export const FilterBottomSheet = forwardRef<BottomSheetModal, FilterBottomSheetProps>(function FilterBottomSheet(
  { catalog, filters, onChange, onClear, onApply, resultCount, hasLocation },
  ref,
) {
  const theme = useTheme();
  const snapPoints = useMemo(() => ['85%'], []);

  const subcategories = filters.category
    ? catalog?.categories.find((c) => c.slug === filters.category)?.subcategories.map((s) => s.name) ?? []
    : [];
  const neighborhoods = filters.municipality
    ? catalog?.municipalities.find((m) => m.slug === filters.municipality)?.neighborhoods.map((n) => n.name) ?? []
    : [];

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: theme.colors.background }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      enableDynamicSizing={false}>
      <BottomSheetScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[5], paddingBottom: theme.spacing[10] }}>
        <Text variant="h2">Filtros</Text>

        <Section title="Categoría">
          <ChipRow>
            <Chip
              label="Todas"
              active={!filters.category}
              onPress={() => onChange({ ...filters, category: undefined, subcategory: undefined })}
            />
            {(catalog?.categories ?? []).map((category) => (
              <Chip
                key={category.slug}
                label={`${category.icon ?? ''} ${category.name}`.trim()}
                active={filters.category === category.slug}
                onPress={() => onChange({ ...filters, category: category.slug, subcategory: undefined })}
              />
            ))}
          </ChipRow>
        </Section>

        {subcategories.length > 0 ? (
          <Section title="Subcategoría">
            <ChipRow>
              <Chip label="Todas" active={!filters.subcategory} onPress={() => onChange({ ...filters, subcategory: undefined })} />
              {subcategories.map((sub) => (
                <Chip key={sub} label={sub} active={filters.subcategory === sub} onPress={() => onChange({ ...filters, subcategory: sub })} />
              ))}
            </ChipRow>
          </Section>
        ) : null}

        <Section title="Municipio">
          <ChipRow>
            <Chip
              label="Todos"
              active={!filters.municipality}
              onPress={() => onChange({ ...filters, municipality: undefined, neighborhood: undefined })}
            />
            {(catalog?.municipalities ?? []).map((municipality) => (
              <Chip
                key={municipality.slug}
                label={municipality.name}
                active={filters.municipality === municipality.slug}
                onPress={() => onChange({ ...filters, municipality: municipality.slug, neighborhood: undefined })}
              />
            ))}
          </ChipRow>
        </Section>

        {neighborhoods.length > 0 ? (
          <Section title="Colonia">
            <ChipRow>
              <Chip label="Todas" active={!filters.neighborhood} onPress={() => onChange({ ...filters, neighborhood: undefined })} />
              {neighborhoods.map((neighborhood) => (
                <Chip
                  key={neighborhood}
                  label={neighborhood}
                  active={filters.neighborhood === neighborhood}
                  onPress={() => onChange({ ...filters, neighborhood })}
                />
              ))}
            </ChipRow>
          </Section>
        ) : null}

        <Section title="Ordenar por">
          <ChipRow>
            {SORT_OPTIONS.map((option) => {
              const isDistance = option.value === 'distance';
              const disabled = isDistance && !hasLocation;
              return (
                <Chip
                  key={option.value}
                  label={option.label}
                  active={(filters.sort ?? 'relevance') === option.value}
                  disabled={disabled}
                  onPress={() => onChange({ ...filters, sort: option.value })}
                />
              );
            })}
          </ChipRow>
          {!hasLocation ? (
            <Text variant="caption" color="mutedForeground" style={{ marginTop: theme.spacing[1] }}>
              Ordenar por distancia necesita tu ubicación. Actívala desde "Cerca de mí".
            </Text>
          ) : null}
        </Section>

        <Section title="Calificación mínima">
          <ChipRow>
            <Chip label="Cualquiera" active={!filters.minRating} onPress={() => onChange({ ...filters, minRating: undefined })} />
            {RATING_OPTIONS.map((rating) => (
              <Chip
                key={rating}
                label={`★${rating}+`}
                active={filters.minRating === rating}
                onPress={() => onChange({ ...filters, minRating: rating })}
              />
            ))}
          </ChipRow>
        </Section>

        <Section title="Distancia máxima">
          <ChipRow>
            <Chip label="Cualquiera" active={!filters.maxDistanceKm} onPress={() => onChange({ ...filters, maxDistanceKm: undefined })} />
            {DISTANCE_OPTIONS.map((km) => (
              <Chip
                key={km}
                label={`${km} km`}
                active={filters.maxDistanceKm === km}
                disabled={!hasLocation}
                onPress={() => onChange({ ...filters, maxDistanceKm: km })}
              />
            ))}
          </ChipRow>
        </Section>

        <View style={{ gap: theme.spacing[3] }}>
          <SwitchRow
            label="Solo negocios verificados"
            value={Boolean(filters.onlyVerified)}
            onChange={(value) => onChange({ ...filters, onlyVerified: value })}
          />
          <SwitchRow
            label="Abierto ahora"
            value={Boolean(filters.onlyOpenNow)}
            onChange={(value) => onChange({ ...filters, onlyOpenNow: value })}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing[3], marginTop: theme.spacing[2] }}>
          <Button label="Limpiar" variant="outline" size="lg" onPress={onClear} style={{ flex: 1 }} fullWidth />
          <Button label={`Ver ${resultCount} resultados`} variant="primary" size="lg" onPress={onApply} style={{ flex: 1 }} fullWidth />
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing[2] }}>
      <Text variant="bodyStrong">{title}</Text>
      {children}
    </View>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>{children}</View>;
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="body">{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
        thumbColor="#ffffff"
        accessibilityLabel={label}
      />
    </View>
  );
}
