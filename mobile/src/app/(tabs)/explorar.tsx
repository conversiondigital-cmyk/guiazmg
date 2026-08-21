/**
 * Explorar: filtro por categoría + lista de negocios. Dos fuentes de datos
 * (categorías y negocios), cada una con su propio ciclo de estados.
 */
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBusinesses, useCategories } from '@/api/queries';
import { BusinessCardItem } from '@/components/business-card-item';
import { BusinessCardSkeleton } from '@/components/business-card-skeleton';
import { useTheme } from '@/theme/theme-provider';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Skeleton } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';

export default function ExplorarScreen() {
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);

  const categoriesQuery = useCategories();
  const businessesQuery = useBusinesses({ category: activeCategory });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4] }}>
        <Text variant="h1">Explorar</Text>
        <Text variant="body" color="mutedForeground" style={{ marginTop: theme.spacing[1] }}>
          Filtra por giro para encontrar justo lo que buscas
        </Text>
      </View>

      <View style={{ marginTop: theme.spacing[3] }}>
        {categoriesQuery.isLoading ? (
          <View style={{ flexDirection: 'row', gap: theme.spacing[2], paddingHorizontal: theme.spacing[4] }}>
            {[1, 2, 3].map((key) => (
              <Skeleton key={key} width={90} height={36} borderRadius={theme.radius.full} />
            ))}
          </View>
        ) : categoriesQuery.isError ? (
          <Text
            variant="caption"
            color="mutedForeground"
            style={{ paddingHorizontal: theme.spacing[4] }}>
            No se pudieron cargar las categorías. Desliza hacia abajo para reintentar.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing[2], paddingHorizontal: theme.spacing[4] }}>
            <Chip label="Todos" active={!activeCategory} onPress={() => setActiveCategory(undefined)} />
            {(categoriesQuery.data ?? []).map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                active={activeCategory === category.slug}
                onPress={() => setActiveCategory(category.slug)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={{ flex: 1, marginTop: theme.spacing[3] }}>
        {businessesQuery.isLoading ? (
          <View style={{ paddingHorizontal: theme.spacing[4], gap: theme.spacing[3] }}>
            {[1, 2, 3, 4].map((key) => (
              <BusinessCardSkeleton key={key} />
            ))}
          </View>
        ) : businessesQuery.isError ? (
          <ErrorState onRetry={businessesQuery.refetch} retrying={businessesQuery.isRefetching} />
        ) : !businessesQuery.data || businessesQuery.data.length === 0 ? (
          <EmptyState
            title="Sin resultados para este filtro"
            description="Prueba con otra categoría o quita el filtro para ver todos los negocios."
            actionLabel="Quitar filtro"
            onAction={() => setActiveCategory(undefined)}
          />
        ) : (
          <FlatList
            data={businessesQuery.data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing[4],
              paddingBottom: theme.spacing[8],
              gap: theme.spacing[3],
            }}
            refreshControl={
              <RefreshControl
                refreshing={businessesQuery.isRefetching}
                onRefresh={businessesQuery.refetch}
                tintColor={theme.colors.primary}
              />
            }
            renderItem={({ item }) => <BusinessCardItem business={item} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
