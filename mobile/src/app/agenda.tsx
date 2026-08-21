/**
 * Agenda: reservar citas con negocios (servicios con horario). Feature de
 * fase posterior; sin backend de citas todavía no hay nada real que listar.
 */
import { CalendarClock } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';
import { EmptyState } from '@/ui/EmptyState';
import { Text } from '@/ui/Text';

export default function AgendaScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4] }}>
        <Text variant="h1">Agenda</Text>
        <Text variant="body" color="mutedForeground" style={{ marginTop: theme.spacing[1] }}>
          Tus citas con negocios de la ZMG
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon={CalendarClock}
          title="Todavía no tienes citas"
          description="Cuando agendes con un negocio que ofrezca citas, va a aparecer aquí con fecha, hora y recordatorio."
        />
      </View>
    </SafeAreaView>
  );
}
