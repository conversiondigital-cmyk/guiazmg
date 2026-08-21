/**
 * Inicio: cabecera + chip de ubicación + búsqueda falsa + categorías +
 * destacado de la zona + "Cerca de ti" + "Negocios destacados" (patrocinado)
 * + Agenda (vista previa) + "Descubre tu zona" (mapa) + CTA de registro.
 * Cada sección usa su PROPIA query, así que si una falla las demás se
 * siguen pintando (nunca una sola falla tumba la pantalla).
 */
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, LocateFixed, MapPin as MapPinIcon, User } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useBusinesses, useCategories, useMunicipalities, type HomeResponse } from '@/api/queries';
import type { BusinessCard, Category } from '@/api/types';
import { CategoryCarousel } from '@/components/category-carousel';
import { MapPreviewCard } from '@/components/map-preview-card';
import { NearMeCard } from '@/components/near-me-card';
import { PromoBanner } from '@/components/promo-banner';
import { SponsoredBusinessCard } from '@/components/sponsored-business-card';
import { SearchBarFake } from '@/components/search-bar-fake';
import { LocationPermissionModal } from '@/location/location-permission-modal';
import { useNearMe } from '@/location/use-near-me';
import { useTheme } from '@/theme/theme-provider';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Skeleton } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';
import { distanceKm as computeDistanceKm } from '@/utils/format';

/** Barrio por defecto mostrado en el chip de ubicación antes de que el usuario comparta la suya:
 * Zona Real (Zapopan norte) es uno de los barrios objetivo reales de la fase 1 del producto. */
const DEFAULT_LOCATION_LABEL = 'Zona Real, Zapopan';

function useFeaturedBusinesses() {
  return useQuery({
    queryKey: ['home-featured'],
    queryFn: () => apiClient.get<HomeResponse>('/home'),
    select: (data) => data.featured,
  });
}

export default function InicioScreen() {
  const theme = useTheme();
  const router = useRouter();
  const nearMe = useNearMe();

  const categoriesQuery = useCategories();
  const municipalitiesQuery = useMunicipalities();
  const featuredQuery = useFeaturedBusinesses();
  const nearbyQuery = useBusinesses();

  const nearbyBusinesses = useMemo(() => {
    const items = nearbyQuery.data ?? [];
    if (!nearMe.coords) return items.slice(0, 3);
    const withCoords = items.filter((b) => b.lat != null && b.lng != null);
    const sorted = [...withCoords].sort(
      (a, b) =>
        computeDistanceKm(nearMe.coords!, { latitude: a.lat as number, longitude: a.lng as number }) -
        computeDistanceKm(nearMe.coords!, { latitude: b.lat as number, longitude: b.lng as number }),
    );
    return sorted.slice(0, 3);
  }, [nearbyQuery.data, nearMe.coords]);

  const promoBusiness = featuredQuery.data?.[0];
  const sponsoredBusinesses = featuredQuery.data?.slice(1) ?? [];

  function goToCategory(category: Category) {
    router.push({ pathname: '/(tabs)/explorar', params: { category: category.slug } });
  }

  function goToBusiness(business: BusinessCard) {
    router.push({ pathname: '/negocio/[slug]', params: { slug: business.slug } });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing[10], gap: theme.spacing[6] }}>
        {/* Cabecera: logo + avatar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing[5],
            paddingTop: theme.spacing[3],
          }}>
          <Text variant="h2" color="primaryDark">
            Guía ZMG
          </Text>
          <Pressable
            onPress={() => router.push('/perfil')}
            accessibilityRole="button"
            accessibilityLabel="Ir a tu perfil"
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <User size={20} color={theme.colors.primaryDark} strokeWidth={1.75} />
          </Pressable>
        </View>

        {/* Chip de ubicación */}
        <View style={{ paddingHorizontal: theme.spacing[5], flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
          <Pressable
            onPress={() => Alert.alert('Elegir zona', 'Esta selección llega en una próxima actualización.')}
            accessibilityRole="button"
            accessibilityLabel="Cambiar zona"
            style={{ flex: 1, gap: 2 }}>
            <Text variant="caption" color="mutedForeground">
              Ubicación actual
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPinIcon size={16} color={theme.colors.primaryDark} />
              <Text variant="bodyStrong" numberOfLines={1}>
                {nearMe.coords ? 'Tu ubicación actual' : DEFAULT_LOCATION_LABEL}
              </Text>
              <ChevronRight size={16} color={theme.colors.mutedForeground} />
            </View>
          </Pressable>
          <Pressable
            onPress={nearMe.requestNearMe}
            accessibilityRole="button"
            accessibilityLabel="Usar mi ubicación actual"
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radius.full,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <LocateFixed size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: theme.spacing[5] }}>
          <SearchBarFake />
        </View>

        {/* Categorías */}
        <Section title="Categorías" noPaddingChildren>
          {categoriesQuery.isLoading ? (
            <View style={{ flexDirection: 'row', gap: theme.spacing[3], paddingHorizontal: theme.spacing[5] }}>
              {[1, 2, 3, 4].map((key) => (
                <Skeleton key={key} width={56} height={56} borderRadius={theme.radius.full} />
              ))}
            </View>
          ) : categoriesQuery.isError ? (
            <InlineSectionError onRetry={categoriesQuery.refetch} />
          ) : (
            <CategoryCarousel
              categories={categoriesQuery.data ?? []}
              onPressCategory={goToCategory}
              onPressOfertas={() => router.push('/(tabs)/explorar')}
            />
          )}
        </Section>

        {/* Destacado de la zona */}
        {featuredQuery.isLoading ? (
          <View style={{ paddingHorizontal: theme.spacing[5] }}>
            <Skeleton width="100%" height={152} borderRadius={theme.radius['2xl']} />
          </View>
        ) : promoBusiness ? (
          <View style={{ paddingHorizontal: theme.spacing[5] }}>
            <PromoBanner business={promoBusiness} onPress={() => goToBusiness(promoBusiness)} />
          </View>
        ) : null}

        {/* Cerca de ti */}
        <Section
          title="Cerca de ti"
          action={{ label: 'Ver mapa', onPress: () => router.push('/mapa') }}>
          {!nearMe.coords && !nearMe.deniedBefore ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                padding: theme.spacing[3],
                marginBottom: theme.spacing[3],
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[3],
              }}>
              <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                Activa tu ubicación para ordenar por cercanía real.
              </Text>
              <Button label="Activar" size="sm" variant="outline" loading={nearMe.loading} onPress={nearMe.requestNearMe} />
            </View>
          ) : null}

          {nearbyQuery.isLoading ? (
            <View style={{ gap: theme.spacing[3] }}>
              {[1, 2, 3].map((key) => (
                <Skeleton key={key} width="100%" height={96} borderRadius={theme.radius['2xl']} />
              ))}
            </View>
          ) : nearbyQuery.isError ? (
            <ErrorState message="No pudimos cargar negocios cercanos." onRetry={nearbyQuery.refetch} />
          ) : nearbyBusinesses.length === 0 ? (
            <EmptyState
              title="Todavía no hay negocios registrados aquí"
              description="En cuanto se registre uno cerca, va a aparecer en esta sección."
              actionLabel="Explorar el directorio"
              onAction={() => router.push('/(tabs)/explorar')}
            />
          ) : (
            <View style={{ gap: theme.spacing[3] }}>
              {nearbyBusinesses.map((business) => (
                <NearMeCard
                  key={business.id}
                  business={business}
                  userLocation={nearMe.coords}
                  onPress={() => goToBusiness(business)}
                />
              ))}
            </View>
          )}
        </Section>

        {/* Negocios destacados (patrocinado) */}
        <Section
          title="Negocios destacados"
          noPaddingChildren
          action={{ label: 'Ver todos', onPress: () => router.push('/(tabs)/explorar') }}>
          {featuredQuery.isLoading ? (
            <View style={{ flexDirection: 'row', gap: theme.spacing[3], paddingHorizontal: theme.spacing[5] }}>
              <Skeleton width={240} height={220} borderRadius={theme.radius['2xl']} />
              <Skeleton width={240} height={220} borderRadius={theme.radius['2xl']} />
            </View>
          ) : featuredQuery.isError ? (
            <InlineSectionError onRetry={featuredQuery.refetch} />
          ) : sponsoredBusinesses.length === 0 ? (
            <View style={{ paddingHorizontal: theme.spacing[5] }}>
              <EmptyState
                title="Todavía no hay negocios destacados"
                description="En cuanto un negocio de tu zona se registre y verifique, va a aparecer aquí."
                actionLabel="Explorar el directorio"
                onAction={() => router.push('/(tabs)/explorar')}
              />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.spacing[3], paddingHorizontal: theme.spacing[5] }}>
              {sponsoredBusinesses.map((business) => (
                <SponsoredBusinessCard key={business.id} business={business} onPress={() => goToBusiness(business)} />
              ))}
            </ScrollView>
          )}
        </Section>

        {/* Agenda (vista previa) */}
        <Section title="Agenda" action={{ label: 'Ver todo', onPress: () => router.push('/agenda') }}>
          <Pressable
            onPress={() => router.push('/agenda')}
            accessibilityRole="button"
            accessibilityLabel="Ver agenda de eventos y promociones"
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[3],
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius['2xl'],
                padding: theme.spacing[4],
                opacity: pressed ? 0.92 : 1,
              },
              theme.shadows.card,
            ]}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Calendar size={22} color={theme.colors.primaryDark} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Eventos y promociones de la zona</Text>
              <Text variant="caption" color="mutedForeground">
                Todavía no hay nada agendado
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.outline} />
          </Pressable>
        </Section>

        {/* Descubre tu zona */}
        <Section title="Descubre tu zona">
          <MapPreviewCard businessCount={nearbyQuery.data ? nearbyQuery.data.length : null} />
        </Section>

        {/* Zonas */}
        <Section title="Explora por zona">
          {municipalitiesQuery.isLoading ? (
            <View style={{ flexDirection: 'row', gap: theme.spacing[2], flexWrap: 'wrap' }}>
              {[1, 2, 3].map((key) => (
                <Skeleton key={key} width={110} height={40} borderRadius={theme.radius.md} />
              ))}
            </View>
          ) : municipalitiesQuery.isError ? (
            <InlineSectionError onRetry={municipalitiesQuery.refetch} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
              {(municipalitiesQuery.data ?? []).map((municipality) => (
                <Pressable
                  key={municipality.slug}
                  onPress={() => router.push({ pathname: '/(tabs)/explorar', params: { municipality: municipality.slug } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Explorar negocios en ${municipality.name}`}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[2],
                      minHeight: theme.minHitTarget,
                      justifyContent: 'center',
                      borderRadius: theme.radius.full,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}>
                  <Text variant="bodyStrong">{municipality.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Section>

        {/* CTA registro de negocio */}
        <View style={{ paddingHorizontal: theme.spacing[5] }}>
          <View
            style={{
              borderRadius: theme.radius['2xl'],
              backgroundColor: theme.colors.primaryDark,
              padding: theme.spacing[5],
              gap: theme.spacing[2],
            }}>
            <Text variant="h2" style={{ color: '#ffffff' }}>
              ¿Tienes un negocio en la ZMG?
            </Text>
            <Text variant="body" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Regístralo gratis en Guía ZMG y llega a más clientes de tu zona.
            </Text>
            <Button
              label="Registrar mi negocio"
              variant="inverse"
              size="md"
              onPress={() => router.push('/perfil')}
              style={{ marginTop: theme.spacing[2], alignSelf: 'flex-start' }}
            />
          </View>
        </View>
      </ScrollView>

      <LocationPermissionModal visible={nearMe.modalVisible} onConfirm={nearMe.confirmModal} onDismiss={nearMe.dismissModal} />
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  action,
  noPaddingChildren = false,
}: {
  title: string;
  children: React.ReactNode;
  action?: { label: string; onPress: () => void };
  /** El contenido maneja su propio padding horizontal (p.ej. un ScrollView horizontal). */
  noPaddingChildren?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing[3] }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing[5],
        }}>
        <Text variant="h2">{title}</Text>
        {action ? (
          <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label} hitSlop={8}>
            <Text variant="label" color="primary">
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {noPaddingChildren ? children : <View style={{ paddingHorizontal: theme.spacing[5] }}>{children}</View>}
    </View>
  );
}

function InlineSectionError({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: theme.spacing[5] }}>
      <ErrorState message="No pudimos cargar esta sección." onRetry={onRetry} />
    </View>
  );
}
