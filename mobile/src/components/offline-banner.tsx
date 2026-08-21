/**
 * Banner fijo arriba cuando no hay conexión real (`NetInfo`, no
 * `navigator.onLine`). Vive en el layout raíz: se ve en cualquier pantalla,
 * no solo en la que estaba activa cuando se cortó la red.
 */
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WifiOff } from 'lucide-react-native';

import { useTheme } from '@/theme/theme-provider';
import { Text } from '@/ui/Text';

export function OfflineBanner() {
  const theme = useTheme();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.foreground }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 }}>
        <WifiOff size={14} color="#ffffff" />
        <Text variant="caption" style={{ color: '#ffffff' }}>
          Sin conexión — mostrando lo último que se guardó
        </Text>
      </View>
    </SafeAreaView>
  );
}
