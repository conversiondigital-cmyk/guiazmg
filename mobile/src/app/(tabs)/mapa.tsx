/**
 * Mapa — pestaña de primer nivel (antes vivía en `/mapa` como pantalla de
 * pila; el dueño pidió que el mapa tenga su propia pestaña). Comparte
 * `BusinessMapView` con el toggle "Ver mapa" de Explorar.
 */
import { useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBusinesses } from '@/api/queries';
import { BusinessListItem } from '@/components/business-list-item';
import { BusinessListItemSkeleton } from '@/components/business-list-item-skeleton';
import { BusinessMapView } from '@/components/business-map-view';
import { useTheme } from '@/theme/theme-provider';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Text } from '@/ui/Text';

export default function MapaScreen() {
  const theme = useTheme();
  const router = useRouter();
  const businessesQuery = useBusinesses();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[3], paddingBottom: theme.spacing[2] }}>
        <Text variant="h1">Mapa</Text>
      </View>

      <BusinessMapView
        onViewBusiness={(slug) => router.push({ pathname: '/negocio/[slug]', params: { slug } })}
        fallbackList={
          <FlatList
            data={businessesQuery.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: theme.spacing[5], gap: theme.spacing[3] }}
            refreshing={businessesQuery.isRefetching}
            onRefresh={() => businessesQuery.refetch()}
            ListEmptyComponent={
              businessesQuery.isLoading ? (
                <View style={{ gap: theme.spacing[3] }}>
                  {[1, 2, 3].map((key) => (
                    <BusinessListItemSkeleton key={key} />
                  ))}
                </View>
              ) : businessesQuery.isError ? (
                <ErrorState onRetry={businessesQuery.refetch} />
              ) : (
                <EmptyState title="Sin negocios para mostrar" description="Todavía no hay negocios registrados en esta zona." />
              )
            }
            renderItem={({ item }) => (
              <BusinessListItem business={item} onPress={() => router.push({ pathname: '/negocio/[slug]', params: { slug: item.slug } })} />
            )}
          />
        }
      />
    </SafeAreaView>
  );
}
