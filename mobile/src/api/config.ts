/**
 * Configuración de entorno de la app. Lee variables `EXPO_PUBLIC_*` (las
 * únicas que Expo expone al bundle de cliente) con defaults seguros a
 * producción, para que un build sin `.env` configurado siga apuntando a
 * algo válido en vez de a `localhost`.
 */
export const apiConfig = {
  /** Base de la API móvil (`/api/mobile/v1` aún no existe — ver README). */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://guiazmg.com',
  /** Base del sitio web, para WebViews y deep links. */
  siteUrl: process.env.EXPO_PUBLIC_SITE_URL ?? 'https://guiazmg.com',
  /**
   * Activa el router de mocks en vez de llamar a la red. Por defecto `true`
   * porque la API móvil todavía no existe (fase A0); se apaga sola en
   * cuanto haya endpoint real, cambiando esta bandera en `.env`.
   */
  useMocks: (process.env.EXPO_PUBLIC_USE_MOCKS ?? 'true') === 'true',
} as const;
