/**
 * Barra de búsqueda "falsa" para Inicio: un `Pressable` con forma de input
 * que navega a Explorar con el teclado ya abierto (truco estándar — hace que
 * la búsqueda se sienta instantánea en vez de esperar a montar la pantalla
 * completa antes de poder escribir).
 */
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { Text } from '@/ui/Text';

export function SearchBarFake() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(tabs)/explorar', params: { autoFocus: '1' } })}
      accessibilityRole="button"
      accessibilityLabel="Buscar negocios"
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing[2],
          height: 48,
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.muted,
          paddingHorizontal: theme.spacing[4],
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Search size={18} color={theme.colors.mutedForeground} />
      <Text variant="body" color="mutedForeground">
        Busca negocios, giros o colonias...
      </Text>
    </Pressable>
  );
}
