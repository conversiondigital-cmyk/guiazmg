/**
 * Banner de negocio destacado de la zona (Inicio). Visualmente sigue el
 * patrón de referencia ("Promoción del Día": tarjeta terracota, imagen
 * sangrada a la derecha, título grande, botón claro) pero con datos 100%
 * reales: no hay todavía un backend de promociones, así que en vez de
 * inventar un texto de "oferta" se usa el negocio destacado (`isBoosted`)
 * más relevante y su descripción real. Cuando exista `/home` con
 * promociones de verdad, este componente puede recibir esos datos sin
 * cambiar de forma.
 */
import { Sparkles } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';

import type { BusinessCard } from '@/api/types';
import { useTheme } from '@/theme/theme-provider';
import { Text } from '@/ui/Text';

export type PromoBannerProps = {
  business: BusinessCard;
  onPress?: () => void;
};

export function PromoBanner({ business, onPress }: PromoBannerProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver destacado: ${business.name}`}
      style={({ pressed }) => [
        {
          borderRadius: theme.radius['2xl'],
          backgroundColor: theme.colors.secondary,
          overflow: 'hidden',
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={{ flexDirection: 'row', minHeight: 152 }}>
        <View style={{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[2], justifyContent: 'center' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              alignSelf: 'flex-start',
              backgroundColor: theme.colors.secondaryDeep,
              borderRadius: theme.radius.full,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}>
            <Sparkles size={11} color={theme.colors.secondaryForeground} />
            <Text variant="overline" style={{ color: theme.colors.secondaryForeground }}>
              Destacado de la zona
            </Text>
          </View>
          <Text variant="h2" color="foreground" numberOfLines={1}>
            {business.name}
          </Text>
          {business.shortDescription ? (
            <Text variant="body" color="foreground" numberOfLines={2} style={{ opacity: 0.85 }}>
              {business.shortDescription}
            </Text>
          ) : null}
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
              marginTop: theme.spacing[1],
            }}>
            <Text variant="bodyStrong" style={{ color: theme.colors.secondaryDeep }}>
              Ver negocio
            </Text>
          </View>
        </View>

        {business.coverImageUrl ? (
          <Image
            source={{ uri: business.coverImageUrl }}
            style={{ width: 120, height: '100%' }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={{ width: 96, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="display" style={{ opacity: 0.35 }}>
              {business.category?.icon ?? '🏪'}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
