/**
 * Perfil: sesión real (fase A2). Sin sesión: invitación con valor concreto +
 * botones Entrar/Crear cuenta (nunca un formulario de login pelado aquí
 * mismo). Con sesión: datos del usuario, Guardados, panel del dueño de
 * negocio (WebView con sesión compartida) y cerrar sesión (purga cookies del
 * WebView — si no, el panel de negocio queda "logueado" tras cerrar sesión).
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, ChevronRight, HelpCircle, Info, Store, User } from 'lucide-react-native';

import { useAuth } from '@/api/auth-context';
import { purgeWebViewCookies } from '@/components/site-web-view';
import { useTheme } from '@/theme/theme-provider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Text } from '@/ui/Text';

export default function PerfilScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await purgeWebViewCookies();
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <View style={{ flex: 1, paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[3], gap: theme.spacing[6] }}>
          <View style={{ gap: 2 }}>
            <Text variant="h1">Perfil</Text>
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing[4] }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.tintMint,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <User size={34} color={theme.colors.tintMintInk} strokeWidth={1.75} />
            </View>
            <Text variant="h2" style={{ textAlign: 'center' }}>
              Inicia sesión en Guía ZMG
            </Text>
            <Text variant="body" color="mutedForeground" style={{ textAlign: 'center', maxWidth: 320 }}>
              Guarda negocios, escribe reseñas y publica en el Marketplace.
            </Text>
            <View style={{ width: '100%', gap: theme.spacing[3], marginTop: theme.spacing[2] }}>
              <Button label="Entrar" onPress={() => router.push('/auth/login')} variant="primary" size="lg" fullWidth />
              <Button label="Crear cuenta" onPress={() => router.push('/auth/registro')} variant="outline" size="lg" fullWidth />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[3], gap: theme.spacing[6] }}>
        <View style={{ gap: 2 }}>
          <Text variant="h1">Perfil</Text>
        </View>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <User size={26} color={theme.colors.mutedForeground} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {user.name ?? user.email}
              </Text>
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>
          <Button
            label="Cerrar sesión"
            onPress={handleSignOut}
            loading={signingOut}
            variant="outline"
            size="md"
            fullWidth
            style={{ marginTop: theme.spacing[4] }}
          />
        </Card>

        <View style={{ gap: theme.spacing[1] }}>
          <Text variant="overline" color="mutedForeground" style={{ paddingHorizontal: theme.spacing[1] }}>
            Tu actividad
          </Text>
          <ProfileRow
            icon={Bookmark}
            label="Guardados"
            description="Negocios y publicaciones del marketplace que guardaste"
            onPress={() =>
              Alert.alert('Guardados próximamente', 'Todavía no puedes ver tu lista de guardados desde la app. Esta función llega en una próxima actualización.')
            }
          />
        </View>

        <View style={{ gap: theme.spacing[1] }}>
          <Text variant="overline" color="mutedForeground" style={{ paddingHorizontal: theme.spacing[1] }}>
            Para negocios
          </Text>
          <ProfileRow
            icon={Store}
            label={user.role === 'BUSINESS_OWNER' || user.role === 'ADMIN' ? 'Panel de mi negocio' : 'Publicar mi negocio'}
            description="Administra tu negocio o regístralo gratis"
            onPress={() => router.push({ pathname: '/webview', params: { path: '/dashboard', title: 'Mi negocio', authenticated: '1' } })}
          />
        </View>

        <View style={{ gap: theme.spacing[1] }}>
          <Text variant="overline" color="mutedForeground" style={{ paddingHorizontal: theme.spacing[1] }}>
            Guía ZMG
          </Text>
          <ProfileRow
            icon={Info}
            label="Acerca de Guía ZMG"
            onPress={() => router.push({ pathname: '/webview', params: { path: '/blog', title: 'Blog' } })}
          />
          <ProfileRow
            icon={HelpCircle}
            label="Ayuda y soporte"
            onPress={() => router.push({ pathname: '/webview', params: { path: '/terminos', title: 'Ayuda y soporte' } })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  description,
  onPress,
}: {
  icon: typeof Bookmark;
  label: string;
  description?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing[3],
          minHeight: theme.minHitTarget,
          paddingVertical: theme.spacing[2],
          paddingHorizontal: theme.spacing[1],
          borderRadius: theme.radius.md,
          backgroundColor: pressed ? theme.colors.muted : 'transparent',
        },
      ]}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon size={20} color={theme.colors.primaryDark} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        {description ? (
          <Text variant="caption" color="mutedForeground">
            {description}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={theme.colors.outline} />
    </Pressable>
  );
}
