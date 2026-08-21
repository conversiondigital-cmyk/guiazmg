/**
 * Esqueleto con la MISMA forma que `BusinessCardItem` (título, subtítulo,
 * descripción de 2 líneas, pie con ubicación+rating) — no un spinner genérico.
 */
import { View } from 'react-native';

import { Card } from '@/ui/Card';
import { Skeleton } from '@/ui/Skeleton';
import { useTheme } from '@/theme/theme-provider';

export function BusinessCardSkeleton() {
  const theme = useTheme();

  return (
    <Card>
      <Skeleton width="70%" height={20} />
      <Skeleton width="40%" height={14} style={{ marginTop: theme.spacing[2] }} />
      <Skeleton width="100%" height={14} style={{ marginTop: theme.spacing[3] }} />
      <Skeleton width="85%" height={14} style={{ marginTop: theme.spacing[1] }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing[3] }}>
        <Skeleton width={100} height={12} />
        <Skeleton width={60} height={12} />
      </View>
    </Card>
  );
}
