/**
 * Tarjeta horizontal de "Cerca de ti" (Inicio): imagen a la izquierda con el
 * badge de calificación superpuesto en la esquina, chip de categoría,
 * distancia arriba a la derecha de la tarjeta, nombre y línea de estado
 * ("Abierto · cierra 8:00 PM"). Sin reseñas todavía → estado honesto, nunca
 * un rating de relleno.
 */
import { Star } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';

import type { BusinessCard } from '@/api/types';
import { useTheme } from '@/theme/theme-provider';
import { distanceKm as computeDistanceKm, formatDistanceKm } from '@/utils/format';
import { Text } from '@/ui/Text';

export type NearMeCardProps = {
  business: BusinessCard;
  onPress?: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
};

export function NearMeCard({ business, onPress, userLocation }: NearMeCardProps) {
  const theme = useTheme();
  const distance =
    userLocation && business.lat != null && business.lng != null
      ? formatDistanceKm(computeDistanceKm(userLocation, { latitude: business.lat, longitude: business.lng }))
      : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver ficha de ${business.name}`}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          gap: theme.spacing[3],
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius['2xl'],
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing[3],
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
        theme.shadows.card,
      ]}>
      <View style={{ width: 88, height: 88 }}>
        {business.coverImageUrl ? (
          <Image
            source={{ uri: business.coverImageUrl }}
            style={{ width: 88, height: 88, borderRadius: theme.radius.lg, backgroundColor: theme.colors.muted }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text variant="h1" style={{ opacity: 0.5 }}>
              {business.category?.icon ?? '🏪'}
            </Text>
          </View>
        )}
        {business.rating !== null ? (
          <View
            style={{
              position: 'absolute',
              left: 4,
              bottom: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              backgroundColor: theme.colors.overlayDark,
              borderRadius: theme.radius.full,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}>
            <Star size={10} color={theme.colors.star} fill={theme.colors.star} />
            <Text variant="caption" style={{ color: '#ffffff', fontSize: 10, lineHeight: 13, fontWeight: '700' }}>
              {business.rating.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing[2] }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {business.name}
          </Text>
          {distance ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {distance}
            </Text>
          ) : null}
        </View>

        {business.category ? (
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: theme.colors.muted,
              borderRadius: theme.radius.full,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {business.category.icon ? `${business.category.icon} ` : ''}
              {business.category.name}
            </Text>
          </View>
        ) : null}

        {business.isOpenNow !== null ? (
          <Text
            variant="caption"
            style={{ color: business.isOpenNow ? theme.colors.success : theme.colors.mutedForeground, fontWeight: '600' }}
            numberOfLines={1}>
            {business.isOpenNow ? 'Abierto ahora' : 'Cerrado ahora'}
          </Text>
        ) : (
          <Text variant="caption" color="mutedForeground">
            Sin horario cargado
          </Text>
        )}
      </View>
    </Pressable>
  );
}
