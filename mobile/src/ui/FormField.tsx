/**
 * Campo de formulario base: etiqueta ARRIBA del input, texto de ayuda y error
 * DEBAJO (nunca el placeholder como etiqueta), anillo de foco visible, y
 * estado de error con borde + texto rojo. Todo lo que pida datos de sesión
 * (login, registro, recuperar contraseña) pasa por aquí.
 */
import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { Text } from './Text';

export type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
  helperText?: string;
};

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, error, helperText, style, ...rest },
  ref,
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.colors.destructive : focused ? theme.colors.ring : theme.colors.border;

  return (
    <View style={{ gap: theme.spacing[1] }}>
      <Text variant="label" color="foreground">
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityState={{ disabled: rest.editable === false }}
        placeholderTextColor={theme.colors.mutedForeground}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          {
            minHeight: theme.minHitTarget,
            borderRadius: theme.radius.md,
            borderWidth: focused || error ? 2 : 1,
            borderColor,
            paddingHorizontal: theme.spacing[4],
            fontSize: 16,
            color: theme.colors.foreground,
            backgroundColor: theme.colors.background,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="destructive" accessibilityRole="alert">
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color="mutedForeground">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});
