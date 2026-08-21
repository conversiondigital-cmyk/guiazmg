/**
 * Marketplace: la sección ya existe en el sitio web (guiazmg.com/marketplace)
 * pero su API móvil todavía no está definida — no hay mock razonable que
 * simular sin inventar datos. El estado vacío es honesto: dice qué es y qué
 * falta, no aparenta una lista real.
 */
import { ShoppingBag } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';
import { EmptyState } from '@/ui/EmptyState';
import { Text } from '@/ui/Text';

export default function MarketplaceScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4] }}>
        <Text variant="h1">Marketplace</Text>
        <Text variant="body" color="mutedForeground" style={{ marginTop: theme.spacing[1] }}>
          Compra y vende entre vecinos de la ZMG
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon={ShoppingBag}
          title="El marketplace llega en la próxima fase"
          description="Esta pestaña se conectará al marketplace de guiazmg.com en cuanto su API móvil esté lista."
        />
      </View>
    </SafeAreaView>
  );
}
