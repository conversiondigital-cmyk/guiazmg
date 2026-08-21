/**
 * Hook compartido para el flujo "Cerca de ti/mí": muestra el modal propio la
 * primera vez, pide el permiso al SO, cachea el resultado. Si el usuario ya
 * denegó antes, `requestNearMe()` no vuelve a preguntar: deja `deniedBefore`
 * en `true` para que la pantalla ofrezca elegir municipio a mano.
 */
import { useCallback, useEffect, useState } from 'react';

import { getCachedLocation, hasUserDeniedLocation, requestLocation, type Coordinates } from './location';

export function useNearMe() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [deniedBefore, setDeniedBefore] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getCachedLocation(), hasUserDeniedLocation()]).then(([cached, denied]) => {
      if (!mounted) return;
      if (cached) setCoords(cached);
      setDeniedBefore(denied);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const askPermissionFlow = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await requestLocation();
      if (result.status === 'granted') {
        setCoords(result.coords);
      } else if (result.status === 'denied') {
        setDeniedBefore(true);
      } else if (result.status === 'error') {
        setErrorMessage(result.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /** Punto de entrada único: llama esto desde el botón "Cerca de mí". */
  const requestNearMe = useCallback(() => {
    if (coords) return; // ya tenemos posición vigente, no hace falta nada más.
    if (deniedBefore) return; // ya dijo que no: la pantalla debe ofrecer municipio manual, no reinsistir.
    setModalVisible(true);
  }, [coords, deniedBefore]);

  const confirmModal = useCallback(() => {
    setModalVisible(false);
    void askPermissionFlow();
  }, [askPermissionFlow]);

  const dismissModal = useCallback(() => setModalVisible(false), []);

  return {
    coords,
    deniedBefore,
    modalVisible,
    loading,
    errorMessage,
    requestNearMe,
    confirmModal,
    dismissModal,
  };
}
