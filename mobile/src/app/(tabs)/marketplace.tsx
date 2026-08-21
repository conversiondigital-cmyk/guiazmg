/**
 * Marketplace: fila de categorías raíz + grid de 2 columnas con scroll
 * infinito. El corazón de favorito es optimista en esta sesión (todavía no
 * hay endpoint de favoritos del marketplace móvil — ver mobile/README.md).
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMarketplaceCategories, useMarketplaceListings } from '@/api/queries';
import { MarketplaceCardSkeleton } from '@/components/marketplace-card-skeleton';
import { MarketplaceCard } from '@/components/marketplace-card';
import { useTheme } from '@/theme/theme-provider';
import { useRequireAuth } from '@/utils/require-auth';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Text } from '@/ui/Text';

export default function MarketplaceScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set());

  function toggleFavorite(id: string) {
    requireAuth(() => {
      setLocalFavorites((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    });
  }

  const categoriesQuery = useMarketplaceCategories();
  const listingsQuery = useMarketplaceListings({ category: activeCategory });
  const listings = useMemo(() => listingsQuery.data?.pages.flatMap((page) => page.data) ?? [], [listingsQuery.data]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[3] }}>
        <Text variant="h1">Marketplace</Text>
        <Text variant="body" color="mutedForeground" style={{ marginTop: theme.spacing[1] }}>
          Compra y vende entre vecinos de la ZMG
        </Text>
      </View>

      <View style={{ marginTop: theme.spacing[3] }}>
        {categoriesQuery.isLoading ? (
          <Text variant="caption" color="mutedForeground" style={{ paddingHorizontal: theme.spacing[5] }}>
            Cargando categorías...
          </Text>
        ) : categoriesQuery.isError ? (
          <Text variant="caption" color="mutedForeground" style={{ paddingHorizontal: theme.spacing[5] }}>
            No se pudieron cargar las categorías.
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing[3], paddingHorizontal: theme.spacing[5] }}>
            <CategoryPill label="Todo" emoji="🛍️" active={!activeCategory} onPress={() => setActiveCategory(undefined)} />
            {(categoriesQuery.data ?? []).map((category) => (
              <CategoryPill
                key={category.id}
                label={category.name}
                emoji={category.icon ?? '🏷️'}
                active={activeCategory === category.slug}
                onPress={() => setActiveCategory(category.slug)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={{ flex: 1, marginTop: theme.spacing[3] }}>
        {listingsQuery.isLoading ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[3], paddingHorizontal: theme.spacing[5] }}>
            {[1, 2, 3, 4].map((key) => (
              <View key={key} style={{ width: '47%' }}>
                <MarketplaceCardSkeleton />
              </View>
            ))}
          </View>
        ) : listingsQuery.isError ? (
          <ErrorState onRetry={() => listingsQuery.refetch()} retrying={listingsQuery.isRefetching} />
        ) : listings.length === 0 ? (
          <View style={{ paddingHorizontal: theme.spacing[5] }}>
            <EmptyState
              title="Sin publicaciones en esta categoría"
              description="Prueba con otra categoría o revisa más tarde."
              actionLabel={activeCategory ? 'Ver todo' : undefined}
              onAction={activeCategory ? () => setActiveCategory(undefined) : undefined}
            />
          </View>
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: theme.spacing[3], paddingHorizontal: theme.spacing[5] }}
            contentContainerStyle={{ gap: theme.spacing[3], paddingBottom: theme.spacing[8] }}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (listingsQuery.hasNextPage && !listingsQuery.isFetchingNextPage) void listingsQuery.fetchNextPage();
            }}
            refreshing={listingsQuery.isRefetching}
            onRefresh={() => listingsQuery.refetch()}
            renderItem={({ item }) => (
              <MarketplaceCard
                listing={item}
                isFavorite={localFavorites.has(item.id)}
                onPress={() => router.push({ pathname: '/marketplace/[id]', params: { id: item.id } })}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function CategoryPill({ label, emoji, active, onPress }: { label: string; emoji: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [{ alignItems: 'center', gap: 6, width: 68, opacity: pressed ? 0.8 : 1 }]}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: theme.radius.full,
          backgroundColor: active ? theme.colors.primary : theme.colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text variant="h2">{emoji}</Text>
      </View>
      <Text variant="caption" color={active ? 'primary' : 'mutedForeground'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
