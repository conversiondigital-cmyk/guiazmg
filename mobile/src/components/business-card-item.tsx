/**
 * Tarjeta de negocio para listas (Inicio, Explorar). Presentacional pura:
 * recibe un `BusinessCard` ya resuelto por React Query.
 */
import { MapPin, ShieldCheck, Star } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Card } from '@/ui/Card';
import { Text } from '@/ui/Text';
import { useTheme } from '@/theme/theme-provider';
import type { BusinessCard } from '@/api/types';

export type BusinessCardItemProps = {
  business: BusinessCard;
  onPress?: () => void;
};

export function BusinessCardItem({ business, onPress }: BusinessCardItemProps) {
  const theme = useTheme();
  const location = [business.neighborhoodName, business.municipality?.name].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver ficha de ${business.name}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing[2] }}>
          <View style={{ flex: 1, gap: theme.spacing[1] }}>
            <Text variant="h3" numberOfLines={1}>
              {business.name}
            </Text>
            {business.category ? (
              <Text variant="caption" color="mutedForeground">
                {business.category.name}
              </Text>
            ) : null}
          </View>
          {business.isVerified ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              accessibilityLabel="Negocio verificado">
              <ShieldCheck size={16} color={theme.colors.tintMintInk} />
            </View>
          ) : null}
        </View>

        {business.shortDescription ? (
          <Text variant="body" color="mutedForeground" numberOfLines={2} style={{ marginTop: theme.spacing[2] }}>
            {business.shortDescription}
          </Text>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: theme.spacing[3],
          }}>
          {location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
              <MapPin size={14} color={theme.colors.mutedForeground} />
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : (
            <View />
          )}

          {business.rating !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star size={14} color={theme.colors.warning} fill={theme.colors.warning} />
              <Text variant="caption" color="foreground">
                {business.rating.toFixed(1)} ({business.reviewCount})
              </Text>
            </View>
          ) : (
            <Text variant="caption" color="mutedForeground">
              Sin reseñas todavía
            </Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
