/**
 * Ficha de negocio — la pantalla más importante de la app: es donde se
 * convierte la visita en una llamada/WhatsApp real, algo que el sitio web no
 * puede ofrecer igual de rápido. Barra de acciones FIJA al fondo con
 * telemetría disparada ANTES de abrir la app externa (ver `contact-actions`).
 *
 * Guardar (favorito) exige sesión: si no hay una, se manda a login
 * conservando la intención (`?autoIntent=save`) — al volver ya autenticado,
 * esta misma pantalla completa el guardado en vez de dejar al usuario en el
 * inicio (ver `useRequireAuth`).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Award, Clock, Heart, MessageSquarePlus, Share2, ShieldCheck, Star } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, FlatList, Image, Linking, Pressable, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';

import { useBusinessDetail, useBusinessReviews, useSearchBusinesses } from '@/api/queries';
import { trackEvent } from '@/api/analytics';
import type { BusinessDetailReviewPreview, BusinessHour } from '@/api/types';
import { useTheme } from '@/theme/theme-provider';
import { callPhone, openDirections, openWhatsapp } from '@/utils/contact-actions';
import { formatRelativeTime } from '@/utils/format';
import { useRequireAuth } from '@/utils/require-auth';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Skeleton } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Editorial: la foto manda. Héroe grande, con degradado oscuro abajo para que
// los chips/nombre superpuestos sigan pasando contraste AA sobre CUALQUIER foto.
const GALLERY_HEIGHT = 320;
const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function NegocioDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug, autoIntent } = useLocalSearchParams<{ slug: string; autoIntent?: string }>();
  const { requireAuth } = useRequireAuth();
  const detailQuery = useBusinessDetail(slug ?? '');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const reviewsQuery = useBusinessReviews(slug ?? '', showAllReviews);
  const [isSaved, setIsSaved] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [galleryIndex, setGalleryIndex] = useState(0);
  const autoIntentHandled = useRef(false);

  useEffect(() => {
    if (detailQuery.data) {
      setIsSaved(detailQuery.data.isFavorite);
      void trackEvent('BUSINESS_VIEW', { businessId: detailQuery.data.id });
    }
  }, [detailQuery.data]);

  function toggleSave() {
    requireAuth(() => setIsSaved((v) => !v), { intent: 'save' });
  }

  // Al volver de iniciar sesión con la intención "guardar" pendiente,
  // completa la acción una sola vez (no en cada re-render).
  useEffect(() => {
    if (autoIntent === 'save' && detailQuery.data && !autoIntentHandled.current) {
      autoIntentHandled.current = true;
      setIsSaved(true);
    }
  }, [autoIntent, detailQuery.data]);

  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (detailQuery.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <Skeleton width="100%" height={GALLERY_HEIGHT} borderRadius={0} />
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[3] }}>
          <Skeleton width="70%" height={26} />
          <Skeleton width="40%" height={16} />
          <Skeleton width="100%" height={60} />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    const isNotFound = detailQuery.error && 'code' in detailQuery.error && (detailQuery.error as { code?: string }).code === 'NOT_FOUND';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <View style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[3] }}>
          <BackButton onPress={() => router.back()} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {isNotFound ? (
            <EmptyState
              title="Este negocio ya no está disponible"
              description="Puede que haya cerrado o que el enlace esté equivocado."
              actionLabel="Buscar similares"
              onAction={() => router.push('/(tabs)/explorar')}
            />
          ) : (
            <ErrorState onRetry={() => detailQuery.refetch()} retrying={detailQuery.isRefetching} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const business = detailQuery.data;
  const images = business.images.length > 0 ? business.images : [];
  const reviewsToShow: BusinessDetailReviewPreview[] = showAllReviews
    ? (reviewsQuery.data?.pages.flatMap((page) => page.data) ?? business.reviewsPreview)
    : business.reviewsPreview.slice(0, 3);
  const location = [business.neighborhood?.name, business.municipality?.name].filter(Boolean).join(', ');
  const socialEntries = Object.entries(business.socials).filter(([, url]) => Boolean(url)) as [string, string][];

  async function handleShare() {
    try {
      await Share.share({ message: `Mira ${business.name} en Guía ZMG`, url: `https://guiazmg.com/negocio/${business.slug}` });
    } catch {
      // El usuario canceló el share sheet: no es un error que reportar.
    }
  }

  function handleWriteReview() {
    requireAuth(
      () => Alert.alert('Escribir reseña', 'Todavía no puedes escribir reseñas desde la app. Esta función llega en una próxima actualización.'),
      { intent: 'review' },
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Galería / héroe */}
        <View style={{ height: GALLERY_HEIGHT, backgroundColor: theme.colors.muted }}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => String(index)}
              onMomentumScrollEnd={(e) => setGalleryIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width: SCREEN_WIDTH, height: GALLERY_HEIGHT, backgroundColor: theme.colors.muted }}
                  accessibilityIgnoresInvertColors
                  accessibilityLabel={`Foto de ${business.name}`}
                />
              )}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="display" style={{ opacity: 0.4 }}>
                {business.category?.icon ?? '🏪'}
              </Text>
              <Text variant="caption" color="mutedForeground" style={{ marginTop: theme.spacing[2] }}>
                Este negocio todavía no subió fotos
              </Text>
            </View>
          )}

          {images.length > 1 ? (
            <View
              style={{
                position: 'absolute',
                top: theme.spacing[3],
                right: theme.spacing[3],
                backgroundColor: theme.colors.overlayDark,
                borderRadius: theme.radius.full,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}>
              <Text variant="caption" style={{ color: '#ffffff' }}>
                {galleryIndex + 1}/{images.length}
              </Text>
            </View>
          ) : null}

          {/* Degradado oscuro: sostiene AA para los chips/nombre/rating superpuestos, sea cual sea la foto. */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 }}
            pointerEvents="none"
          />

          <View style={{ position: 'absolute', left: theme.spacing[4], right: theme.spacing[4], bottom: theme.spacing[3], gap: theme.spacing[1] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], flexWrap: 'wrap' }}>
              {business.isVerified ? <Badge icon={ShieldCheck} label="Verificado" tone="mint" /> : null}
              {business.isOpenNow !== null ? <Badge icon={Clock} label={business.isOpenNow ? 'Abierto' : 'Cerrado'} tone={business.isOpenNow ? 'mint' : 'neutral'} /> : null}
              {business.isFeatured ? <Badge icon={Award} label="Destacado" tone="premium" /> : null}
            </View>
            <Text variant="h1" style={{ color: '#ffffff' }} numberOfLines={2}>
              {business.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {business.rating !== null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Star size={14} color={theme.colors.star} fill={theme.colors.star} />
                  <Text variant="bodyStrong" style={{ color: '#ffffff' }}>
                    {business.rating.toFixed(1)} ({business.reviewCount})
                  </Text>
                </View>
              ) : (
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Sin reseñas todavía
                </Text>
              )}
              {location ? (
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.9)' }} numberOfLines={1}>
                  {' '}· 📍 {location}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Contenido */}
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
          <View style={{ gap: theme.spacing[1] }}>
            {business.category ? (
              <Text variant="body" color="mutedForeground">
                {business.category.icon ? `${business.category.icon} ` : ''}
                {business.category.name}
              </Text>
            ) : null}
          </View>

          {business.description ? (
            <Section title="Descripción">
              <Text variant="body" color="mutedForeground">
                {business.description}
              </Text>
            </Section>
          ) : null}

          {business.tags.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
              {business.tags.map((tag) => (
                <View
                  key={tag.slug}
                  style={{ backgroundColor: theme.colors.muted, borderRadius: theme.radius.full, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text variant="caption" color="mutedForeground">
                    {tag.icon ? `${tag.icon} ` : ''}
                    {tag.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Section title="Horarios">
            <HoursTable hours={business.hours} />
          </Section>

          {business.addressText || (business.lat && business.lng) ? (
            <Section title="Ubicación">
              {location ? (
                <Text variant="body" color="mutedForeground">
                  {business.addressText ?? location}
                </Text>
              ) : null}
              {business.lat != null && business.lng != null ? (
                <Pressable
                  onPress={() => openDirections({ latitude: business.lat as number, longitude: business.lng as number, label: business.name }, { businessId: business.id })}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir en la app de mapas"
                  style={{ height: 160, borderRadius: theme.radius.lg, overflow: 'hidden', marginTop: theme.spacing[2] }}>
                  <MapView
                    style={{ flex: 1 }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pointerEvents="none"
                    initialRegion={{
                      latitude: business.lat,
                      longitude: business.lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}>
                    <Marker coordinate={{ latitude: business.lat, longitude: business.lng }} />
                  </MapView>
                </Pressable>
              ) : null}
            </Section>
          ) : null}

          <Section
            title="Reseñas"
            action={{ label: 'Escribir reseña', onPress: handleWriteReview, icon: MessageSquarePlus }}>
            {business.reviewCount === 0 ? (
              <Text variant="body" color="mutedForeground">
                Este negocio todavía no tiene reseñas.
              </Text>
            ) : (
              <View style={{ gap: theme.spacing[3] }}>
                {reviewsToShow.map((review) => (
                  <View key={review.id} style={{ gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text variant="bodyStrong">{review.authorName ?? 'Usuario de Guía ZMG'}</Text>
                      <View style={{ flexDirection: 'row' }}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={12}
                            color={theme.colors.warning}
                            fill={index < review.rating ? theme.colors.warning : 'transparent'}
                          />
                        ))}
                      </View>
                    </View>
                    {review.comment ? (
                      <Text variant="body" color="mutedForeground">
                        {review.comment}
                      </Text>
                    ) : null}
                    <Text variant="caption" color="mutedForeground">
                      {formatRelativeTime(review.createdAt)}
                    </Text>
                  </View>
                ))}
                {!showAllReviews && business.reviewCount > 3 ? (
                  <Button label={`Ver las ${business.reviewCount}`} variant="outline" size="sm" onPress={() => setShowAllReviews(true)} />
                ) : null}
                {showAllReviews && reviewsQuery.hasNextPage ? (
                  <Button
                    label="Ver más"
                    variant="outline"
                    size="sm"
                    loading={reviewsQuery.isFetchingNextPage}
                    onPress={() => reviewsQuery.fetchNextPage()}
                  />
                ) : null}
              </View>
            )}
          </Section>

          {socialEntries.length > 0 ? (
            <Section title="Redes sociales">
              <View style={{ flexDirection: 'row', gap: theme.spacing[2], flexWrap: 'wrap' }}>
                {socialEntries.map(([platform, url]) => (
                  <Button key={platform} label={socialLabel(platform)} variant="outline" size="sm" onPress={() => Linking.openURL(url)} />
                ))}
              </View>
            </Section>
          ) : null}

          <SimilarBusinesses categorySlug={business.category?.slug} excludeId={business.id} />
        </View>
      </Animated.ScrollView>

      {/* Header flotante */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }} pointerEvents="box-none">
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.background,
            opacity: headerBackgroundOpacity,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[2] }}>
          <HeaderIconButton onPress={() => router.back()} icon={ArrowLeft} label="Regresar" />
          <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
            <HeaderIconButton onPress={toggleSave} icon={Heart} label={isSaved ? 'Quitar de guardados' : 'Guardar'} filled={isSaved} />
            <HeaderIconButton onPress={handleShare} icon={Share2} label="Compartir" />
          </View>
        </View>
      </SafeAreaView>

      {/* Barra de acciones fija */}
      <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing[2], padding: theme.spacing[3] }}>
          {business.phone ? (
            <Button
              label="Llamar"
              variant="outline"
              size="lg"
              style={{ flex: 1 }}
              fullWidth
              onPress={() => callPhone(business.phone as string, 'PHONE_CLICK', { businessId: business.id })}
            />
          ) : null}
          {business.whatsapp ? (
            <Button
              label="WhatsApp"
              variant="primary"
              size="lg"
              style={{ flex: 1.2 }}
              fullWidth
              onPress={() =>
                openWhatsapp(business.whatsapp as string, `Hola, vi tu negocio "${business.name}" en Guía ZMG.`, 'WHATSAPP_CLICK', {
                  businessId: business.id,
                })
              }
            />
          ) : null}
          {business.lat != null && business.lng != null ? (
            <Button
              label="Cómo llegar"
              variant="outline"
              size="lg"
              style={{ flex: 1 }}
              fullWidth
              onPress={() => openDirections({ latitude: business.lat as number, longitude: business.lng as number, label: business.name }, { businessId: business.id })}
            />
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function socialLabel(platform: string): string {
  if (platform.startsWith('facebook')) return 'Facebook';
  if (platform.startsWith('instagram')) return 'Instagram';
  if (platform.startsWith('tiktok')) return 'TikTok';
  if (platform.startsWith('youtube')) return 'YouTube';
  if (platform.startsWith('linkedin')) return 'LinkedIn';
  return platform;
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: { label: string; onPress: () => void; icon: typeof Star };
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="h2">{title}</Text>
        {action ? (
          <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <action.icon size={14} color={theme.colors.primary} />
            <Text variant="label" color="primary">
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Badge({ icon: Icon, label, tone }: { icon: typeof ShieldCheck; label: string; tone: 'mint' | 'premium' | 'neutral' }) {
  const theme = useTheme();
  // "premium" usa terracota claro + texto carbón (único par con contraste AA — ver theme/tokens.ts).
  // "neutral" es para estados sin carga de marca (p.ej. "Cerrado" sobre una foto): blanco translúcido + texto carbón.
  const bg = tone === 'mint' ? theme.colors.tintMint : tone === 'premium' ? theme.colors.secondary : theme.colors.overlayLight;
  const fg = tone === 'mint' ? theme.colors.tintMintInk : tone === 'premium' ? theme.colors.secondaryForeground : theme.colors.foreground;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.full }}>
      <Icon size={12} color={fg} />
      <Text variant="caption" style={{ color: fg, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

function HeaderIconButton({ onPress, icon: Icon, label, filled }: { onPress: () => void; icon: typeof ArrowLeft; label: string; filled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.overlayLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.card,
      }}>
      <Icon size={20} color={filled ? theme.colors.destructive : theme.colors.foreground} fill={filled ? theme.colors.destructive : 'transparent'} />
    </Pressable>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Regresar" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <ArrowLeft size={22} color={theme.colors.foreground} />
    </Pressable>
  );
}

function HoursTable({ hours }: { hours: BusinessHour[] }) {
  const theme = useTheme();
  const today = new Date().getDay();

  if (!hours || hours.length === 0) {
    return (
      <Text variant="body" color="mutedForeground">
        Este negocio todavía no cargó su horario.
      </Text>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      {DAY_LABELS.map((label, dayIndex) => {
        const day = hours.find((h) => h.dayOfWeek === dayIndex);
        const isToday = dayIndex === today;
        return (
          <View
            key={dayIndex}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 4,
              paddingHorizontal: isToday ? 8 : 0,
              borderRadius: theme.radius.sm,
              backgroundColor: isToday ? theme.colors.tintMint : 'transparent',
            }}>
            <Text variant={isToday ? 'bodyStrong' : 'body'} color={isToday ? 'tintMintInk' : 'foreground'}>
              {label}
            </Text>
            <Text variant={isToday ? 'bodyStrong' : 'body'} color={isToday ? 'tintMintInk' : 'mutedForeground'}>
              {!day || day.isClosed || !day.opensAt || !day.closesAt ? 'Cerrado' : `${day.opensAt} - ${day.closesAt}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Negocios de la misma categoría, para el pie de la ficha. Falla en silencio (sección opcional). */
function SimilarBusinesses({ categorySlug, excludeId }: { categorySlug?: string; excludeId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const similarQuery = useSearchBusinesses({ category: categorySlug, limit: 6 });

  if (!categorySlug || similarQuery.isLoading || similarQuery.isError) return null;

  const similar = (similarQuery.data?.pages[0]?.data ?? []).filter((business) => business.id !== excludeId).slice(0, 4);
  if (similar.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing[3] }}>
      <Text variant="h2">Negocios similares</Text>
      <View style={{ gap: theme.spacing[2] }}>
        {similar.map((business) => (
          <Pressable
            key={business.id}
            onPress={() => router.push({ pathname: '/negocio/[slug]', params: { slug: business.slug } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], paddingVertical: theme.spacing[2] }}>
            <Text variant="h3">{business.category?.icon ?? '🏪'}</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {business.name}
              </Text>
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                {business.municipality?.name ?? ''}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
