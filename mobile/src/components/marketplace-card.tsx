/**
 * Tarjeta del grid de 2 columnas del marketplace. Imagen 1:1, precio grande
 * (MXN), título 2 líneas, municipio + tiempo relativo, badge de condición,
 * corazón de favorito. El endpoint de listado (`GET /marketplace`) solo
 * devuelve publicaciones `ACTIVE`, así que no hay estado "vendido/expirado"
 * que degradar aquí (si un anuncio se vende, deja de aparecer en la lista).
 */
import { Heart } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';

import type { MarketplaceListing } from '@/api/types';
import { useTheme } from '@/theme/theme-provider';
import { formatMXN, formatRelativeTime } from '@/utils/format';
import { Text } from '@/ui/Text';

const CONDITION_LABEL: Record<string, string> = {
  new: 'Nuevo',
  like_new: 'Como nuevo',
  good: 'Buen estado',
  fair: 'Usado',
};

export type MarketplaceCardProps = {
  listing: MarketplaceListing;
  isFavorite?: boolean;
  onPress?: () => void;
  onToggleFavorite?: () => void;
};

export function MarketplaceCard({ listing, isFavorite = false, onPress, onToggleFavorite }: MarketplaceCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver publicación ${listing.title}`}
      style={({ pressed }) => [
        {
          flex: 1,
          borderRadius: theme.radius['2xl'],
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          overflow: 'hidden',
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={{ aspectRatio: 1, backgroundColor: theme.colors.muted }}>
        {listing.coverImageUrl ? (
          <Image source={{ uri: listing.coverImageUrl }} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="display" style={{ opacity: 0.4 }}>
              {listing.category?.icon ?? '📦'}
            </Text>
          </View>
        )}

        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 32,
            height: 32,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.overlayLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Heart
            size={16}
            color={isFavorite ? theme.colors.destructive : theme.colors.mutedForeground}
            fill={isFavorite ? theme.colors.destructive : 'transparent'}
          />
        </Pressable>
      </View>

      <View style={{ padding: theme.spacing[2], gap: 4 }}>
        <Text variant="h3" numberOfLines={1}>
          {listing.price !== null ? formatMXN(listing.price) : 'A convenir'}
        </Text>
        <Text variant="caption" color="foreground" numberOfLines={2}>
          {listing.title}
        </Text>
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {listing.municipality?.name ?? 'ZMG'} · {formatRelativeTime(listing.createdAt)}
        </Text>
        {listing.condition ? (
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.muted,
            }}>
            <Text variant="caption" color="mutedForeground" style={{ fontSize: 10, lineHeight: 13 }}>
              {CONDITION_LABEL[listing.condition] ?? listing.condition}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
