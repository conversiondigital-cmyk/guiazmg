/**
 * "Descubre tu zona" (Inicio): vista previa de mapa (estático, sin gestos —
 * es un atajo visual, no el mapa real) + barra inferior con conteo de
 * negocios y botón circular de flecha hacia la pestaña Mapa.
 */
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ArrowRight, MapPinOff } from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';
import MapView from 'react-native-maps';

import { useTheme } from '@/theme/theme-provider';
import { ZMG_INITIAL_REGION } from '@/utils/map-region';
import { Text } from '@/ui/Text';

// Evita renderizar `react-native-maps` en Android sin clave (mismo criterio que `BusinessMapView`):
// sin ella pinta un rectángulo gris que parece una app rota.
const hasGoogleMapsAndroidKey = Boolean(Constants.expoConfig?.extra?.hasGoogleMapsAndroidKey);

export type MapPreviewCardProps = {
  /**
   * Total de negocios cargados en el directorio, si ya se conoce el número
   * real. `null` = no lo mostramos (nunca una cifra inventada). El copy NO
   * dice "cerca de ti": es un total del directorio, no un conteo filtrado
   * por proximidad (eso sí lo hace la pestaña Mapa con datos reales).
   */
  businessCount: number | null;
};

export function MapPreviewCard({ businessCount }: MapPreviewCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const canShowMap = Platform.OS !== 'android' || hasGoogleMapsAndroidKey;

  return (
    <Pressable
      onPress={() => router.push('/mapa')}
      accessibilityRole="button"
      accessibilityLabel="Explora el mapa de negocios"
      style={({ pressed }) => [
        {
          borderRadius: theme.radius['2xl'],
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          opacity: pressed ? 0.94 : 1,
        },
        theme.shadows.card,
      ]}>
      <View style={{ height: 140, backgroundColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' }}>
        {canShowMap ? (
          <MapView
            style={{ width: '100%', height: '100%' }}
            initialRegion={ZMG_INITIAL_REGION}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            pointerEvents="none"
          />
        ) : (
          <View style={{ alignItems: 'center', gap: 4 }}>
            <MapPinOff size={28} color={theme.colors.mutedForeground} strokeWidth={1.75} />
            <Text variant="caption" color="mutedForeground">
              El mapa todavía no está configurado
            </Text>
          </View>
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.primaryDark,
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
        }}>
        <Text variant="bodyStrong" style={{ color: '#ffffff', flex: 1 }} numberOfLines={1}>
          Explora el mapa{businessCount !== null ? ` · ${businessCount} negocios en Guía ZMG` : ''}
        </Text>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: theme.radius.full,
            backgroundColor: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ArrowRight size={18} color={theme.colors.primaryDark} />
        </View>
      </View>
    </Pressable>
  );
}
