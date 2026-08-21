/**
 * Tarjeta inferior que aparece al tocar un pin del mapa: icono de categoría,
 * nombre, badge de verificado, distancia y botón "Ver ficha". `GET
 * /map/businesses` manda el payload MÁS CHICO posible (para poder pintar
 * cientos de pines sin reventar la red móvil): no trae rating, foto de
 * portada ni teléfono/WhatsApp — eso vive solo en el detalle completo, que es
 * a donde lleva "Ver ficha".
 */
import { MapPin, ShieldCheck, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { BusinessPin } from '@/api/types';
import { useTheme } from '@/theme/theme-provider';
import { distanceKm as computeDistanceKm, formatDistanceKm } from '@/utils/format';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Text } from '@/ui/Text';

export type MapPinCardProps = {
  pin: BusinessPin;
  onClose: () => void;
  onViewDetail: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
};

export function MapPinCard({ pin, onClose, onViewDetail, userLocation }: MapPinCardProps) {
  const theme = useTheme();
  const distance =
    userLocation && pin.lat != null && pin.lng != null
      ? formatDistanceKm(computeDistanceKm(userLocation, { latitude: pin.lat, longitude: pin.lng }))
      : null;

  return (
    <View style={{ position: 'absolute', left: theme.spacing[4], right: theme.spacing[4], bottom: theme.spacing[4] }}>
      <Card>
        <View style={{ flexDirection: 'row', gap: theme.spacing[3], alignItems: 'center' }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text variant="h2">{pin.icon ?? '📍'}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {pin.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {pin.isVerified ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <ShieldCheck size={12} color={theme.colors.tintMintInk} />
                  <Text variant="caption" color="mutedForeground">
                    Verificado
                  </Text>
                </View>
              ) : null}
              {distance ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <MapPin size={12} color={theme.colors.mutedForeground} />
                  <Text variant="caption" color="mutedForeground">
                    {distance}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar">
            <X size={18} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>

        <Button label="Ver ficha completa" variant="primary" size="sm" fullWidth onPress={onViewDetail} style={{ marginTop: theme.spacing[3] }} />
      </Card>
    </View>
  );
}
