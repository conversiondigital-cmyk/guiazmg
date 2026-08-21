/**
 * Modal propio de Guía ZMG que explica el beneficio ANTES del diálogo nativo
 * de ubicación. Patrón obligatorio (ver `location.ts`): nunca se dispara
 * `requestForegroundPermissionsAsync` sin que el usuario haya visto esto y
 * tocado "Permitir ubicación" aquí primero.
 */
import { MapPin, X } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';

export type LocationPermissionModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

export function LocationPermissionModal({ visible, onConfirm, onDismiss }: LocationPermissionModalProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(10,10,10,0.5)',
          justifyContent: 'flex-end',
        }}>
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={onDismiss}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: theme.radius['2xl'],
            borderTopRightRadius: theme.radius['2xl'],
            padding: theme.spacing[6],
            gap: theme.spacing[4],
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pressable
              onPress={onDismiss}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} color={theme.colors.mutedForeground} />
            </Pressable>
          </View>

          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.tintMint,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
            }}>
            <MapPin size={28} color={theme.colors.tintMintInk} strokeWidth={1.75} />
          </View>

          <Text variant="h2" style={{ textAlign: 'center' }}>
            Usa tu ubicación
          </Text>
          <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
            Guía ZMG usa tu ubicación solo mientras usas la app, para mostrarte negocios cerca de ti y calcular
            distancias. Puedes cambiarlo cuando quieras desde los ajustes de tu teléfono.
          </Text>

          <Button label="Permitir ubicación" onPress={onConfirm} variant="primary" size="lg" fullWidth />
          <Button label="Ahora no" onPress={onDismiss} variant="ghost" size="md" fullWidth />
        </View>
      </View>
    </Modal>
  );
}
