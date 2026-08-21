/**
 * Registro: nombre, correo, contraseña + las TRES casillas de consentimiento
 * que la API exige de forma obligatoria (términos, privacidad, normas de
 * comunidad) — ver `POST /auth/register` en el backend, que rechaza la
 * petición si falta cualquiera de las tres fechas. Nunca premarcadas ni
 * escondidas: es consentimiento legal, no un trámite a saltarse.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';

import { ApiError, useAuth } from '@/api/auth-context';
import { useTheme } from '@/theme/theme-provider';
import { Button } from '@/ui/Button';
import { FormField } from '@/ui/FormField';
import { Text } from '@/ui/Text';

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'CONFLICT':
        return 'Ese correo ya tiene una cuenta. Intenta iniciar sesión.';
      case 'RATE_LIMITED':
        return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
      case 'VALIDATION_ERROR':
        return 'Revisa los datos del formulario.';
      case 'NETWORK_ERROR':
        return 'No hay conexión a internet. Revisa tu red e intenta de nuevo.';
      default:
        return 'No pudimos crear tu cuenta. Intenta de nuevo.';
    }
  }
  return 'No pudimos crear tu cuenta. Intenta de nuevo.';
}

export default function RegistroScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();
  const params = useLocalSearchParams<{ next?: string }>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedCommunity, setAcceptedCommunity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string; consent?: string }>({});

  async function handleSubmit() {
    setFormError(null);
    const nextFieldErrors: typeof fieldErrors = {};
    if (name.trim().length < 2) nextFieldErrors.name = 'Escribe tu nombre completo.';
    if (!email.trim()) nextFieldErrors.email = 'Escribe tu correo.';
    if (password.length < 8) nextFieldErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (!acceptedTerms || !acceptedPrivacy || !acceptedCommunity) {
      nextFieldErrors.consent = 'Debes aceptar los tres para continuar.';
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      await signUp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
        acceptedCommunityAt: now,
      });
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
            <Text variant="h1">Crea tu cuenta</Text>
            <Text variant="body" color="mutedForeground">
              Es gratis y toma menos de un minuto.
            </Text>
          </View>

          <View style={{ gap: theme.spacing[4] }}>
            <FormField label="Nombre completo" value={name} onChangeText={setName} error={fieldErrors.name} autoComplete="name" returnKeyType="next" />
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
              helperText={fieldErrors.password ? undefined : 'Al menos 8 caracteres.'}
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="done"
            />
          </View>

          <View style={{ gap: theme.spacing[3] }}>
            <ConsentCheckbox
              checked={acceptedTerms}
              onToggle={() => setAcceptedTerms((v) => !v)}
              label="Acepto los Términos y condiciones de Guía ZMG"
            />
            <ConsentCheckbox
              checked={acceptedPrivacy}
              onToggle={() => setAcceptedPrivacy((v) => !v)}
              label="Acepto el Aviso de privacidad"
            />
            <ConsentCheckbox
              checked={acceptedCommunity}
              onToggle={() => setAcceptedCommunity((v) => !v)}
              label="Acepto las Normas de la comunidad"
            />
            {fieldErrors.consent ? (
              <Text variant="caption" color="destructive" accessibilityRole="alert">
                {fieldErrors.consent}
              </Text>
            ) : null}
          </View>

          {formError ? (
            <Text variant="body" color="destructive" accessibilityRole="alert">
              {formError}
            </Text>
          ) : null}

          <Button label="Crear cuenta" onPress={handleSubmit} loading={submitting} variant="primary" size="lg" fullWidth />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: theme.spacing[2] }}>
            <Text variant="body" color="mutedForeground">
              ¿Ya tienes cuenta?
            </Text>
            <Pressable onPress={() => router.replace({ pathname: '/auth/login', params: params.next ? { next: params.next } : undefined })} accessibilityRole="button" accessibilityLabel="Iniciar sesión">
              <Text variant="bodyStrong" color="primary">
                Inicia sesión
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ConsentCheckbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[3], minHeight: theme.minHitTarget }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: theme.radius.sm,
          borderWidth: 2,
          borderColor: checked ? theme.colors.primary : theme.colors.outline,
          backgroundColor: checked ? theme.colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}>
        {checked ? <Check size={14} color={theme.colors.primaryForeground} strokeWidth={3} /> : null}
      </View>
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}
