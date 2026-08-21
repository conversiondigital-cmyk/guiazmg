/**
 * Puerta de arranque: consulta `GET /config` y bloquea la app entera si
 * `forceUpdate`/versión por debajo de `minAppVersion` (pantalla con enlace a
 * la tienda) o si `maintenanceMode` está activo. Si la consulta falla (sin
 * red al abrir por primera vez), NUNCA bloquea — solo actúa sobre datos que
 * de verdad llegaron.
 */
import Constants from 'expo-constants';
import { Linking, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, Wrench } from 'lucide-react-native';
import { Platform } from 'react-native';
import type { PropsWithChildren } from 'react';

import { isVersionLower, useAppConfig } from '@/api/app-config';
import { useTheme } from '@/theme/theme-provider';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';

const STORE_URLS = {
  android: 'https://play.google.com/store/apps/details?id=com.guiazmg.app',
  ios: 'https://apps.apple.com/app/id0000000000',
};

export function AppGate({ children }: PropsWithChildren) {
  const theme = useTheme();
  const configQuery = useAppConfig();
  const currentVersion = Constants.expoConfig?.version ?? '0.0.0';

  const config = configQuery.data;

  if (config?.maintenanceMode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing[3], padding: theme.spacing[6] }}>
          <Wrench size={40} color={theme.colors.mutedForeground} strokeWidth={1.75} />
          <Text variant="h2" style={{ textAlign: 'center' }}>
            Estamos en mantenimiento
          </Text>
          <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
            Guía ZMG vuelve en unos minutos. Gracias por tu paciencia.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (config && (config.forceUpdate || isVersionLower(currentVersion, config.minAppVersion))) {
    const storeUrl = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing[3], padding: theme.spacing[6] }}>
          <AlertTriangle size={40} color={theme.colors.warning} strokeWidth={1.75} />
          <Text variant="h2" style={{ textAlign: 'center' }}>
            Actualiza Guía ZMG
          </Text>
          <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
            Hay una nueva versión con mejoras importantes. Actualiza para seguir usando la app.
          </Text>
          <Button label="Ir a la tienda" onPress={() => Linking.openURL(storeUrl)} variant="primary" size="lg" style={{ marginTop: theme.spacing[2] }} />
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}
