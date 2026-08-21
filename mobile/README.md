# Guía ZMG — app móvil

App híbrida (Expo / React Native) de [guiazmg.com](https://guiazmg.com): pantallas
nativas para lo que necesita sentirse a app (directorio, marketplace, mapa,
agenda, cuenta) + WebView para el resto del sitio. Este README cubre hasta la
**fase A2 (API real + sesión real)**: Inicio, Explorar (lista + mapa +
filtros), ficha de negocio con acciones fijas, mapa nativo con clusters,
marketplace completo (listado + ficha), telemetría por lotes, **login/registro/
recuperar contraseña reales**, refresco de sesión con cola (deduplicado contra
la rotación del backend) y WebView de sesión compartida con degradación
explícita si `/auth/handoff` no existe todavía en el sitio.

## Estado del proyecto

`npm install` **ya se corrió** y quedó verificado: `npx tsc --noEmit` en
verde, `npx expo-doctor` 21/21 (con una excepción documentada — ver abajo), y
`npx expo export --platform android` empaqueta sin errores (la prueba de que
Metro resuelve todos los `require()`/assets de verdad). También hay un smoke
test de integración real (`scripts/smoke-api.mjs`, ver más abajo) que usa el
mismo `src/api/client.ts` de la app contra un servidor corriendo de verdad.
Para levantarlo:

```bash
cd mobile
npx expo start
```

### La API real por defecto

`EXPO_PUBLIC_API_URL` por defecto apunta al preview de Vercel de la rama
`feat/app-movil` (ver `src/api/config.ts`). **Ese preview está caído ahora
mismo** por variables de entorno faltantes en el ambiente Preview de Vercel —
es un pendiente del lado del sitio, no de esta app. Para desarrollar/verificar
contra el backend real mientras tanto, levanta el sitio en local (`npm run dev`
en la raíz del repo, puerto 3100) y arranca la app con:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3100 npx expo start
```

`EXPO_PUBLIC_USE_MOCKS` es **opt-in explícito** (default `false`): sin esa
variable, la app siempre pide datos reales por HTTP. Los mocks de
`src/api/mocks/` se conservan para poder desarrollar la UI sin backend a la
mano (`EXPO_PUBLIC_USE_MOCKS=true`).

### `expo-doctor`: excepción documentada

`@react-native-cookies/cookies` (usado SOLO para purgar cookies del WebView al
cerrar sesión — ver `src/components/site-web-view.tsx`) aparece como
"unmaintained" / "unsupported on New Architecture" en React Native Directory.
Es un módulo nativo clásico (NativeModule, sin componente de UI Fabric), así
que sigue funcionando vía la capa de interoperabilidad de la Nueva
Arquitectura; no hay una alternativa mejor mantenida para esta necesidad
puntual. Se excluyó explícitamente en `package.json` →
`expo.doctor.reactNativeDirectoryCheck.exclude` para que `expo-doctor` refleje
21/21 sin ocultar el resto de verificaciones reales.

## Mapa y clave de Google Maps — pendiente crítico

`react-native-maps` en Android necesita una clave de **Google Maps SDK for
Android**. **Hoy esa clave NO existe** (el dueño del producto todavía no tiene
cuenta de Google Cloud). Por eso:

- La clave se lee de `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` (variable de
  entorno) → `app.config.ts` la inyecta en `android.config.googleMaps.apiKey`.
  **Nunca hardcodeada en el código.**
- Mientras no exista, `src/components/business-map-view.tsx` **no monta**
  `MapView` en Android: pinta un `EmptyState` explicando que falta configurar
  el mapa + la lista de negocios como alternativa funcional. Un mapa gris sin
  explicación parece una app rota — por eso el chequeo es explícito
  (`Constants.expoConfig?.extra?.hasGoogleMapsAndroidKey`), no "dejar que
  salga gris".
- En iOS no aplica: por defecto usa Apple Maps, que no necesita clave.

**Cómo generar la clave cuando exista la cuenta de Google Cloud:**

1. Crear/seleccionar un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Habilitar **"Maps SDK for Android"** (APIs & Services → Library).
3. Crear una credencial de tipo **API key** (APIs & Services → Credentials).
4. **Restringirla** a Android apps → paquete `com.guiazmg.app` + la huella
   SHA-1 del certificado de firma.
5. Poner la clave en `mobile/.env` como `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=...`
   y volver a compilar (`expo prebuild` regenera `android/` con la clave).

**Advertencia (error clásico):** la huella SHA-1 de **Play App Signing** es
**DISTINTA** a la del keystore local con el que compilas en tu máquina. Si solo
restringes la clave con el SHA-1 de tu keystore de desarrollo, el mapa
funcionará en tus pruebas y **se pondrá gris en producción** (la build que
sube a Play Store la firma Google con OTRA llave). Para saber la huella real
de producción: Play Console → tu app → Configuración → Integridad de la app →
"Firma de la app" → copiar el SHA-1 de ahí, y agregarlo TAMBIÉN como
restricción en la clave de Google Cloud (se pueden registrar varias huellas).

## Qué queda pendiente / no verificado

- **La clave de Google Maps Android** (ver arriba) — sin ella, el mapa real
  nunca se probó visualmente en un dispositivo/emulador, solo el *fallback*
  de `EmptyState`.
- **El preview de Vercel de la rama (`EXPO_PUBLIC_API_URL` por defecto) está
  caído hoy** por variables de entorno faltantes del lado del sitio — no es
  un bug de esta app. Verificado en cambio contra el servidor local
  (`npm run dev`, puerto 3100): ver `scripts/smoke-api.mjs`.
- **`/auth/handoff` todavía no existe en el sitio web.** `SiteWebView`
  detecta el 404/HEAD fallido y degrada con elegancia (abre la ruta pública
  sin sesión + avisa), pero el handoff app→web con sesión compartida real
  para el panel de negocio no se probó punta a punta porque el sitio no tiene
  esa ruta todavía.
- **Favoritos del marketplace son solo de sesión** (no hay endpoint móvil de
  favoritos todavía): el corazón se ve y responde, pero no persiste al cerrar
  la app — no está simulado como si persistiera, es honesto en el código.
- **"Guardados" en Perfil todavía no está conectado** (`src/app/(tabs)/perfil.tsx`
  muestra un aviso de "próximamente" al tocarlo) — no hay endpoint móvil de
  favoritos persistentes listado en el alcance de esta fase.
- **No se corrió en un dispositivo/emulador físico** en esta fase — solo se
  verificó que compila, tipa y empaqueta (`tsc`, `expo-doctor`, `expo export`)
  y que el flujo de auth real (registro, login, `/auth/me`, refresh
  concurrente deduplicado, logout, reuso de refresh token rechazado) funciona
  contra el servidor local. Antes de un release real hace falta correrlo en
  Android/iOS de verdad.
- **No hay `eslint` configurado en `mobile/`** (el `eslint.config.mjs` de la
  raíz del repo ignora `mobile/**` a propósito — ver más abajo). `npm run
  lint` (`expo lint`) no tiene config propia todavía; no bloquea esta fase
  porque no era parte de la verificación pedida, pero es deuda pendiente.

## Flujo de pruebas recomendado

1. **Expo Go** (más rápido, para iterar UI): `npx expo start`, escanea el QR
   con la app Expo Go en tu teléfono. Suficiente para validar layout,
   estados de carga/vacío/error y navegación. **No sirve** para nada que use
   módulos nativos fuera del set que Expo Go trae de fábrica.
2. **Development build** (necesario en cuanto se agregue un módulo nativo
   custom, p.ej. mapas o push notifications): `npx expo prebuild` +
   `npx expo run:android` / `npx expo run:ios`, o `eas build --profile
   development`.
3. **APK / build de prueba para compartir sin cable**: `eas build --profile
   preview -p android` (requiere cuenta de Expo/EAS configurada — no incluida
   en esta fase).

## Por qué `mobile/` está fuera del sitio web

Este directorio es un proyecto Expo aparte, con su propio `package.json` y
(cuando se instale) su propio `node_modules`. El sitio (`guiazmg.com`) es un
proyecto Next.js que se despliega en Vercel; **nunca** debe intentar construir
`mobile/`. Tres mecanismos lo garantizan, todos ya en el repo:

- **`.vercelignore`** (raíz del repo) excluye `mobile/` del deploy.
- **`tsconfig.json`** (raíz) tiene `"exclude": [..., "mobile"]`.
- **`eslint.config.mjs`** (raíz) ignora `mobile/**` — tiene su propio tooling
  y lintearlo con las reglas de Next produce falsos positivos.

La app móvil se compila con **EAS Build** en la nube (o local con Xcode /
Android Studio), nunca con el pipeline de Vercel.

## Estructura

```
mobile/
├── app.config.ts          # config de Expo: permisos, clave de Google Maps (vía env), splash
├── src/
│   ├── app/                     # rutas (expo-router)
│   │   ├── _layout.tsx          # providers: tema, React Query, gestos, bottom sheet, fuentes, telemetría
│   │   ├── (tabs)/               # Inicio · Explorar (lista+mapa+filtros) · Marketplace · Agenda · Cuenta
│   │   ├── negocio/[slug].tsx    # ficha de negocio (galería, horarios, acciones fijas, reseñas, similares)
│   │   ├── marketplace/[id].tsx  # ficha de publicación del marketplace
│   │   └── mapa.tsx              # mapa a pantalla completa (comparte BusinessMapView con Explorar)
│   ├── theme/               # tokens.ts (fuente de verdad) + theme-provider.tsx
│   ├── ui/                  # primitivas: Button, Card, Chip, Skeleton, EmptyState, ErrorState, Text
│   ├── location/             # permiso de ubicación (modal propio + hook `useNearMe`)
│   ├── utils/                 # format (MXN/distancia/tiempo relativo), business-hours, contact-actions, map-region
│   ├── components/          # componentes de dominio (tarjetas, carruseles, bottom sheet de filtros, mapa)
│   └── api/
│       ├── client.ts        # fetch real + modo mock, maneja TOKEN_EXPIRED/SESSION_REVOKED, refresco con cola
│       ├── auth-context.tsx  # AuthProvider/useAuth(): sesión real (signIn/signUp/signOut)
│       ├── auth-tokens.ts    # refreshToken en SecureStore, accessToken en memoria, refresco deduplicado
│       ├── device-id.ts      # uuid v4 estable del dispositivo (SecureStore)
│       ├── analytics.ts      # telemetría por lotes (cola en AsyncStorage, vacía al volver a foreground)
│       ├── app-config.ts     # GET /config (forceUpdate/minAppVersion/maintenanceMode)
│       ├── types.ts          # copia manual del contrato del backend (léelo antes de tocarlo)
│       ├── queries.ts        # hooks de React Query (incluye infinite queries para scroll infinito)
│       ├── query-client.ts   # QueryClient + persistencia en AsyncStorage
│       └── mocks/            # datos de ejemplo — solo con EXPO_PUBLIC_USE_MOCKS=true, opt-in
├── scripts/
│   └── smoke-api.mjs        # humo de integración: usa el MISMO client.ts contra un servidor real
└── assets/fonts/README.md   # qué .ttf de Manrope hace falta y de dónde bajarlos
```

## Sistema de diseño

Todo color, radio, espaciado y estilo tipográfico vive en
`src/theme/tokens.ts` (espejo exacto de `src/app/globals.css` del sitio web,
convertido a hex porque `oklch()` no existe en React Native). Ningún
componente debe escribir un hex literal — todo pasa por `useTheme()`
(`src/theme/theme-provider.tsx`). La app es **solo modo claro** por decisión
de producto; `colors.dark` existe en `tokens.ts` como copia idéntica de
`colors.light` para que activar modo oscuro en el futuro sea rellenar un
objeto, no reescribir componentes.

## Mocks de la API

Con `EXPO_PUBLIC_USE_MOCKS=true` (**opt-in explícito**, default `false`), el
cliente HTTP resuelve contra `src/api/mocks/` en vez de hacer red real, con la
misma envoltura `{ ok, data, meta }` que la API real. Útil para iterar la UI
sin backend a la mano; por defecto la app siempre pide datos reales por HTTP.

## Smoke test de integración (`scripts/smoke-api.mjs`)

Reutiliza el **mismo** `src/api/client.ts` de la app (no una copia de la
lógica) contra un servidor corriendo de verdad, y valida la forma de la
respuesta de `/home`, `/catalog`, `/search`, `/search/suggestions`,
`/businesses/[slug]` (+ reseñas), `/map/businesses`, `/marketplace` (+
categorías y detalle), `/config` y el código de error de un login inválido.
Como Node no puede correr módulos nativos de Expo/RN, el script sustituye
SOLO `expo-constants`/`react-native`/`expo-secure-store`/`expo-crypto` por
shims mínimos en memoria antes de cargar `client.ts` — ni una línea de la
lógica real se copia o reescribe.

```bash
# con el sitio corriendo en local (npm run dev, puerto 3100):
cd mobile
node scripts/smoke-api.mjs
# o contra otra URL:
API_URL=https://guiazmg-git-feat-app-movil-conversiondigital-5489s-projects.vercel.app \
  node scripts/smoke-api.mjs
```
