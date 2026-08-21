/**
 * Recuperar contraseña: pide correo, confirma envío. El backend responde
 * éxito genérico incluso si el correo no existe (evita enumeración de
 * cuentas) — por eso el mensaje de confirmación es siempre el mismo.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MailCheck } from 'lucide-react-native';

import { apiClient, ApiError } from '@/api/client';
import { useTheme } from '@/theme/theme-provider';
import { Button } from '@/ui/Button';
import { FormField } from '@/ui/FormField';
import { Text } from '@/ui/Text';

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'RATE_LIMITED') return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
    if (error.code === 'NETWORK_ERROR') return 'No hay conexión a internet. Revisa tu red e intenta de nuevo.';
  }
  return 'No pudimos procesar tu solicitud. Intenta de nuevo.';
}

export default function RecuperarScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email.trim()) {
      setError('Escribe tu correo.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: theme.spacing[5], gap: theme.spacing[5] }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Regresar" style={{ width: 44, height: 44, justifyContent: 'center' }}>
            <ArrowLeft size={22} color={theme.colors.foreground} />
          </Pressable>

          {sent ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing[3], paddingHorizontal: theme.spacing[4] }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.tintMint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <MailCheck size={30} color={theme.colors.tintMintInk} />
              </View>
              <Text variant="h2" style={{ textAlign: 'center' }}>
                Revisa tu correo
              </Text>
              <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
                Si {email.trim()} tiene una cuenta con nosotros, te enviamos instrucciones para recuperar tu contraseña.
              </Text>
              <Button label="Volver a iniciar sesión" onPress={() => router.replace('/auth/login')} variant="primary" size="lg" style={{ marginTop: theme.spacing[3] }} />
            </View>
          ) : (
            <>
              <View style={{ gap: 4 }}>
                <Text variant="h1">Recupera tu contraseña</Text>
                <Text variant="body" color="mutedForeground">
                  Escribe el correo con el que te registraste y te mandamos instrucciones.
                </Text>
              </View>

              <FormField
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                error={error ?? undefined}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <Button label="Enviar instrucciones" onPress={handleSubmit} loading={submitting} variant="primary" size="lg" fullWidth />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
