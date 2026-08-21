/**
 * Tarjeta horizontal de resultado (Explorar → lista). Imagen 96×96, nombre a
 * 2 líneas, categoría con icono, rating, distancia y chips de estado.
 *
 * LIMITACIÓN CONOCIDA: la tarjeta de LISTA del backend real
 * (`toBusinessCard()`) no trae `phone`/`whatsapp` — a propósito, para no
 * pesar cada resultado de una búsqueda de 20 con datos de contacto que solo
 * hacen falta en la ficha. Por eso ya no hay botones directos de Llamar/
 * WhatsApp aquí (sí los tenía el mock de fase A0/A1): tocar la tarjeta lleva
 * a la ficha completa, que sí trae esos datos.
 */
import { Star } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';

import type { BusinessCard } from '@/api/types';
import { useTheme } from '@/theme/theme-provider';
import { distanceKm as computeDistanceKm, formatDistanceKm } from '@/utils/format';
import { Text } from '@/ui/Text';

export type BusinessListItemProps = {
  business: BusinessCard;
  onPress?: () => void;
  /** Ubicación actual del usuario, si la dio, para calcular distancia. `null` = no mostrar distancia. */
  userLocation?: { latitude: number; longitude: number } | null;
};

export function BusinessListItem({ business, onPress, userLocation }: BusinessListItemProps) {
  const theme = useTheme();
  const location = [business.neighborhood?.name, business.municipality?.name].filter(Boolean).join(', ');

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
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing[3],
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
        theme.shadows.card,
      ]}>
      {business.coverImageUrl ? (
        <Image
          source={{ uri: business.coverImageUrl }}
          style={{ width: 96, height: 96, borderRadius: theme.radius.md, backgroundColor: theme.colors.muted }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text variant="h1" style={{ opacity: 0.5 }}>
            {business.category?.icon ?? '🏪'}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {business.name}
        </Text>

        {business.category ? (
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {business.category.icon ? `${business.category.icon} ` : ''}
            {business.category.name}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {business.rating !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Star size={12} color={theme.colors.star} fill={theme.colors.star} />
              <Text variant="caption" color="foreground">
                {business.rating.toFixed(1)}
              </Text>
            </View>
          ) : (
            <Text variant="caption" color="mutedForeground">
              Sin reseñas
            </Text>
          )}
          {distance ? (
            <Text variant="caption" color="mutedForeground">
              · {distance}
            </Text>
          ) : null}
        </View>

        {location ? (
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {location}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
          {business.isVerified ? <MiniBadge label="Verificado" tone="mint" /> : null}
          {business.isFeatured ? <MiniBadge label="Destacado" tone="premium" /> : null}
          {business.isOpenNow !== null ? (
            <MiniBadge label={business.isOpenNow ? 'Abierto' : 'Cerrado'} tone={business.isOpenNow ? 'mint' : 'muted'} />
          ) : null}
        </View>

      </View>
    </Pressable>
  );
}

function MiniBadge({ label, tone }: { label: string; tone: 'mint' | 'premium' | 'muted' }) {
  const theme = useTheme();
  // "premium" usa terracota claro + texto carbón (el único par con contraste AA — ver theme/tokens.ts), nunca ámbar.
  const backgrounds = { mint: theme.colors.tintMint, premium: theme.colors.secondary, muted: theme.colors.muted };
  const textColors = { mint: theme.colors.tintMintInk, premium: theme.colors.secondaryForeground, muted: theme.colors.mutedForeground };

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.radius.full,
        backgroundColor: backgrounds[tone],
      }}>
      <Text variant="caption" style={{ color: textColors[tone], fontSize: 11, lineHeight: 14, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}
