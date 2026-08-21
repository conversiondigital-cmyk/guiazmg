/**
 * Layout raíz: monta los providers globales (tema, datos remotos, fuentes) y
 * mantiene el splash nativo visible hasta que las fuentes Manrope terminen de
 * cargar (o fallen — ver `assets/fonts/README.md`), para que no haya un
 * parpadeo de texto en fuente del sistema seguido de un salto a Manrope.
 */
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient, queryPersister } from '@/api/query-client';
import { ThemeProvider } from '@/theme/theme-provider';
import { tokens } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {
  // No-op: si ya se ocultó (hot reload) no es un error real.
});

// Pesos de Manrope. Si los archivos NO están en assets/fonts/ (ver el README
// de esa carpeta), `useFonts` resuelve con `false` en vez de lanzar: la app
// sigue arrancando con la fuente del sistema, nunca se queda bloqueada.
const MANROPE_FONTS = {
  Manrope_400Regular: require('../../assets/fonts/Manrope-Regular.ttf'),
  Manrope_500Medium: require('../../assets/fonts/Manrope-Medium.ttf'),
  Manrope_600SemiBold: require('../../assets/fonts/Manrope-SemiBold.ttf'),
  Manrope_700Bold: require('../../assets/fonts/Manrope-Bold.ttf'),
  Manrope_800ExtraBold: require('../../assets/fonts/Manrope-ExtraBold.ttf'),
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(MANROPE_FONTS);
  const isReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) {
    // El splash nativo sigue visible encima de esto; no hace falta pintar nada.
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider fontsLoaded={Boolean(fontsLoaded)}>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister }}>
          <StatusBar barStyle="dark-content" backgroundColor={tokens.colors.light.background} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </PersistQueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
