/**
 * Explorar: búsqueda real + fila de chips + toggle Lista/Mapa + resultados
 * con scroll infinito + bottom sheet de filtros. Es la pantalla con más
 * estado de la fase A1: ver `ExploreFilters` en `filter-bottom-sheet.tsx`.
 */
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { List, Map as MapIcon, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCatalog, useSearchBusinesses, useSearchSuggestions } from '@/api/queries';
import type { BusinessCard, BusinessSearchFilters } from '@/api/types';
import { BusinessListItem } from '@/components/business-list-item';
import { BusinessListItemSkeleton } from '@/components/business-list-item-skeleton';
import { BusinessMapView } from '@/components/business-map-view';
import { countActiveFilters, EMPTY_FILTERS, FilterBottomSheet, type ExploreFilters } from '@/components/filter-bottom-sheet';
import { LocationPermissionModal } from '@/location/location-permission-modal';
import { useNearMe } from '@/location/use-near-me';
import { useTheme } from '@/theme/theme-provider';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Text } from '@/ui/Text';

type ViewMode = 'list' | 'map';

export default function ExplorarScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ autoFocus?: string; category?: string; municipality?: string }>();

  const inputRef = useRef<TextInput>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const nearMe = useNearMe();

  const [searchText, setSearchText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<ExploreFilters>({
    category: params.category,
    municipality: params.municipality,
  });
  const [draftFilters, setDraftFilters] = useState<ExploreFilters>(filters);
  const [useNearby, setUseNearby] = useState(false);

  const catalogQuery = useCatalog();
  const suggestionsQuery = useSearchSuggestions(searchText);

  useEffect(() => {
    if (params.autoFocus === '1') {
      const timer = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
  }, [params.autoFocus]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchText.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const activeFilters: BusinessSearchFilters = useMemo(
    () => ({
      ...filters,
      q: debouncedQuery || undefined,
      lat: useNearby ? nearMe.coords?.latitude : undefined,
      lng: useNearby ? nearMe.coords?.longitude : undefined,
    }),
    [filters, debouncedQuery, useNearby, nearMe.coords],
  );

  const searchQuery = useSearchBusinesses(activeFilters);
  const businesses = useMemo(() => searchQuery.data?.pages.flatMap((page) => page.data) ?? [], [searchQuery.data]);
  const totalCount = searchQuery.data?.pages[0]?.meta.total ?? businesses.length;

  function openFilters() {
    setDraftFilters(filters);
    sheetRef.current?.present();
  }

  function applyFilters() {
    setFilters(draftFilters);
    sheetRef.current?.dismiss();
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS);
  }

  function clearAllActive() {
    setFilters(EMPTY_FILTERS);
    setUseNearby(false);
    setSearchText('');
  }

  function removeChip(key: keyof ExploreFilters) {
    setFilters((current) => ({ ...current, [key]: undefined }));
  }

  function toggleNearby() {
    if (nearMe.coords) {
      setUseNearby((current) => !current);
      return;
    }
    nearMe.requestNearMe();
  }

  useEffect(() => {
    // En cuanto la ubicación quede lista tras el modal, actívala automáticamente.
    if (nearMe.coords) setUseNearby(true);
  }, [nearMe.coords]);

  const activeCount = countActiveFilters(filters) + (useNearby ? 1 : 0) + (searchText ? 1 : 0);

  const goToBusiness = useCallback(
    (slug: string) => router.push({ pathname: '/negocio/[slug]', params: { slug } }),
    [router],
  );

  const categoryName = filters.category ? catalogQuery.data?.categories.find((c) => c.slug === filters.category)?.name : undefined;
  const municipalityName = filters.municipality
    ? catalogQuery.data?.municipalities.find((m) => m.slug === filters.municipality)?.name
    : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[3], gap: theme.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="h1">Explorar</Text>
          <View style={{ flexDirection: 'row', backgroundColor: theme.colors.muted, borderRadius: theme.radius.full, padding: 3 }}>
            <ToggleButton icon={List} active={viewMode === 'list'} onPress={() => setViewMode('list')} label="Ver lista" />
            <ToggleButton icon={MapIcon} active={viewMode === 'map'} onPress={() => setViewMode('map')} label="Ver mapa" />
          </View>
        </View>

        {/* Input de búsqueda */}
        <View style={{ position: 'relative' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing[2],
              height: 48,
              borderRadius: theme.radius.full,
              borderWidth: 1,
              borderColor: theme.colors.border,
              paddingHorizontal: theme.spacing[5],
            }}>
            <Search size={18} color={theme.colors.mutedForeground} />
            <TextInput
              ref={inputRef}
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Busca negocios, giros o colonias..."
              placeholderTextColor={theme.colors.mutedForeground}
              style={{ flex: 1, fontSize: 15, color: theme.colors.foreground, paddingVertical: 0 }}
              accessibilityLabel="Buscar negocios"
              returnKeyType="search"
              onSubmitEditing={() => setShowSuggestions(false)}
            />
            {searchText.length > 0 ? (
              <Pressable
                onPress={() => setSearchText('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda">
                <X size={18} color={theme.colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>

          {showSuggestions && searchText.trim().length >= 2 ? (
            <View
              style={{
                position: 'absolute',
                top: 52,
                left: 0,
                right: 0,
                backgroundColor: theme.colors.background,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                zIndex: 20,
                ...theme.shadows.card,
              }}>
              {suggestionsQuery.isLoading ? (
                <Text variant="caption" color="mutedForeground" style={{ padding: theme.spacing[3] }}>
                  Buscando...
                </Text>
              ) : suggestionsQuery.data && suggestionsQuery.data.length > 0 ? (
                <>
                  {suggestionsQuery.data.map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      onPress={() => {
                        setSearchText(suggestion);
                        setDebouncedQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                      style={{ paddingHorizontal: theme.spacing[5], paddingVertical: theme.spacing[3] }}>
                      <Text variant="body" numberOfLines={1}>
                        {suggestion}
                      </Text>
                    </Pressable>
                  ))}
                </>
              ) : (
                <Text variant="caption" color="mutedForeground" style={{ padding: theme.spacing[3] }}>
                  Sin sugerencias para "{searchText}".
                </Text>
              )}
            </View>
          ) : null}
        </View>

        {/* Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing[2] }}>
          <Chip
            label={activeCount > 0 ? `Filtros · ${activeCount}` : 'Filtros'}
            onPress={openFilters}
            active={activeCount > 0}
          />
          <Chip label="Cerca de mí" active={useNearby} onPress={toggleNearby} />
          <Chip
            label="Abierto ahora"
            active={Boolean(filters.onlyOpenNow)}
            onPress={() => setFilters((current) => ({ ...current, onlyOpenNow: !current.onlyOpenNow }))}
          />
          <Chip
            label="Verificado"
            active={Boolean(filters.onlyVerified)}
            onPress={() => setFilters((current) => ({ ...current, onlyVerified: !current.onlyVerified }))}
          />
          <Chip
            label="★4+"
            active={filters.minRating === 4}
            onPress={() => setFilters((current) => ({ ...current, minRating: current.minRating === 4 ? undefined : 4 }))}
          />
          <Chip label={categoryName ? `${categoryName} ▾` : 'Categoría ▾'} active={Boolean(categoryName)} onPress={openFilters} />
          <Chip label={municipalityName ? `${municipalityName} ▾` : 'Municipio ▾'} active={Boolean(municipalityName)} onPress={openFilters} />
        </ScrollView>
      </View>

      <View style={{ flex: 1, marginTop: theme.spacing[3] }}>
        {viewMode === 'map' ? (
          <BusinessMapView
            onViewBusiness={goToBusiness}
            fallbackList={<ResultsList {...{ searchQuery, businesses, goToBusiness, nearMe, clearAllActive, removeChip, filters, searchText, useNearby, setUseNearby }} />}
          />
        ) : (
          <ResultsList {...{ searchQuery, businesses, goToBusiness, nearMe, clearAllActive, removeChip, filters, searchText, useNearby, setUseNearby }} />
        )}
      </View>

      <FilterBottomSheet
        ref={sheetRef}
        catalog={catalogQuery.data}
        filters={draftFilters}
        onChange={setDraftFilters}
        onClear={clearFilters}
        onApply={applyFilters}
        resultCount={totalCount}
        hasLocation={Boolean(nearMe.coords)}
      />

      <LocationPermissionModal visible={nearMe.modalVisible} onConfirm={nearMe.confirmModal} onDismiss={nearMe.dismissModal} />
    </SafeAreaView>
  );
}

function ToggleButton({
  icon: Icon,
  active,
  onPress,
  label,
}: {
  icon: typeof List;
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={{
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? theme.colors.primary : 'transparent',
      }}>
      <Icon size={18} color={active ? theme.colors.primaryForeground : theme.colors.mutedForeground} />
    </Pressable>
  );
}

function ResultsList({
  searchQuery,
  businesses,
  goToBusiness,
  nearMe,
  clearAllActive,
  removeChip,
  filters,
  searchText,
  useNearby,
  setUseNearby,
}: {
  searchQuery: ReturnType<typeof useSearchBusinesses>;
  businesses: BusinessCard[];
  goToBusiness: (slug: string) => void;
  nearMe: ReturnType<typeof useNearMe>;
  clearAllActive: () => void;
  removeChip: (key: keyof ExploreFilters) => void;
  filters: ExploreFilters;
  searchText: string;
  useNearby: boolean;
  setUseNearby: (v: boolean) => void;
}) {
  const theme = useTheme();
  const hasAnyFilter = Boolean(filters.category || filters.municipality || filters.onlyVerified || filters.onlyOpenNow || filters.minRating || useNearby || searchText);

  if (searchQuery.isLoading) {
    return (
      <View style={{ paddingHorizontal: theme.spacing[5], gap: theme.spacing[3] }}>
        {[1, 2, 3, 4].map((key) => (
          <BusinessListItemSkeleton key={key} />
        ))}
      </View>
    );
  }

  if (searchQuery.isError) {
    return <ErrorState onRetry={() => searchQuery.refetch()} retrying={searchQuery.isRefetching} />;
  }

  if (businesses.length === 0) {
    return (
      <View style={{ paddingHorizontal: theme.spacing[5] }}>
        <EmptyState
          title="No encontramos negocios con estos filtros"
          description="Prueba quitando alguno de los filtros activos."
          actionLabel={hasAnyFilter ? 'Limpiar todo' : undefined}
          onAction={hasAnyFilter ? clearAllActive : undefined}
        />
        {hasAnyFilter ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2], marginTop: theme.spacing[3] }}>
            {filters.category ? <Chip label="Categoría ×" onPress={() => removeChip('category')} /> : null}
            {filters.municipality ? <Chip label="Municipio ×" onPress={() => removeChip('municipality')} /> : null}
            {filters.onlyVerified ? <Chip label="Verificado ×" onPress={() => removeChip('onlyVerified')} /> : null}
            {filters.onlyOpenNow ? <Chip label="Abierto ahora ×" onPress={() => removeChip('onlyOpenNow')} /> : null}
            {filters.minRating ? <Chip label={`★${filters.minRating}+ ×`} onPress={() => removeChip('minRating')} /> : null}
            {useNearby ? <Chip label="Cerca de mí ×" onPress={() => setUseNearby(false)} /> : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <FlatList
      data={businesses}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: theme.spacing[5], paddingBottom: theme.spacing[8], gap: theme.spacing[3] }}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) void searchQuery.fetchNextPage();
      }}
      refreshing={searchQuery.isRefetching}
      onRefresh={() => searchQuery.refetch()}
      renderItem={({ item }) => (
        <BusinessListItem business={item} onPress={() => goToBusiness(item.slug)} userLocation={nearMe.coords} />
      )}
      ListFooterComponent={searchQuery.isFetchingNextPage ? <BusinessListItemSkeleton /> : null}
    />
  );
}
