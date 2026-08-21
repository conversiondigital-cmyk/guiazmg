import type { ExpoConfig } from 'expo/config';

/**
 * Configuración de Expo de Guía ZMG. Usamos `app.config.ts` (no `app.json`)
 * para poder leer variables de entorno con default a producción, y para
 * poder comentar aquí mismo los bloques que se activarán en fases
 * posteriores sin tener que buscar documentación externa.
 */

// Mismo default que `src/api/config.ts`: el preview de Vercel de la rama
// `feat/app-movil` (hoy caído por variables de entorno faltantes en el
// ambiente Preview — el dueño lo está arreglando). Para verificar contra el
// servidor local: `EXPO_PUBLIC_API_URL=http://localhost:3100`.
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://guiazmg-git-feat-app-movil-conversiondigital-5489s-projects.vercel.app';
const siteUrl = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://guiazmg.com';

/**
 * Clave de Google Maps para Android. Hoy (fase A1) NO existe: el dueño del
 * producto todavía no tiene cuenta de Google Cloud. `undefined` es
 * intencional — NUNCA hardcodear una clave aquí. Sin ella, `react-native-maps`
 * pinta un rectángulo gris en Android; por eso `src/app/mapa.tsx` detecta la
 * ausencia de esta variable y muestra un `EmptyState` explicando la falta en
 * vez de dejar que salga el gris roto. Ver README.md → "Mapa y clave de
 * Google Maps" para cómo generarla cuando exista la cuenta.
 */
const googleMapsAndroidApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY;

const config: ExpoConfig = {
  name: 'Guía ZMG',
  slug: 'guiazmg',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'guiazmg',
  // Solo modo claro: el sitio web no tiene modo oscuro (decisión de producto),
  // así que la app tampoco debe alternar con el tema del sistema operativo.
  userInterfaceStyle: 'light',
  extra: {
    apiUrl,
    siteUrl,
    /** Solo para que `src/app/mapa.tsx` pueda detectar en runtime si hay clave (vía expo-constants), sin importar `.env` directo. */
    hasGoogleMapsAndroidKey: Boolean(googleMapsAndroidApiKey),
  },
  // El splash NO va aquí: en SDK 57 `splash` ya no existe en el tipo
  // `ExpoConfig` (tsc lo rechaza) y lo configura por completo el plugin
  // `expo-splash-screen` más abajo, con el mismo verde de marca #006c49.
  ios: {
    bundleIdentifier: 'com.guiazmg.app',
    icon: './assets/expo.icon',
    supportsTablet: false,

    // Ubicación en foreground (fase A1: "Cerca de ti" / mapa). iOS EXIGE
    // este texto exacto o Apple rechaza el build en revisión.
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Guía ZMG usa tu ubicación para mostrarte negocios cerca de ti en la Zona Metropolitana de Guadalajara.',
    },

    // --- FASE A2 (auth con Apple / Sign in) ---
    // infoPlist adicional cuando se suba fotos:
    // NSCameraUsageDescription:
    //   'Guía ZMG usa la cámara para que subas fotos de tu negocio o de un artículo del marketplace.',
    // NSPhotoLibraryUsageDescription:
    //   'Guía ZMG accede a tus fotos para que elijas una imagen de tu negocio o de tu publicación en el marketplace.',

    // --- FASE A4 (deep links / Universal Links) ---
    // Requiere el archivo `apple-app-site-association` publicado en
    // https://guiazmg.com/.well-known/apple-app-site-association (eso lo
    // hace el equipo del sitio, no esta app). Sin ese archivo, iOS ignora
    // `associatedDomains` en silencio.
    // associatedDomains: ['applinks:guiazmg.com'],
  },
  android: {
    package: 'com.guiazmg.app',
    adaptiveIcon: {
      backgroundColor: '#006c49',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,

    // Mapa (fase A1): sin esta clave, `react-native-maps` en Android pinta
    // gris. Se lee de entorno — nunca hardcodeada. Ver README.md.
    config: {
      googleMaps: {
        apiKey: googleMapsAndroidApiKey,
      },
    },

    // Permisos que la plantilla de Expo/React Native añade sola y que esta app
    // NO usa. Cada permiso de más es una casilla más que declarar en el
    // formulario de Data Safety de Google Play y un motivo más de rechazo —
    // y SYSTEM_ALERT_WINDOW ("dibujar sobre otras apps") es de los que Play
    // revisa con lupa, porque es el que usan las apps que suplantan pantallas.
    // Aquí solo lo pide el overlay de errores del modo desarrollo, que en un
    // build de release no existe.
    // Verificado sobre el APK con `aapt2 dump badging`: sin este bloqueo el
    // release declaraba SYSTEM_ALERT_WINDOW, READ/WRITE_EXTERNAL_STORAGE,
    // USE_BIOMETRIC, USE_FINGERPRINT y VIBRATE sin que la app los usara.
    blockedPermissions: [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
      'android.permission.VIBRATE',

      // Estos tres los arrastra `androidx.work` (WorkManager), que entra como
      // dependencia de `expo-location` para tareas de UBICACIÓN EN SEGUNDO
      // PLANO. Esta app usa ubicación SOLO en primer plano (decisión de
      // producto: el segundo plano exige justificación en video ante Google y
      // aquí no aporta nada), así que WorkManager nunca se ejecuta.
      //
      // RECEIVE_BOOT_COMPLETED significa "arrancar al encender el teléfono":
      // en un directorio de negocios no tiene ninguna justificación, y los
      // tres hay que declararlos en el formulario de Data Safety de Play.
      //
      // Rastreado con el manifest-merger-release-report.txt del build, no
      // adivinado: los tres vienen de work-runtime-2.9.1.
      //
      // ⚠️ Si algún día se añade una tarea en segundo plano de verdad
      // (geofencing, seguimiento de ubicación, notificaciones programadas
      // locales), hay que QUITAR estas tres líneas o esa tarea fallará en
      // silencio.
      'android.permission.WAKE_LOCK',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.FOREGROUND_SERVICE',
    ],

    // Ubicación en foreground (fase A1: "Cerca de ti" / mapa). Solo
    // foreground — nunca ACCESS_BACKGROUND_LOCATION, que Play revisa con
    // lupa y esta app no necesita.
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],

    // --- FASE A4: deep links guiazmg.com -> abre la app en vez del navegador.
    // Requiere el archivo `assetlinks.json` publicado en
    // https://guiazmg.com/.well-known/assetlinks.json con el SHA-256 del
    // certificado de firma del build (distinto en debug/preview/producción).
    // intentFilters: [
    //   {
    //     action: 'VIEW',
    //     autoVerify: true,
    //     data: [{ scheme: 'https', host: 'guiazmg.com', pathPrefix: '/' }],
    //     category: ['BROWSABLE', 'DEFAULT'],
    //   },
    // ],
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Guía ZMG usa tu ubicación para mostrarte negocios cerca de ti en la Zona Metropolitana de Guadalajara.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#006c49',
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          // Reduce el peso del release quitando código y recursos que nadie
          // referencia. Se configura AQUÍ y no editando android/build.gradle
          // porque esa carpeta la regenera `expo prebuild` y el cambio se
          // perdería en silencio en la siguiente compilación.
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
