/**
 * Provee el sistema de diseño de Guía ZMG a toda la app vía contexto.
 *
 * Guía ZMG es SOLO modo claro (ver nota en `tokens.ts`), así que este
 * provider no lee `useColorScheme()` del sistema operativo: siempre resuelve
 * a `light`. El esquema queda como prop explícita (no como estado) para que
 * activar modo oscuro en el futuro sea flip de una constante, no una
 * reescritura.
 */
import { createContext, memo, useContext, useMemo, type PropsWithChildren } from 'react';

import {
  colors,
  fontWeightToFamily,
  minHitTarget,
  radius,
  shadows,
  spacing,
  typography,
  type ColorScheme,
  type ThemeColors,
} from './tokens';

/** Esquema activo de la app. Fijo en 'light' hasta que producto apruebe modo oscuro. */
const ACTIVE_SCHEME: ColorScheme = 'light';

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  radius: typeof radius;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: typeof shadows;
  minHitTarget: typeof minHitTarget;
  /** true una vez que `expo-font` terminó de cargar los pesos de Manrope. */
  fontsLoaded: boolean;
  /**
   * Familia de fuente Manrope para el peso pedido. Si las fuentes no cargaron
   * (faltan los .ttf en assets/fonts/, o SO lento) devuelve `undefined`: RN
   * cae en la fuente del sistema y respeta igual el `fontWeight` numérico
   * declarado en `typography`, así que el layout no rompe ni se ve "vacío".
   */
  fontFamily: (weight: keyof typeof fontWeightToFamily) => string | undefined;
};

function buildTheme(scheme: ColorScheme, fontsLoaded: boolean): Theme {
  return {
    scheme,
    colors: colors[scheme],
    radius,
    spacing,
    typography,
    shadows,
    minHitTarget,
    fontsLoaded,
    fontFamily: (weight) => (fontsLoaded ? fontWeightToFamily[weight] : undefined),
  };
}

const ThemeContext = createContext<Theme | null>(null);

type ThemeProviderProps = PropsWithChildren<{
  /** Resultado de `useFonts()` en `_layout.tsx`. Default `false` = usa fuente del sistema. */
  fontsLoaded?: boolean;
}>;

export const ThemeProvider = memo(function ThemeProvider({
  children,
  fontsLoaded = false,
}: ThemeProviderProps) {
  const theme = useMemo(() => buildTheme(ACTIVE_SCHEME, fontsLoaded), [fontsLoaded]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
});

/** Hook único para leer el sistema de diseño. Ningún componente hardcodea un hex. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme() debe usarse dentro de <ThemeProvider>. Revisa src/app/_layout.tsx.');
  }
  return theme;
}
