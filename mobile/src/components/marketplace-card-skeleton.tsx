import { View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { Skeleton } from '@/ui/Skeleton';

export function MarketplaceCardSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, borderRadius: theme.radius['2xl'], borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' }}>
      <Skeleton width="100%" height={140} borderRadius={0} />
      <View style={{ padding: theme.spacing[2], gap: 6 }}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="90%" height={12} />
        <Skeleton width="50%" height={12} />
      </View>
    </View>
  );
}
