/**
 * Único componente que abre el sitio web dentro de la app — NADIE más
 * instancia `WebView` a mano. Usado para blog, términos, privacidad, ayuda y
 * el panel del dueño de negocio desde Perfil.
 *
 * Sesión compartida (handoff app→web): si `authenticated` es `true`, ANTES de
 * navegar se pide un código de un solo uso a `POST /webview-session` y se
 * abre `${siteUrl}/auth/handoff?code=...&next=...&embed=1`. Esa página del
 * sitio (`/auth/handoff`) TODAVÍA NO EXISTE del lado web (fase A2, trabajo en
 * paralelo) — por eso se detecta si responde 404/error y se DEGRADA con
 * elegancia: abre la ruta pedida sin sesión y avisa que habrá que iniciar
 * sesión ahí. Nunca se simula que el handoff funcionó cuando no fue así.
 */
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Linking, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, RotateCw, X } from 'lucide-react-native';
import { Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import WebView, { type WebViewNavigation } from 'react-native-webview';

import { apiClient } from '@/api/client';
import { apiConfig } from '@/api/config';
import { useAuth } from '@/api/auth-context';
import { useTheme } from '@/theme/theme-provider';
import { Button } from '@/ui/Button';
import { ErrorState } from '@/ui/ErrorState';
import { Skeleton } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';

export type SiteWebViewProps = {
  /** Ruta del sitio a abrir, relativa (`/blog`, `/dashboard`, `/terminos`...). */
  path: string;
  title?: string;
  /** `true` si esta pantalla necesita sesión compartida (p.ej. `/dashboard`). Sin sesión local, se ignora (se abre pública). */
  authenticated?: boolean;
  onClose?: () => void;
};

const NATIVE_EQUIVALENTS: Array<{ test: RegExp; toNative: (url: URL) => string }> = [
  { test: /^\/negocio\//, toNative: (url) => `/negocio/${url.pathname.split('/')[2] ?? ''}` },
  { test: /^\/marketplace\//, toNative: (url) => `/marketplace/${url.pathname.split('/')[2] ?? ''}` },
  { test: /^\/buscar\/?$/, toNative: () => '/(tabs)/explorar' },
  { test: /^\/mapa\/?$/, toNative: () => '/(tabs)/mapa' },
];

export function SiteWebView({ path, title, authenticated = false, onClose }: SiteWebViewProps) {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const close = useCallback(() => {
    if (onClose) onClose();
    else if (router.canGoBack()) router.back();
  }, [onClose, router]);

  useEffect(() => {
    let mounted = true;

    async function resolve() {
      setResolving(true);
      setDegraded(false);
      const base = apiConfig.siteUrl.replace(/\/$/, '');
      const publicUrl = `${base}${path}`;

      if (!authenticated || !user) {
        if (mounted) {
          setResolvedUri(publicUrl);
          setResolving(false);
        }
        return;
      }

      try {
        const session = await apiClient.post<{ code: string; expiresIn: number }>('/webview-session');
        const handoffUrl = `${base}/auth/handoff?code=${encodeURIComponent(session.code)}&next=${encodeURIComponent(path)}&embed=1`;
        // Verificamos que la página de handoff exista antes de comprometernos
        // a ella: si el sitio todavía no la publicó, un WebView cargando esa
        // URL mostraría un 404 crudo, que se ve como la app rota.
        const probe = await fetch(handoffUrl, { method: 'HEAD' }).catch(() => null);
        if (probe && probe.ok) {
          if (mounted) {
            setResolvedUri(handoffUrl);
            setResolving(false);
          }
          return;
        }
        throw new Error('handoff-unavailable');
      } catch {
        // Degradación explícita: se abre la ruta pública (sin sesión) y se
        // avisa. Nunca se pretende que el handoff funcionó.
        if (mounted) {
          setDegraded(true);
          setResolvedUri(publicUrl);
          setResolving(false);
        }
      }
    }

    void resolve();
    return () => {
      mounted = false;
    };
  }, [path, authenticated, user, reloadKey]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const handleShouldStartLoad = useCallback(
    (request: WebViewNavigation | { url: string }) => {
      const rawUrl = request.url;
      let url: URL;
      try {
        url = new URL(rawUrl);
      } catch {
        return true;
      }

      if (url.protocol === 'tel:' || url.protocol === 'mailto:') {
        void Linking.openURL(rawUrl);
        return false;
      }
      if (url.hostname.includes('wa.me') || url.hostname.includes('whatsapp.com')) {
        void Linking.openURL(rawUrl);
        return false;
      }

      const siteHost = new URL(apiConfig.siteUrl).hostname;
      if (url.hostname === siteHost || url.hostname === `www.${siteHost}`) {
        const match = NATIVE_EQUIVALENTS.find((entry) => entry.test.test(url.pathname));
        if (match) {
          router.push(match.toNative(url) as never);
          return false;
        }
        return true;
      }

      // Dominio ajeno (redes sociales, sitios externos de un negocio): nunca
      // dentro del propio WebView — se abre en el navegador del sistema.
      void WebBrowser.openBrowserAsync(rawUrl);
      return false;
    },
    [router],
  );

  if (resolving || !resolvedUri) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <Header title={title} onClose={close} onReload={() => setReloadKey((k) => k + 1)} canGoBack={false} onBack={close} />
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[3] }}>
          <Skeleton width="100%" height={24} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="100%" height={200} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <Header
        title={title}
        onClose={close}
        onReload={() => setReloadKey((k) => k + 1)}
        canGoBack={canGoBack}
        onBack={() => (canGoBack ? webViewRef.current?.goBack() : close())}
      />
      {degraded ? (
        <View
          style={{
            backgroundColor: theme.colors.muted,
            paddingHorizontal: theme.spacing[4],
            paddingVertical: theme.spacing[2],
          }}>
          <Text variant="caption" color="mutedForeground">
            No pudimos abrir tu sesión aquí todavía. Es posible que tengas que iniciar sesión de nuevo dentro de esta pantalla.
          </Text>
        </View>
      ) : null}

      {loadError ? (
        <ErrorState message="No pudimos cargar esta página." onRetry={() => (setLoadError(false), setReloadKey((k) => k + 1))} />
      ) : (
        <WebView
          key={reloadKey}
          ref={webViewRef}
          source={{ uri: resolvedUri }}
          // La sesión del WebView NO se persiste, a propósito. Antes se
          // guardaba y se borraba con @react-native-cookies/cookies al cerrar
          // sesión, pero esa librería está sin mantenimiento y usa jcenter(),
          // un repositorio que Gradle 9 eliminó: rompía la compilación del APK.
          //
          // `incognito` es además una solución MEJOR que borrar cookies: no hay
          // nada que purgar porque nunca se escriben en disco. El fallo que se
          // quería evitar —que el panel del dueño siguiera logueado tras cerrar
          // sesión en la app— deja de ser posible por construcción, en vez de
          // depender de que alguien acuerde llamar a la función de limpieza.
          //
          // Coste: cada vez que se abre una pantalla web autenticada hay que
          // rehacer el handoff. Es barato (un código de un solo uso, TTL 60s).
          incognito
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onError={() => setLoadError(true)}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 500) setLoadError(true);
          }}
          onRenderProcessGone={() => setReloadKey((k) => k + 1)}
          onContentProcessDidTerminate={() => setReloadKey((k) => k + 1)}
          startInLoadingState
          renderLoading={() => (
            <View style={{ padding: theme.spacing[4], gap: theme.spacing[3] }}>
              <Skeleton width="100%" height={200} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

/**
 * Se conserva por compatibilidad con quien ya la llama al cerrar sesión, pero
 * hoy NO tiene nada que purgar: `SiteWebView` monta el WebView en modo
 * `incognito`, así que la sesión web vive solo en memoria y muere con la
 * pantalla. El riesgo que esta función cubría —que el panel del dueño siguiera
 * accesible tras cerrar sesión en la app— está resuelto por construcción.
 *
 * Si algún día se quita `incognito` para que la sesión persista, hay que
 * volver a implementar el borrado real aquí, con una librería mantenida.
 */
export async function purgeWebViewCookies(): Promise<void> {
  // No-op deliberado. Ver el comentario de arriba.
}

function Header({
  title,
  onClose,
  onBack,
  onReload,
  canGoBack,
}: {
  title?: string;
  onClose: () => void;
  onBack: () => void;
  onReload: () => void;
  canGoBack: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={canGoBack ? 'Regresar en la página' : 'Cerrar'}
        style={{ width: theme.minHitTarget, height: theme.minHitTarget, alignItems: 'center', justifyContent: 'center' }}>
        <ArrowLeft size={22} color={theme.colors.foreground} />
      </Pressable>
      <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
        {title ?? ''}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        <Pressable
          onPress={onReload}
          accessibilityRole="button"
          accessibilityLabel="Recargar"
          style={{ width: theme.minHitTarget, height: theme.minHitTarget, alignItems: 'center', justifyContent: 'center' }}>
          <RotateCw size={20} color={theme.colors.mutedForeground} />
        </Pressable>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          style={{ width: theme.minHitTarget, height: theme.minHitTarget, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={theme.colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}
