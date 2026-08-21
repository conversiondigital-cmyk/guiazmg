/**
 * Pantalla de pila genérica para abrir cualquier ruta del sitio dentro de la
 * app — envuelve el único `SiteWebView`. Todo enlace a "blog", "ayuda",
 * "panel de negocio", etc. navega aquí con `path`/`title`/`authenticated`
 * como params, en vez de instanciar un WebView propio.
 */
import { useLocalSearchParams } from 'expo-router';

import { SiteWebView } from '@/components/site-web-view';

export default function WebViewScreen() {
  const { path, title, authenticated } = useLocalSearchParams<{ path: string; title?: string; authenticated?: string }>();

  return <SiteWebView path={path ?? '/'} title={title} authenticated={authenticated === '1'} />;
}
