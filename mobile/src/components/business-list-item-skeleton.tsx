/**
 * Esqueleto con la forma exacta de `BusinessListItem` (imagen 96x96 + líneas
 * de texto + botones), para el estado de carga de Explorar.
 */
import { View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { Skeleton } from '@/ui/Skeleton';

export function BusinessListItemSkeleton() {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.spacing[3],
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing[3],
      }}>
      <Skeleton width={96} height={96} borderRadius={theme.radius.md} />
      <View style={{ flex: 1, gap: 6, justifyContent: 'center' }}>
        <Skeleton width="80%" height={16} />
        <Skeleton width="50%" height={12} />
        <Skeleton width="60%" height={12} />
        <Skeleton width="90%" height={32} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}
