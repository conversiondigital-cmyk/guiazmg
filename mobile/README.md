# Guía ZMG — app móvil

App híbrida (Expo / React Native) de [guiazmg.com](https://guiazmg.com): pantallas
nativas para lo que necesita sentirse a app (directorio, marketplace, agenda,
cuenta) + WebView para el resto del sitio. Este README cubre la **fase A0
(cimientos)**: sistema de diseño, primitivas de UI, cliente de API con mocks,
y la navegación de 5 pestañas. Todavía no hay pantallas de negocio completas
ni autenticación real — eso llega en fases posteriores (A1, A2...).

## Estado del proyecto — IMPORTANTE

Este `mobile/` se generó con `create-expo-app` **sin instalar `node_modules`**
(conflicto de binarios nativos pendiente de resolver por el dueño del
entorno). Todo el código está escrito y las dependencias están declaradas en
`package.json`, pero **nadie ha corrido `npm install` todavía** ni se ha
verificado que compile. Antes de tocar código nuevo:

```bash
cd mobile
npm install
npx expo start
```

Si `npm install` falla por conflicto de versiones nativas, no lo fuerces con
`--legacy-peer-deps` a ciegas — revisa cuál paquete choca contra el SDK 57 /
React 19.2 / RN 0.86 y ajusta esa versión puntual en `package.json`.

## Qué falta por instalar / verificar (no se pudo hacer en esta fase)

- **`npm install` nunca se corrió.** No hay garantía de que las versiones
  fijadas en `package.json` resuelvan sin conflicto (React 19.2 + RN 0.86 es
  una combinación reciente; `lucide-react-native` y las libs de
  `@tanstack/react-query` se fijaron a versiones que en teoría son
  compatibles, pero no se probó el `npm install` real).
- **Los archivos `.ttf` de Manrope no existen** en `assets/fonts/` — ver el
  README de esa carpeta. El código degrada bien sin ellos, pero nadie ha
  visto la app corriendo con la tipografía real puesta.
- **No se corrió `npx expo start` ni `tsc`** — no hay confirmación de que el
  proyecto compile o arranque. Con SDK 57 recién salido, es posible que algún
  import de `expo-router` o `expo-font` haya cambiado de forma sutil.
- **El endpoint `/api/mobile/v1` no existe en el backend.** El cliente HTTP
  (`src/api/client.ts`) está escrito contra el contrato documentado en
  `src/api/types.ts`, pero es una copia manual — hay que confirmarlo contra
  el backend real cuando exista.

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
├── app.config.ts          # config de Expo (nombre, scheme, permisos comentados)
├── src/
│   ├── app/                # rutas (expo-router)
│   │   ├── _layout.tsx     # providers: tema, React Query (con persistencia), fuentes
│   │   └── (tabs)/         # Inicio · Explorar · Marketplace · Agenda · Cuenta
│   ├── theme/               # tokens.ts (fuente de verdad) + theme-provider.tsx
│   ├── ui/                  # primitivas: Button, Card, Chip, Skeleton, EmptyState, ErrorState, Text
│   ├── components/          # componentes de dominio (p.ej. tarjeta de negocio)
│   └── api/
│       ├── client.ts        # fetch real + modo mock, maneja TOKEN_EXPIRED/SESSION_REVOKED
│       ├── types.ts          # copia manual del contrato del backend (léelo antes de tocarlo)
│       ├── queries.ts        # hooks de React Query que consumen las pantallas
│       ├── query-client.ts   # QueryClient + persistencia en AsyncStorage
│       ├── auth-tokens.ts    # punto de extensión para auth real (llega en A2)
│       └── mocks/            # datos de ejemplo (negocios de Guadalajara/Zapopan/...)
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

Con `EXPO_PUBLIC_USE_MOCKS=true` (default, ver `.env.example`), el cliente
HTTP resuelve contra `src/api/mocks/` en vez de hacer red real, con la misma
envoltura `{ ok, data, meta }` que usará la API real. Apagar el mock el día
que `/api/mobile/v1` exista es cambiar un solo flag, sin tocar pantallas.
