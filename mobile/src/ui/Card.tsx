/**
 * Contenedor "tarjeta principal" del sistema de diseño: radio `2xl` (24px).
 * Con fondo blanco puro sobre un fondo también blanco, la tarjeta SOLO se
 * distingue por el borde 1px + la sombra ambiental — nunca por tono. Los dos
 * van siempre juntos (la sombra es apoyo, no sustituto del borde, porque en
 * Android la `elevation` se ve distinta a la sombra de iOS).
 */
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

export type CardProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
  /** Sin padding interno (para listas de imagen a borde). Default: true. */
  padded?: boolean;
};

export function Card({ style, padded = true, children, ...rest }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius['2xl'],
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: padded ? theme.spacing[4] : 0,
        },
        theme.shadows.card,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}
