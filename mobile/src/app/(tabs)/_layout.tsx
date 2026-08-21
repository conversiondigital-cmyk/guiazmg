/**
 * Tab bar principal: 5 pestañas de primer nivel del producto —
 * Inicio · Explorar · Mapa · Marketplace · Perfil (el dueño pidió que el
 * Mapa tenga pestaña propia; Agenda pasó a ser una sección dentro de Inicio
 * con su propia pantalla de pila en `src/app/agenda.tsx`; "Cuenta" se
 * renombró a "Perfil" y ahora incluye Favoritos).
 * Iconos de `lucide-react-native` (mismo set en toda la app, un solo
 * lenguaje visual). Activo en el verde primario, inactivo en
 * `mutedForeground`, etiqueta Manrope 600 a 11px — igual que la escala
 * `caption`/`overline` del tema pero fijada a 11px porque una tab bar no
 * debe crecer con la escala general.
 */
import { Tabs } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { Compass, Home, Map, ShoppingBag, User } from 'lucide-react-native';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * `tabBarIcon` entrega `color: ColorValue`, no `string`: React Native admite
 * colores opacos de plataforma (`OpaqueColorValue`, p. ej. `PlatformColor`)
 * además de los hex normales. Lucide solo acepta `string`, así que se
 * normaliza aquí. Los nuestros salen del tema y siempre son hex, pero declarar
 * el parámetro como `string` haría que la firma no encaje con la de expo-router.
 */
function tabIcon(Icon: LucideIcon) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Icon color={String(color)} size={size} strokeWidth={2} />
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
        // Hit target >= 48 también en la tab bar, no solo en botones sueltos.
        tabBarItemStyle: { minHeight: theme.minHitTarget },
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
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: tabIcon(Map),
          tabBarAccessibilityLabel: 'Mapa de negocios',
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
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: tabIcon(User),
          tabBarAccessibilityLabel: 'Tu perfil',
        }}
      />
    </Tabs>
  );
}
