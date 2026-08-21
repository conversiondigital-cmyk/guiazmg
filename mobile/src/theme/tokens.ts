/**
 * Tokens del sistema de diseño de Guía ZMG.
 *
 * Rediseño (referencia: `stitch/v1/.../patrimonio_local/DESIGN.md`, adaptado
 * con las decisiones del dueño de producto — ver historial de la tarea):
 * - Fondo BLANCO puro (`#FFFFFF`), nunca el verde pálido ni el pergamino del
 *   ejemplo. Las tarjetas se separan del fondo por BORDE 1px + sombra
 *   ambiental (nunca por tono, porque tarjeta y fondo son el mismo blanco).
 * - Verde de marca `#006c49` (el de guiazmg.com — NO el `#087A55` del
 *   ejemplo, para no desincronizar la app del sitio).
 * - Acento terracota `#E67E5D` / `#C05A3E` (profundo), SOLO en promociones,
 *   ofertas, "Patrocinado"/"Premium" y destacados locales. Reemplaza al
 *   ámbar `#D97706` que había — no se usa para nada más.
 * - Superficies "hundidas" (filas de menú, inputs, bloques de horario) usan
 *   gris NEUTRO `#F5F5F5`, nunca un tinte verde.
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
  green900: '#003527', // verde oscuro: cabeceras, énfasis, tarjetas institucionales
  green950: '#01231a',
} as const;

/**
 * Acento terracota (aprobado por el dueño — sustituye al ámbar `#D97706`).
 * `terracotta` es el tono de superficie para banners/badges/botones de
 * acento — SIEMPRE con texto/ícono carbón encima (`secondaryForeground`),
 * nunca blanco (ver nota de contraste más abajo). `terracottaDeep` es el
 * tono profundo, reservado para elementos NO textuales sobre terracota
 * (íconos de línea, bordes) donde el umbral AA es 3:1 y no 4.5:1.
 */
export const accent = {
  terracotta: '#E67E5D',
  terracottaDeep: '#C05A3E',
} as const;

/**
 * Hex "sueltos" que no tenían nombre de token, pero se usan lo bastante
 * seguido como para merecer uno aquí.
 */
export const extras = {
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
  primaryDark: brand.green900,

  secondary: accent.terracotta,
  secondaryDeep: accent.terracottaDeep,
  // CARBÓN, no blanco: se verificó el contraste con números — blanco sobre
  // `terracotta` (#E67E5D) da ~2.8:1 y sobre `terracottaDeep` (#C05A3E) da
  // ~4.4:1, ninguno llega al 4.5:1 de AA para texto normal. `foreground`
  // (#17221E) sobre `terracotta` da ~6:1 — pasa con margen. Por eso todo
  // texto/badge sobre terracota usa `secondaryForeground` (= foreground),
  // NUNCA blanco. Aplica al banner de promoción y al badge "Patrocinado".
  secondaryForeground: '#17221E',

  destructive: '#EF4444',
  success: '#22c55e',
  warning: '#f97316',
  /** Color de la estrella de calificación (distinto del acento terracota a propósito). */
  star: '#F59E0B',
  info: '#3b82f6',

  /** Scrims semitransparentes reutilizables (nunca un `rgba(...)` suelto en un componente). */
  overlayDark: 'rgba(23, 34, 30, 0.72)',
  overlayLight: 'rgba(255, 255, 255, 0.92)',

  background: '#ffffff',
  foreground: '#17221E',
  card: '#ffffff',
  /** Gris neutro para superficies "hundidas" (inputs, filas de menú, horarios). Nunca verde. */
  muted: '#F5F5F5',
  mutedForeground: '#3E4943',
  outline: '#6E7A72',
  border: '#E2E5E0',
  input: '#E2E5E0',
  accent: '#F5F5F5',
  accentForeground: '#17221E',
  ring: brand.green700,
  ...extras,
  ...accent,
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

/**
 * Radios de borde — escala "modern friendliness" (más redondeada que la
 * anterior, base 10px). `sm` para inputs, `lg` para botones, `2xl` para las
 * tarjetas principales de negocio/marketplace, `full` para chips píldora.
 */
// Corrección del dueño (brief v2): radios más contenidos que la propuesta
// original — tarjetas principales bajan de 24 a 20, botones de 16 a 14.
export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  '2xl': 20,
  full: 9999,
} as const;

/** Espaciado en base 4 (con margen lateral estándar de 20px — `spacing[5]`). */
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

/** Hit target mínimo. Subido de 44 a 48 (decisión del dueño). */
export const minHitTarget = 48;

/**
 * Escala tipográfica móvil (más grande y legible que la anterior). `fontFamily`
 * referencia los pesos de Manrope cargados por `expo-font` en `_layout.tsx`;
 * si la fuente no cargó todavía, `theme-provider` degrada a la fuente del
 * sistema — ver ese archivo.
 */
export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  bodyLg: { fontSize: 18, lineHeight: 28, fontWeight: '400' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  // Medium (no Bold) para mantener la UI ligera, tal como pide el sistema de referencia.
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.24,
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
 * de iOS (`shadow*`) + `elevation` de Android.
 *
 * `card`: elevación baja — tarjetas sobre el fondo blanco (van SIEMPRE
 * acompañadas de un borde 1px `border`, la sombra es apoyo, no el único
 * separador, porque en Android la `elevation` se ve distinta).
 * `high`: elevación alta — FAB y modales/hojas activas.
 * `sheet`: se mantiene para hojas inferiores (bottom sheet), más marcada hacia arriba.
 */
export const shadows = {
  card: {
    shadowColor: '#17221E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  high: {
    shadowColor: '#17221E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
  },
  sheet: {
    shadowColor: '#17221E',
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
