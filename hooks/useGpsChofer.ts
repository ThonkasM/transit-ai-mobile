import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { obtenerSocketViajes } from '@/utils/socket';

interface Posicion {
  lat: number;
  lng: number;
  velocidad: number;
  rumbo: number;
}

interface EstadoGps {
  activo: boolean;
  error: string | null;
  ultimaPosicion: Posicion | null;
}

export function useGpsChofer(viajeId: string | null) {
  const [estado, setEstado] = useState<EstadoGps>({
    activo: false,
    error: null,
    ultimaPosicion: null,
  });
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const enviarUbicacion = useCallback(
    (loc: Location.LocationObject) => {
      if (!viajeId) return;
      const { latitude, longitude, speed, heading, accuracy } = loc.coords;
      const socket = obtenerSocketViajes();
      socket.emit('ubicacion-conductor', {
        viajeId,
        latitud: latitude,
        longitud: longitude,
        velocidad: speed != null ? Math.round(speed * 3.6) : 0,
        rumbo: heading ?? 0,
        precisionMetros: accuracy ?? undefined,
      });
      setEstado((prev) => ({
        ...prev,
        ultimaPosicion: {
          lat: latitude,
          lng: longitude,
          velocidad: speed ? Math.round(speed * 3.6) : 0,
          rumbo: heading ?? 0,
        },
      }));
    },
    [viajeId]
  );

  const activar = useCallback(async () => {
    if (!viajeId) {
      setEstado((prev) => ({
        ...prev,
        error: 'No hay un viaje activo para enviar la ubicación',
      }));
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setEstado((prev) => ({
        ...prev,
        error: 'Permiso de ubicación denegado',
      }));
      return;
    }

    try {
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (loc) => {
          setEstado((prev) => ({ ...prev, activo: true, error: null }));
          enviarUbicacion(loc);
        }
      );
      setEstado((prev) => ({ ...prev, activo: true, error: null }));
    } catch (err: any) {
      setEstado((prev) => ({ ...prev, error: err?.message ?? 'Error al iniciar GPS' }));
    }
  }, [viajeId, enviarUbicacion]);

  const desactivar = useCallback(() => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setEstado((prev) => ({ ...prev, activo: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (watchRef.current) watchRef.current.remove();
    };
  }, []);

  return { ...estado, activar, desactivar };
}
