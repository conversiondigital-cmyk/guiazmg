/**
 * Estado de error contextual: mensaje humano (nunca el mensaje crudo del
 * servidor/excepción) + botón Reintentar. Vive inline en la vista que falló,
 * no como modal bloqueante.
 */
import { CircleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from '@/theme/theme-provider';

export type ErrorStateProps = {
  /** Mensaje humano ya traducido; no pasar `error.message` crudo aquí. */
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
};

const DEFAULT_MESSAGE = 'Algo no salió bien. Puede ser tu conexión o un problema de nuestro lado.';

export function ErrorState({ message = DEFAULT_MESSAGE, onRetry, retrying = false }: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[6],
        paddingVertical: theme.spacing[8],
      }}>
      <CircleAlert size={40} color={theme.colors.destructive} strokeWidth={1.75} />
      <Text variant="body" color="foreground" style={{ textAlign: 'center' }}>
        {message}
      </Text>
      {onRetry ? (
        <Button label="Reintentar" onPress={onRetry} variant="outline" size="md" loading={retrying} />
      ) : null}
    </View>
  );
}
