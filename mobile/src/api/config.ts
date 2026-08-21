/**
 * Configuración de entorno de la app. Lee variables `EXPO_PUBLIC_*` (las
 * únicas que Expo expone al bundle de cliente) con defaults seguros a
 * producción, para que un build sin `.env` configurado siga apuntando a
 * algo válido en vez de a `localhost`.
 */
export const apiConfig = {
  /**
   * Base de la API móvil real: `/api/mobile/v1` YA EXISTE en el backend (fase A2).
   * Default al preview de Vercel de la rama `feat/app-movil` (hoy caído por
   * variables de entorno faltantes en el ambiente Preview — el dueño lo está
   * arreglando; no es un fallo de la app). Para verificar contra el servidor
   * local: `EXPO_PUBLIC_API_URL=http://localhost:3100`.
   */
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ??
    'https://guiazmg-git-feat-app-movil-conversiondigital-5489s-projects.vercel.app',
  /** Base del sitio web, para WebViews y deep links. */
  siteUrl: process.env.EXPO_PUBLIC_SITE_URL ?? 'https://guiazmg.com',
  /**
   * Activa el router de mocks en vez de llamar a la red real. **Opt-in
   * explícito** (default `false`): la app pide datos por HTTP de verdad salvo
   * que alguien encienda esto a propósito para desarrollar sin backend a la
   * mano. Los mocks se conservan en `src/api/mocks/` para ese caso.
   */
  useMocks: (process.env.EXPO_PUBLIC_USE_MOCKS ?? 'false') === 'true',
} as const;
