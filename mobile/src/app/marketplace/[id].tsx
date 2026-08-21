/**
 * Ficha de publicación del marketplace: galería, precio grande, vendedor,
 * descripción, consejos de seguridad plegables, similares, y barra fija
 * abajo con WhatsApp y Llamar (con telemetría). `GET /marketplace/:id` solo
 * responde para publicaciones ACTIVAS (un anuncio vendido/expirado ya
 * responde `NOT_FOUND`), así que no hay un estado "vendido/expirado" que
 * degradar aquí — si la ficha carga, está disponible.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ShieldAlert } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trackEvent } from '@/api/analytics';
import { useMarketplaceListingDetail, useMarketplaceListings } from '@/api/queries';
import { MarketplaceCard } from '@/components/marketplace-card';
import { useTheme } from '@/theme/theme-provider';
import { callPhone, openWhatsapp } from '@/utils/contact-actions';
import { formatMXN, formatRelativeTime } from '@/utils/format';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Skeleton } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SAFETY_TIPS = [
  'Prefiere encontrarte en un lugar público y a la luz del día.',
  'Revisa el producto en persona antes de pagar.',
  'Nunca hagas transferencias por adelantado sin ver el artículo.',
  'Si algo se siente mal, no continúes con la operación.',
];

export default function MarketplaceDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const detailQuery = useMarketplaceListingDetail(id ?? '');
  const [showSafetyTips, setShowSafetyTips] = useState(false);

  useEffect(() => {
    if (detailQuery.data) {
      void trackEvent('LISTING_VIEW', { listingId: detailQuery.data.id });
    }
  }, [detailQuery.data]);

  if (detailQuery.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <Skeleton width="100%" height={280} borderRadius={0} />
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[3] }}>
          <Skeleton width="50%" height={28} />
          <Skeleton width="80%" height={18} />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <View style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[3] }}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Regresar" style={{ width: 44, height: 44, justifyContent: 'center' }}>
            <ArrowLeft size={22} color={theme.colors.foreground} />
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            title="Esta publicación ya no está disponible"
            description="Puede que se haya vendido, eliminado, o que el enlace esté equivocado."
            actionLabel="Ver otras publicaciones"
            onAction={() => router.push('/(tabs)/marketplace')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const listing = detailQuery.data;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 280, backgroundColor: theme.colors.muted }}>
          {listing.images.length > 0 ? (
            <FlatList
              data={listing.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => String(index)}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width: SCREEN_WIDTH, height: 280, backgroundColor: theme.colors.muted }}
                  accessibilityIgnoresInvertColors
                  accessibilityLabel={`Foto de ${listing.title}`}
                />
              )}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="display" style={{ opacity: 0.4 }}>
                {listing.category?.icon ?? '📦'}
              </Text>
            </View>
          )}

          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0 }}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Regresar"
              style={{ width: 40, height: 40, borderRadius: theme.radius.full, backgroundColor: theme.colors.overlayLight, alignItems: 'center', justifyContent: 'center', margin: theme.spacing[3] }}>
              <ArrowLeft size={20} color={theme.colors.foreground} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
          <View style={{ gap: 4 }}>
            <Text variant="display">{listing.price !== null ? formatMXN(listing.price) : 'Precio a convenir'}</Text>
            <Text variant="h2">{listing.title}</Text>
            <Text variant="caption" color="mutedForeground">
              {listing.municipality?.name ?? 'ZMG'} · {formatRelativeTime(listing.createdAt)}
            </Text>
          </View>

          {listing.seller ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], padding: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg }}>
              <View style={{ width: 44, height: 44, borderRadius: theme.radius.full, backgroundColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="bodyStrong">{(listing.seller.name ?? '?').charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{listing.seller.name ?? 'Vendedor de Guía ZMG'}</Text>
                <Text variant="caption" color="mutedForeground">
                  Publica en Guía ZMG
                </Text>
              </View>
            </View>
          ) : null}

          {listing.description ? (
            <View style={{ gap: theme.spacing[2] }}>
              <Text variant="h2">Descripción</Text>
              <Text variant="body" color="mutedForeground">
                {listing.description}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => setShowSafetyTips((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Consejos de seguridad"
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing[2] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} color={theme.colors.warning} />
              <Text variant="bodyStrong">Consejos de seguridad</Text>
            </View>
            <ChevronDown
              size={18}
              color={theme.colors.mutedForeground}
              style={{ transform: [{ rotate: showSafetyTips ? '180deg' : '0deg' }] }}
            />
          </Pressable>
          {showSafetyTips ? (
            <View style={{ gap: 6 }}>
              {SAFETY_TIPS.map((tip) => (
                <Text key={tip} variant="caption" color="mutedForeground">
                  • {tip}
                </Text>
              ))}
            </View>
          ) : null}

          <SimilarListings categorySlug={listing.category?.slug} excludeId={listing.id} />
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing[2], padding: theme.spacing[3] }}>
          <Button
            label="Llamar"
            variant="outline"
            size="lg"
            fullWidth
            style={{ flex: 1 }}
            disabled={!listing.phone}
            onPress={() => listing.phone && callPhone(listing.phone, 'PHONE_CLICK', { listingId: listing.id })}
          />
          <Button
            label="WhatsApp"
            variant="primary"
            size="lg"
            fullWidth
            style={{ flex: 1.2 }}
            disabled={!listing.whatsapp}
            onPress={() =>
              listing.whatsapp &&
              openWhatsapp(listing.whatsapp, `Hola, me interesa "${listing.title}" que vi en Guía ZMG.`, 'WHATSAPP_CLICK', {
                listingId: listing.id,
              })
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Publicaciones de la misma categoría (el detalle real no trae `similar` embebido — se arma con `/marketplace` filtrado, igual que "negocios similares" en la ficha de negocio). */
function SimilarListings({ categorySlug, excludeId }: { categorySlug?: string; excludeId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const listingsQuery = useMarketplaceListings({ category: categorySlug });

  const similar = useMemo(
    () => (listingsQuery.data?.pages[0]?.data ?? []).filter((l) => l.id !== excludeId).slice(0, 4),
    [listingsQuery.data, excludeId],
  );

  if (!categorySlug || listingsQuery.isLoading || listingsQuery.isError || similar.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing[3] }}>
      <Text variant="h2">Publicaciones similares</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[3] }}>
        {similar.map((similarListing) => (
          <View key={similarListing.id} style={{ width: '47%' }}>
            <MarketplaceCard listing={similarListing} onPress={() => router.push({ pathname: '/marketplace/[id]', params: { id: similarListing.id } })} />
          </View>
        ))}
      </View>
    </View>
  );
}
