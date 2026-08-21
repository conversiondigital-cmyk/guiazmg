/**
 * Estado vacío honesto: icono + título + descripción que dice CÓMO llenarlo
 * + acción opcional. Nunca un "0" o un placeholder que aparente datos reales.
 */
import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from '@/theme/theme-provider';

export type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="text"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[6],
        paddingVertical: theme.spacing[8],
      }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.tintMint,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon size={28} color={theme.colors.tintMintInk} strokeWidth={1.75} />
      </View>
      <Text variant="h3" color="foreground" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="primary" size="md" />
      ) : null}
    </View>
  );
}
