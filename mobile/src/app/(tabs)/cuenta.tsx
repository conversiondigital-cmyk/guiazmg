/**
 * Cuenta: sesión / perfil. La autenticación real llega en la fase A2
 * (`auth-tokens.ts` ya deja el punto de extensión listo). Por ahora la
 * pantalla es honesta: no hay sesión posible todavía, y el botón lo dice en
 * vez de simular un login que no existe.
 */
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';

export default function CuentaScreen() {
  const theme = useTheme();
  const [checkingAuth, setCheckingAuth] = useState(false);

  async function handlePressIniciarSesion() {
    setCheckingAuth(true);
    try {
      // No hay backend de autenticación todavía (fase A2). Esta espera es
      // real feedback de "se intentó", no una animación decorativa: cuando
      // el endpoint exista, aquí va la llamada a apiClient.post('/auth/login', ...).
      await new Promise((resolve) => setTimeout(resolve, 700));
      Alert.alert(
        'Inicio de sesión próximamente',
        'Todavía no puedes iniciar sesión desde la app. Esta función llega en una próxima actualización.',
      );
    } finally {
      setCheckingAuth(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4] }}>
        <Text variant="h1">Cuenta</Text>
        <Text variant="body" color="mutedForeground" style={{ marginTop: theme.spacing[1] }}>
          Inicia sesión para guardar favoritos, escribir reseñas y administrar tu negocio
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: theme.spacing[6],
          gap: theme.spacing[4],
        }}>
        <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
          Todavía no has iniciado sesión.
        </Text>
        <Button
          label="Iniciar sesión"
          onPress={handlePressIniciarSesion}
          loading={checkingAuth}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
