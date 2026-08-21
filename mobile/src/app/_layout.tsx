/**
 * Layout raíz: monta los providers globales (tema, datos remotos, fuentes) y
 * mantiene el splash nativo visible hasta que las fuentes Manrope terminen de
 * cargar, para que no haya un parpadeo de texto en fuente del sistema seguido
 * de un salto a Manrope.
 *
 * Las fuentes vienen del paquete `@expo-google-fonts/manrope`, no de archivos
 * .ttf sueltos en assets/. Dos razones: (1) no se versionan binarios en el
 * repo, y (2) un `require()` a un .ttf que no existe NO degrada con elegancia
 * — Metro falla al EMPAQUETAR, no en tiempo de ejecución, así que la app ni
 * siquiera compila. Con el paquete, la fuente es una dependencia declarada.
 */
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { registerAnalyticsAppStateListener } from '@/api/analytics';
import { AuthProvider } from '@/api/auth-context';
import { queryClient, queryPersister } from '@/api/query-client';
import { AppGate } from '@/components/app-gate';
import { OfflineBanner } from '@/components/offline-banner';
import { ThemeProvider } from '@/theme/theme-provider';
import { tokens } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {
  // No-op: si ya se ocultó (hot reload) no es un error real.
});

// Los cinco pesos que usa la escala tipográfica del tema (400/500/600/700/800),
// los mismos que carga el sitio web. Si `useFonts` fallara, devuelve error en
// vez de lanzar y la app arranca igual con la fuente del sistema.
const MANROPE_FONTS = {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(MANROPE_FONTS);
  const isReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  // Vacía la cola de telemetría al volver a primer plano (ver src/api/analytics.ts).
  useEffect(() => registerAnalyticsAppStateListener(), []);

  if (!isReady) {
    // El splash nativo sigue visible encima de esto; no hace falta pintar nada.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider fontsLoaded={Boolean(fontsLoaded)}>
          <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister }}>
            <AuthProvider>
              <BottomSheetModalProvider>
                <StatusBar barStyle="dark-content" backgroundColor={tokens.colors.light.background} />
                <AppGate>
                  <OfflineBanner />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                  </Stack>
                </AppGate>
              </BottomSheetModalProvider>
            </AuthProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
