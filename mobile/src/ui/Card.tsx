/**
 * Contenedor con la sombra "card" del sistema de diseño y radio `lg`.
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
          borderRadius: theme.radius.lg,
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
