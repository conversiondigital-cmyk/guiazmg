/**
 * Texto tipado sobre la escala de `theme/tokens.ts`. Ningún componente de la
 * app debe usar `<Text>` de react-native directo con estilos sueltos: pasa
 * por aquí para heredar tipografía + color consistentes.
 */
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import type { ThemeColorName } from '@/theme/tokens';
import type { TypographyVariant } from '@/theme/tokens';

export type TextVariant = TypographyVariant;

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  /** Nombre de color semántico del tema. Default: `foreground`. */
  color?: ThemeColorName;
};

const WEIGHT_BY_VARIANT: Record<TextVariant, '400' | '500' | '600' | '700' | '800'> = {
  display: '800',
  h1: '700',
  h2: '700',
  h3: '600',
  body: '400',
  bodyStrong: '600',
  caption: '500',
  overline: '700',
};

export function Text({ variant = 'body', color = 'foreground', style, ...rest }: TextProps) {
  const theme = useTheme();
  const scale = theme.typography[variant];
  const weight = WEIGHT_BY_VARIANT[variant];
  const fontFamily = theme.fontFamily(weight);

  return (
    <RNText
      style={[
        {
          fontSize: scale.fontSize,
          lineHeight: scale.lineHeight,
          fontWeight: scale.fontWeight,
          color: theme.colors[color],
          fontFamily,
          ...('letterSpacing' in scale ? { letterSpacing: scale.letterSpacing } : null),
          ...('textTransform' in scale ? { textTransform: scale.textTransform } : null),
        },
        style,
      ]}
      {...rest}
    />
  );
}
