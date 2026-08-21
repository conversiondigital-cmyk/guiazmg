/**
 * Inicio de sesión: correo + contraseña. Preserva la intención: si se llegó
 * aquí desde una acción que exigía sesión (`next` en los params), al iniciar
 * sesión regresa a esa misma pantalla en vez de al inicio — ver
 * `useRequireAuth` en `src/utils/require-auth.ts`.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import { ApiError, useAuth } from '@/api/auth-context';
import { useTheme } from '@/theme/theme-provider';
import { Button } from '@/ui/Button';
import { FormField } from '@/ui/FormField';
import { Text } from '@/ui/Text';

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return 'Correo o contraseña incorrectos.';
      case 'RATE_LIMITED':
        return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
      case 'ACCOUNT_DISABLED':
        return 'Esta cuenta está deshabilitada. Contacta a soporte.';
      case 'VALIDATION_ERROR':
        return 'Revisa tu correo y contraseña.';
      case 'NETWORK_ERROR':
        return 'No hay conexión a internet. Revisa tu red e intenta de nuevo.';
      default:
        return 'No pudimos iniciar sesión. Intenta de nuevo.';
    }
  }
  return 'No pudimos iniciar sesión. Intenta de nuevo.';
}

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ next?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  async function handleSubmit() {
    setFormError(null);
    const nextFieldErrors: typeof fieldErrors = {};
    if (!email.trim()) nextFieldErrors.email = 'Escribe tu correo.';
    if (!password) nextFieldErrors.password = 'Escribe tu contraseña.';
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      if (params.next) {
        router.replace(params.next as never);
      } else {
        router.replace('/(tabs)/perfil');
      }
    } catch (error) {
      setFormError(messageFor(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: theme.spacing[5], gap: theme.spacing[5] }} keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/perfil'))}
            accessibilityRole="button"
            accessibilityLabel="Regresar"
            style={{ width: 44, height: 44, justifyContent: 'center' }}>
            <ArrowLeft size={22} color={theme.colors.foreground} />
          </Pressable>

          <View style={{ gap: 4 }}>
            <Text variant="h1">Inicia sesión</Text>
            <Text variant="body" color="mutedForeground">
              Guarda negocios, escribe reseñas y publica en el Marketplace.
            </Text>
          </View>

          <View style={{ gap: theme.spacing[4] }}>
            <FormField
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              error={fieldErrors.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
            />
            <FormField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              error={fieldErrors.password}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {formError ? (
            <Text variant="body" color="destructive" accessibilityRole="alert">
              {formError}
            </Text>
          ) : null}

          <Button label="Entrar" onPress={handleSubmit} loading={submitting} variant="primary" size="lg" fullWidth />

          <Pressable onPress={() => router.push('/auth/recuperar')} accessibilityRole="button" accessibilityLabel="Recuperar contraseña" hitSlop={8}>
            <Text variant="label" color="primary" style={{ textAlign: 'center' }}>
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: theme.spacing[4] }}>
            <Text variant="body" color="mutedForeground">
              ¿Todavía no tienes cuenta?
            </Text>
            <Pressable onPress={() => router.push({ pathname: '/auth/registro', params: params.next ? { next: params.next } : undefined })} accessibilityRole="button" accessibilityLabel="Crear cuenta">
              <Text variant="bodyStrong" color="primary">
                Crear cuenta
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
