/**
 * Inicio: destacados del directorio. Ciclo completo de estados con datos
 * reales de React Query (mock en A0, API real cuando exista `/api/mobile/v1`).
 */
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBusinesses } from '@/api/queries';
import { BusinessCardItem } from '@/components/business-card-item';
import { BusinessCardSkeleton } from '@/components/business-card-skeleton';
import { useTheme } from '@/theme/theme-provider';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Text } from '@/ui/Text';

export default function InicioScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useBusinesses();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4], paddingBottom: theme.spacing[3] }}>
        <Text variant="overline" color="mutedForeground">
          Zona Metropolitana de Guadalajara
        </Text>
        <Text variant="display" style={{ marginTop: theme.spacing[1] }}>
          Guía ZMG
        </Text>
        <Text variant="body" color="mutedForeground" style={{ marginTop: theme.spacing[1] }}>
          Negocios destacados cerca de ti
        </Text>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: theme.spacing[4], gap: theme.spacing[3] }}>
          {[1, 2, 3].map((key) => (
            <BusinessCardSkeleton key={key} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState onRetry={refetch} retrying={isRefetching} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Todavía no hay negocios destacados"
          description="En cuanto un negocio de tu zona se registre y verifique, va a aparecer aquí."
          actionLabel="Explorar el directorio"
          onAction={() => router.push('/(tabs)/explorar')}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing[4],
            paddingBottom: theme.spacing[8],
            gap: theme.spacing[3],
          }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            // La ficha de detalle de negocio se construye en la fase A1; por
            // ahora la tarjeta es informativa (sin navegación a un destino
            // que todavía no existe).
            <BusinessCardItem business={item} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
