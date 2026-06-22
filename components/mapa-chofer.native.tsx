import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { VoltText } from '@/components/volt-text';
import { colors } from '@/constants/colors';
import { spacing, rounded } from '@/constants/spacing';
import { choferServicio, type AsignacionHoy } from '@/utils/chofer';
import { useGpsChofer } from '@/hooks/useGpsChofer';
import { obtenerSocketViajes } from '@/utils/socket';

interface Coord {
  latitude: number;
  longitude: number;
}

function parsearPuntos(recordedPoints: any): Coord[] {
  const coords = recordedPoints?.coordinates;
  if (!Array.isArray(coords)) return [];
  return coords
    .map((c: [number, number]) => {
      const lat = Number(c[1]);
      const lng = Number(c[0]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { latitude: lat, longitude: lng };
      return null;
    })
    .filter(Boolean) as Coord[];
}

export default function MapaChoferScreen() {
  const [asignacion, setAsignacion] = useState<AsignacionHoy | null>(null);
  const [cargando, setCargando] = useState(true);
  const [viajeId, setViajeId] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const { activo: gpsActivo, error: gpsError, ultimaPosicion, activar: activarGps, desactivar: desactivarGps } = useGpsChofer(viajeId);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    choferServicio
      .obtenerAsignacionHoy()
      .then((data) => {
        setAsignacion(data);
        if (data?.trips?.[0]?.id) setViajeId(String(data.trips[0].id));
      })
      .catch(() => setAsignacion(null))
      .finally(() => setCargando(false));
  }, []);

  const puntosRuta = asignacion?.route?.routeRecording?.recordedPoints
    ? parsearPuntos(asignacion.route.routeRecording.recordedPoints)
    : [];
  const primerPunto = puntosRuta[0] ?? null;
  const ultimoPunto = puntosRuta[puntosRuta.length - 1] ?? null;

  const iniciarViaje = useCallback(async () => {
    if (!asignacion) return;
    setIniciando(true);
    try {
      const data = await choferServicio.iniciarViaje(asignacion.id);
      setViajeId(String(data.id));
    } catch {
      // ignore
    }
    setIniciando(false);
  }, [asignacion]);

  const finalizarViaje = useCallback(async () => {
    if (!viajeId) return;
    setFinalizando(true);
    desactivarGps();
    try {
      const socket = obtenerSocketViajes();
      socket.emit('finalizar-viaje', { viajeId });
    } catch {}
    setViajeId(null);
    setFinalizando(false);
  }, [viajeId, desactivarGps]);

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const regionInicial = primerPunto
    ? { ...primerPunto, latitudeDelta: 0.03, longitudeDelta: 0.03 }
    : { latitude: -17.7833, longitude: -63.1821, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={regionInicial}
      >
        {puntosRuta.length > 1 && (
          <Polyline
            coordinates={puntosRuta}
            strokeColor={colors.primary}
            strokeWidth={3}
          />
        )}

        {primerPunto && (
          <Marker coordinate={primerPunto} pinColor={colors.primary} title="Inicio" />
        )}
        {ultimoPunto && (
          <Marker coordinate={ultimoPunto} pinColor="#ff4444" title="Fin" />
        )}

        {gpsActivo && ultimaPosicion && (
          <Marker
            coordinate={{ latitude: ultimaPosicion.lat, longitude: ultimaPosicion.lng }}
            title="Mi posición"
          >
            <View style={styles.pulseMarker}>
              <View style={styles.pulseInner} />
            </View>
          </Marker>
        )}
      </MapView>

      {gpsActivo && ultimaPosicion && (
        <View style={styles.gpsBanner}>
          <View style={styles.pulseDot} />
          <VoltText type="caption" color={colors.primary}>
            GPS activo · {ultimaPosicion.velocidad} km/h
          </VoltText>
        </View>
      )}

      {gpsError && (
        <View style={styles.errorBanner}>
          <VoltText type="body-sm" color="#ff4444">{gpsError}</VoltText>
        </View>
      )}

      <View style={styles.bottomBar}>
        {!asignacion ? (
          <View style={styles.emptyBar}>
            <VoltText type="body" color={colors.mute}>Sin asignación para hoy</VoltText>
          </View>
        ) : !viajeId ? (
          <Pressable
            style={[styles.btnPrimary, iniciando && styles.btnDisabled]}
            onPress={iniciarViaje}
            disabled={iniciando}
          >
            <VoltText type="button" color={colors.onPrimary}>
              {iniciando ? 'Iniciando...' : 'Empezar'}
            </VoltText>
          </Pressable>
        ) : (
          <View style={styles.bottomRow}>
            <View style={styles.tripInfo}>
              <View style={styles.tripDot} />
              <VoltText type="body-sm" color={colors.primary}>Viaje en curso</VoltText>
            </View>
            <View style={styles.bottomBtns}>
              <Pressable
                style={[styles.btnOutline, gpsActivo && styles.btnOutlineDanger]}
                onPress={gpsActivo ? desactivarGps : activarGps}
              >
                <VoltText
                  type="button"
                  color={gpsActivo ? '#ff4444' : colors.primary}
                >
                  {gpsActivo ? 'Detener GPS' : 'Iniciar GPS'}
                </VoltText>
              </Pressable>
              <Pressable
                style={[styles.btnDanger, finalizando && styles.btnDisabled]}
                onPress={finalizarViaje}
                disabled={finalizando}
              >
                <VoltText type="button" color={colors.onPrimary}>
                  {finalizando ? '...' : 'Detener'}
                </VoltText>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  map: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
  pulseMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,217,146,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#000',
  },
  gpsBanner: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: rounded.pill,
    backgroundColor: 'rgba(0,217,146,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,146,0.4)',
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  errorBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    padding: spacing.md,
    borderRadius: rounded.sm,
    backgroundColor: 'rgba(255,68,68,0.15)',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
  },
  emptyBar: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: rounded.md,
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  btnPrimary: {
    paddingVertical: spacing.lg,
    borderRadius: rounded.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnOutline: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: rounded.sm,
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
  },
  btnOutlineDanger: {
    backgroundColor: 'rgba(251,86,91,0.08)',
    borderColor: 'rgba(251,86,91,0.25)',
  },
  btnDanger: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: rounded.sm,
    backgroundColor: '#ff4444',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  bottomRow: { gap: spacing.md },
  tripInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  tripDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  bottomBtns: { flexDirection: 'row', gap: spacing.sm },
});
