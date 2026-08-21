/**
 * Tokens del sistema de diseño de Guía ZMG.
 *
 * Fuente de verdad: `src/app/globals.css` del sitio web (guiazmg.com). Estos son
 * los MISMOS valores, convertidos a hex porque `oklch()` no existe en React
 * Native. Si el sitio cambia su paleta, este archivo se actualiza a mano — no
 * hay build compartido entre el sitio (Next.js) y esta app (Expo).
 *
 * Ningún componente de la app debe escribir un hex literal: todo color, radio,
 * espaciado o estilo tipográfico sale de aquí (vía `useTheme()`).
 */

/**
 * Escala de verde de marca (redefine el `green-*` de Tailwind en el sitio).
 * `700` es el primario oficial de Guía ZMG.
 */
export const brand = {
  green50: '#ecfdf5',
  green100: '#d1fae5',
  green200: '#a7f3d0',
  green300: '#6ee7b7',
  green400: '#34d399',
  green500: '#10b981',
  green600: '#059669',
  green700: '#006c49', // primario
  green800: '#00583b', // pressed / hover
  green900: '#003527',
  green950: '#01231a',
} as const;

/**
 * Hex "sueltos" del sitio que no tenían nombre de token ahí, pero se usan lo
 * bastante seguido como para merecer uno aquí.
 */
export const extras = {
  surfacePage: '#f8f9ff',
  inkDeep: '#0b1c30',
  inkSoft: '#404944',
  tintMint: '#d8f0e6',
  tintMintInk: '#0f7a52',
} as const;

/**
 * Paleta semántica plana, tal como la usan los componentes.
 *
 * NOTA modo oscuro: Guía ZMG es SOLO modo claro por decisión del dueño de
 * producto — el sitio web tampoco tiene modo oscuro. `dark` existe únicamente
 * para que el resto del código (theme-provider, hooks) ya tenga la forma
 * `{ light, dark }` lista: el día que se apruebe modo oscuro, se rellena SOLO
 * `dark` sin tocar un solo componente de UI. Hasta entonces `dark` es una
 * copia idéntica de `light` a propósito (no es un error ni un placeholder).
 */
const paletteLight = {
  primary: brand.green700,
  primaryForeground: '#ffffff',
  primaryPressed: brand.green800,
  secondary: '#D97706',
  secondaryForeground: '#ffffff',
  destructive: '#EF4444',
  success: '#22c55e',
  warning: '#f97316',
  info: '#3b82f6',
  background: '#ffffff',
  foreground: '#0a0a0a',
  card: '#ffffff',
  muted: '#f5f5f5',
  mutedForeground: '#737373',
  border: '#e5e5e5',
  input: '#e5e5e5',
  accent: '#e2e8f0',
  accentForeground: '#0F172A',
  ring: '#0F172A',
  ...extras,
  ...brand,
} as const;

export const colors = {
  light: paletteLight,
  // Idéntico a `light` a propósito — ver nota arriba.
  dark: paletteLight,
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = typeof colors.light;
export type ThemeColorName = keyof ThemeColors;

/** Radios de borde. Base `--radius: 0.625rem` (10px) del sitio. */
export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  '2xl': 18,
  '3xl': 22,
  '4xl': 26,
  full: 9999,
} as const;

/** Espaciado en base 4. */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** Hit target mínimo recomendado por accesibilidad (Apple HIG / Material). */
export const minHitTarget = 44;

/**
 * Escala tipográfica móvil. `fontFamily` referencia los pesos de Manrope
 * cargados por `expo-font` en `_layout.tsx`; si la fuente no cargó todavía
 * (o faltan los .ttf en `assets/fonts/`), `theme-provider` degrada a la
 * fuente del sistema — ver ese archivo.
 */
export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Pesos de Manrope que debe haber en `assets/fonts/` (ver README ahí). */
export const fontWeightToFamily = {
  '400': 'Manrope_400Regular',
  '500': 'Manrope_500Medium',
  '600': 'Manrope_600SemiBold',
  '700': 'Manrope_700Bold',
  '800': 'Manrope_800ExtraBold',
} as const;

/**
 * Sombras. React Native no tiene `box-shadow`; se traduce a las props nativas
 * de iOS (`shadow*`) + `elevation` de Android. Los valores replican
 * intención "card" (sutil) y "sheet" (modal/hoja, más marcada) del sitio.
 */
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const tokens = {
  colors,
  radius,
  spacing,
  typography,
  shadows,
  minHitTarget,
  fontWeightToFamily,
} as const;

export default tokens;
