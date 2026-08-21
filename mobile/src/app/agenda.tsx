/**
 * Agenda: eventos y promociones de la zona + citas con negocios. Antes era
 * pestaña de primer nivel; el dueño pidió que pase a ser una sección dentro
 * de Inicio (con enlace "Ver todo") y una pantalla de pila aquí. Sin backend
 * de citas/eventos todavía, así que es honesta: no hay nada que listar.
 */
import { useRouter } from 'expo-router';
import { ArrowLeft, CalendarClock } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';
import { EmptyState } from '@/ui/EmptyState';
import { Text } from '@/ui/Text';

export default function AgendaScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing[3], paddingTop: theme.spacing[2] }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Regresar"
          style={{ width: theme.minHitTarget, height: theme.minHitTarget, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={theme.colors.foreground} />
        </Pressable>
        <Text variant="h2" style={{ marginLeft: theme.spacing[1] }}>
          Agenda
        </Text>
      </View>

      <View style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[1] }}>
        <Text variant="body" color="mutedForeground">
          Eventos, promociones y citas con negocios de la ZMG.
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon={CalendarClock}
          title="Todavía no hay nada agendado"
          description="Cuando un negocio publique un evento, una promoción con fecha, o agendes una cita, va a aparecer aquí."
        />
      </View>
    </SafeAreaView>
  );
}
