/**
 * Botón base de Guía ZMG. Variantes semánticas + tamaños + estado de carga
 * con spinner DENTRO del propio botón (nunca un spinner de página completa
 * para una acción de botón). Hit target mínimo 44x44 siempre, aunque el
 * tamaño visual sea `sm`.
 */
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from './Text';
import { useTheme } from '@/theme/theme-provider';
import type { ThemeColorName } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Solo si el label visible no basta para describir la acción a un lector de pantalla. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  testID?: string;
};

const SIZE_HEIGHT: Record<ButtonSize, number> = { sm: 44, md: 48, lg: 56 };
const SIZE_PADDING_X: Record<ButtonSize, number> = { sm: 14, md: 18, lg: 22 };
const SIZE_FONT_VARIANT: Record<ButtonSize, 'caption' | 'bodyStrong' | 'h3'> = {
  sm: 'caption',
  md: 'bodyStrong',
  lg: 'h3',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  fullWidth = false,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const { backgroundColor, borderColor, textColor, pressedOverlay } = useMemo(
    () => resolveVariantColors(variant, theme.colors),
    [variant, theme.colors],
  );

  return (
    <Pressable
      testID={testID}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={size === 'sm' ? 6 : 0}
      style={({ pressed }) => [
        styles.base,
        {
          height: SIZE_HEIGHT[size],
          paddingHorizontal: SIZE_PADDING_X[size],
          backgroundColor,
          borderColor,
          borderWidth: borderColor ? 1 : 0,
          borderRadius: theme.radius.md,
          opacity: isDisabled && !loading ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        pressed && !isDisabled ? { backgroundColor: pressedOverlay } : null,
        style,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={textColor}
            accessibilityLabel="Cargando"
            style={styles.spinner}
          />
        ) : null}
        <Text
          variant={SIZE_FONT_VARIANT[size]}
          style={{ color: textColor, fontWeight: '700' }}
          numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function resolveVariantColors(variant: ButtonVariant, colors: Record<ThemeColorName, string>) {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: colors.primary,
        borderColor: undefined,
        textColor: colors.primaryForeground,
        pressedOverlay: colors.primaryPressed,
      };
    case 'secondary':
      return {
        backgroundColor: colors.secondary,
        borderColor: undefined,
        textColor: colors.secondaryForeground,
        pressedOverlay: colors.secondary,
      };
    case 'destructive':
      return {
        backgroundColor: colors.destructive,
        borderColor: undefined,
        textColor: '#ffffff',
        pressedOverlay: colors.destructive,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderColor: colors.border,
        textColor: colors.primary,
        pressedOverlay: colors.muted,
      };
    case 'ghost':
    default:
      return {
        backgroundColor: 'transparent',
        borderColor: undefined,
        textColor: colors.primary,
        pressedOverlay: colors.muted,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    marginRight: 2,
  },
});
