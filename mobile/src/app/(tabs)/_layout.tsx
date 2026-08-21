/**
 * Tab bar principal: 5 pestañas de primer nivel del producto. Iconos de
 * `lucide-react-native` (mismo set en toda la app, un solo lenguaje visual).
 * Activo en el verde primario, inactivo en `mutedForeground`, etiqueta
 * Manrope 600 a 11px — igual que la escala `caption`/`overline` del tema
 * pero fijada a 11px porque una tab bar no debe crecer con la escala general.
 */
import { Tabs } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { Calendar, Compass, Home, ShoppingBag, User } from 'lucide-react-native';

import { useTheme } from '@/theme/theme-provider';

function tabIcon(Icon: LucideIcon) {
  return ({ color, size }: { color: string; size: number }) => (
    <Icon color={color} size={size} strokeWidth={2} />
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fontFamily('600'),
          fontWeight: '600',
          fontSize: 11,
        },
        // Hit target >= 44 también en la tab bar, no solo en botones sueltos.
        tabBarItemStyle: { minHeight: 44 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: tabIcon(Home),
          tabBarAccessibilityLabel: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="explorar"
        options={{
          title: 'Explorar',
          tabBarIcon: tabIcon(Compass),
          tabBarAccessibilityLabel: 'Explorar negocios',
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: tabIcon(ShoppingBag),
          tabBarAccessibilityLabel: 'Marketplace',
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: tabIcon(Calendar),
          tabBarAccessibilityLabel: 'Agenda de citas',
        }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{
          title: 'Cuenta',
          tabBarIcon: tabIcon(User),
          tabBarAccessibilityLabel: 'Tu cuenta',
        }}
      />
    </Tabs>
  );
}
