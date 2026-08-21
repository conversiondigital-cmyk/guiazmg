/**
 * Chip de filtro/categoría. Estado activo en el verde primario (#006c49);
 * contraste del texto verificado contra ambos fondos (activo e inactivo).
 */
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { useTheme } from '@/theme/theme-provider';

export type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Chip({ label, active = false, onPress, disabled = false, style, testID }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      style={({ pressed }) => [
        {
          minHeight: theme.minHitTarget,
          paddingHorizontal: theme.spacing[4],
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: active ? theme.colors.primary : theme.colors.border,
          backgroundColor: active ? theme.colors.primary : theme.colors.background,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <Text
        variant="caption"
        style={{ color: active ? theme.colors.primaryForeground : theme.colors.mutedForeground, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}
