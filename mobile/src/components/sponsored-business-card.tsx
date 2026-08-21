/**
 * Tarjeta vertical del carrusel "Negocios destacados" (Inicio): imagen
 * sangrada arriba, badge "PATROCINADO" en terracota profundo, categoría +
 * rating, nombre, descripción de 2 líneas y botón "Ver negocio" de ancho
 * completo.
 *
 * LIMITACIÓN CONOCIDA: la tarjeta de LISTA del backend real
 * (`toBusinessCard()`) no trae `phone`/`whatsapp` (solo la ficha completa los
 * trae) — por eso el CTA aquí navega a la ficha en vez de contactar
 * directamente, a diferencia del mock de fase A0/A1.
 */
import { Star } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';

import type { BusinessCard } from '@/api/types';
import { useTheme } from '@/theme/theme-provider';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';

export type SponsoredBusinessCardProps = {
  business: BusinessCard;
  onPress?: () => void;
};

const CARD_WIDTH = 240;

export function SponsoredBusinessCard({ business, onPress }: SponsoredBusinessCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver ficha de ${business.name}`}
      style={({ pressed }) => [
        {
          width: CARD_WIDTH,
          borderRadius: theme.radius['2xl'],
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          overflow: 'hidden',
          opacity: pressed ? 0.94 : 1,
        },
        theme.shadows.card,
      ]}>
      <View style={{ height: 120, backgroundColor: theme.colors.muted }}>
        {business.coverImageUrl ? (
          <Image source={{ uri: business.coverImageUrl }} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="display" style={{ opacity: 0.4 }}>
              {business.category?.icon ?? '🏪'}
            </Text>
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: theme.colors.secondaryDeep,
            borderRadius: theme.radius.sm,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}>
          <Text variant="overline" style={{ color: theme.colors.secondaryForeground }}>
            Patrocinado
          </Text>
        </View>
      </View>

      <View style={{ padding: theme.spacing[3], gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="caption" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
            {business.category?.icon ? `${business.category.icon} ` : ''}
            {business.category?.name ?? 'Negocio local'}
          </Text>
          {business.rating !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Star size={12} color={theme.colors.star} fill={theme.colors.star} />
              <Text variant="caption" color="foreground">
                {business.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>

        <Text variant="bodyStrong" numberOfLines={1}>
          {business.name}
        </Text>

        <Text variant="caption" color="mutedForeground" numberOfLines={2} style={{ minHeight: 32 }}>
          {business.shortDescription ?? 'Este negocio todavía no agregó una descripción.'}
        </Text>

        <Button label="Ver negocio" variant="primary" size="sm" fullWidth onPress={onPress} style={{ marginTop: theme.spacing[1] }} />
      </View>
    </Pressable>
  );
}
