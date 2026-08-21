/**
 * Mapa de negocios reutilizable (pantalla completa `mapa.tsx` y pestaña Mapa
 * dentro de Explorar). Centrado en la ZMG; al mover el mapa, consulta
 * `/map/businesses` con el bbox visible + zoom (debounce ~400ms). Ramifica
 * por `mode`: pines individuales o círculos con número (clusters). Tocar un
 * cluster acerca el mapa; tocar un pin abre `MapPinCard`.
 *
 * CRÍTICO: sin clave de Google Maps en Android, `react-native-maps` pinta un
 * rectángulo gris que parece una app rota. Por eso en Android sin
 * `hasGoogleMapsAndroidKey` (ver `app.config.ts`) esta vista NUNCA monta el
 * `MapView`: muestra un `EmptyState` honesto + la lista de negocios como
 * alternativa funcional. En iOS no aplica (Apple Maps no necesita clave).
 */
import Constants from 'expo-constants';
import { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import { LocateFixed, MapPinOff, Search } from 'lucide-react-native';

import { useMapBusinesses } from '@/api/queries';
import type { BusinessPin } from '@/api/types';
import { BusinessListItem } from '@/components/business-list-item';
import { MapPinCard } from '@/components/map-pin-card';
import { useNearMe } from '@/location/use-near-me';
import { useTheme } from '@/theme/theme-provider';
import { regionToBbox, regionToZoom, ZMG_INITIAL_REGION } from '@/utils/map-region';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Text } from '@/ui/Text';

const hasGoogleMapsAndroidKey = Boolean(Constants.expoConfig?.extra?.hasGoogleMapsAndroidKey);
const REGION_DEBOUNCE_MS = 400;

export type BusinessMapViewProps = {
  onViewBusiness: (slug: string) => void;
  /** Lista alternativa a pintar cuando no hay clave de mapa configurada. */
  fallbackList: React.ReactNode;
};

export function BusinessMapView({ onViewBusiness, fallbackList }: BusinessMapViewProps) {
  const theme = useTheme();

  if (Platform.OS === 'android' && !hasGoogleMapsAndroidKey) {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4] }}>
          <EmptyState
            icon={MapPinOff}
            title="El mapa todavía no está configurado"
            description="Falta la clave de Google Maps para Android. Mientras tanto, aquí tienes la lista de negocios — funciona igual."
          />
        </View>
        {fallbackList}
      </View>
    );
  }

  return <MapViewInner onViewBusiness={onViewBusiness} />;
}

function MapViewInner({ onViewBusiness }: { onViewBusiness: (slug: string) => void }) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nearMe = useNearMe();

  const [region, setRegion] = useState<Region>(ZMG_INITIAL_REGION);
  const [queryRegion, setQueryRegion] = useState<Region>(ZMG_INITIAL_REGION);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [selectedPin, setSelectedPin] = useState<BusinessPin | null>(null);

  const bbox = regionToBbox(queryRegion);
  const zoom = regionToZoom(queryRegion);
  const mapQuery = useMapBusinesses(bbox, zoom, true);

  const handleRegionChangeComplete = useCallback((nextRegion: Region) => {
    setRegion(nextRegion);
    setShowSearchArea(true);
    // Debounce: solo dispara la consulta 400ms después de que el dedo se
    // detiene, para no mandar una petición por cada cuadro del gesto. El
    // botón "Buscar en esta área" queda visible por si el usuario prefiere
    // decidir el momento exacto (p.ej. si sigue explorando visualmente).
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQueryRegion(nextRegion);
      setShowSearchArea(false);
    }, REGION_DEBOUNCE_MS);
  }, []);

  function searchThisArea() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQueryRegion(region);
    setShowSearchArea(false);
  }

  function focusOnCluster(lat: number, lng: number) {
    const nextRegion: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: region.latitudeDelta / 3,
      longitudeDelta: region.longitudeDelta / 3,
    };
    mapRef.current?.animateToRegion(nextRegion, 300);
    setRegion(nextRegion);
    setQueryRegion(nextRegion);
  }

  async function goToMyLocation() {
    nearMe.requestNearMe();
    if (nearMe.coords) {
      const nextRegion: Region = { ...nearMe.coords, latitudeDelta: 0.05, longitudeDelta: 0.05 };
      mapRef.current?.animateToRegion(nextRegion, 300);
      setRegion(nextRegion);
      setQueryRegion(nextRegion);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={ZMG_INITIAL_REGION}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={Boolean(nearMe.coords)}
        showsMyLocationButton={false}>
        {mapQuery.data?.mode === 'pins'
          ? mapQuery.data.pins
              .filter((pin) => pin.lat != null && pin.lng != null)
              .map((pin) => (
                <Marker
                  key={pin.id}
                  coordinate={{ latitude: pin.lat as number, longitude: pin.lng as number }}
                  onPress={() => setSelectedPin(pin)}
                  accessibilityLabel={pin.name}
                />
              ))
          : null}

        {mapQuery.data?.mode === 'clusters'
          ? mapQuery.data.clusters.map((cluster, index) => (
              <Marker
                key={`cluster-${index}`}
                coordinate={{ latitude: cluster.lat, longitude: cluster.lng }}
                onPress={() => focusOnCluster(cluster.lat, cluster.lng)}
                accessibilityLabel={`${cluster.count} negocios en esta zona`}>
                <ClusterBadge count={cluster.count} />
              </Marker>
            ))
          : null}

        {nearMe.coords ? (
          <Circle
            center={nearMe.coords}
            radius={80}
            fillColor={`${theme.colors.primary}55`}
            strokeColor={theme.colors.primary}
          />
        ) : null}
      </MapView>

      {mapQuery.isError ? (
        <View style={{ position: 'absolute', top: theme.spacing[4], left: theme.spacing[4], right: theme.spacing[4] }}>
          <View style={{ backgroundColor: theme.colors.background, borderRadius: theme.radius.lg }}>
            <ErrorState message="No pudimos cargar los negocios de esta zona." onRetry={() => mapQuery.refetch()} />
          </View>
        </View>
      ) : null}

      {showSearchArea ? (
        <Pressable
          onPress={searchThisArea}
          accessibilityRole="button"
          accessibilityLabel="Buscar en esta área"
          style={{
            position: 'absolute',
            top: theme.spacing[4],
            alignSelf: 'center',
            backgroundColor: theme.colors.foreground,
            borderRadius: theme.radius.full,
            paddingHorizontal: theme.spacing[4],
            paddingVertical: theme.spacing[2],
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}>
          <Search size={14} color="#ffffff" />
          <Text variant="caption" style={{ color: '#ffffff', fontWeight: '700' }}>
            Buscar en esta área
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={goToMyLocation}
        accessibilityRole="button"
        accessibilityLabel="Ir a mi ubicación"
        style={{
          position: 'absolute',
          right: theme.spacing[4],
          bottom: selectedPin ? 200 : theme.spacing[6],
          width: 48,
          height: 48,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadows.card,
        }}>
        <LocateFixed size={22} color={theme.colors.primary} />
      </Pressable>

      {selectedPin ? (
        <MapPinCard
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onViewDetail={() => onViewBusiness(selectedPin.slug)}
          userLocation={nearMe.coords}
        />
      ) : null}
    </View>
  );
}

function ClusterBadge({ count }: { count: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text variant="caption" style={{ color: '#ffffff', fontWeight: '700' }}>
        {count}
      </Text>
    </View>
  );
}
