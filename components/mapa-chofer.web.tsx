import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { APIProvider, AdvancedMarker, Map, Polyline } from '@vis.gl/react-google-maps';
import { VoltText } from '@/components/volt-text';
import { colors } from '@/constants/colors';
import { spacing, rounded } from '@/constants/spacing';
import { choferServicio, type AsignacionHoy } from '@/utils/chofer';
import { useGpsChofer } from '@/hooks/useGpsChofer';
import { obtenerSocketViajes } from '@/utils/socket';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const MAP_ID = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID || '';
const CENTER = { lat: -17.7833, lng: -63.1821 };

interface LatLng { lat: number; lng: number }

function parsearPuntos(recordedPoints: any): LatLng[] {
  const coords = recordedPoints?.coordinates;
  if (!Array.isArray(coords)) return [];
  return coords
    .map((c: [number, number]) => {
      const lat = Number(c[1]);
      const lng = Number(c[0]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      return null;
    })
    .filter(Boolean) as LatLng[];
}

function BusPin({ color }: { color: string }) {
  return (
    <div style={{ width: 16, height: 22, position: 'relative' }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: color, border: '2px solid white' }} />
      <div style={{ position: 'absolute', bottom: 0, left: '50%', marginLeft: -4, width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `6px solid ${color}` }} />
    </div>
  );
}

export default function MapaChoferScreen() {
  const [asignacion, setAsignacion] = useState<AsignacionHoy | null>(null);
  const [cargando, setCargando] = useState(true);
  const [viajeId, setViajeId] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const { activo: gpsActivo, error: gpsError, ultimaPosicion, activar: activarGps, desactivar: desactivarGps } = useGpsChofer(viajeId);

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

  const centroInicial = primerPunto ?? CENTER;

  return (
    <View style={styles.root}>
      <APIProvider apiKey={API_KEY}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={centroInicial}
          defaultZoom={14}
          mapId={MAP_ID}
          disableDefaultUI zoomControl
          streetViewControl={false} mapTypeControl={false} fullscreenControl={false} clickableIcons={false}
        >
          {puntosRuta.length > 1 && (
            <Polyline path={puntosRuta} strokeColor={colors.primary} strokeWeight={3} />
          )}

          {primerPunto && (
            <AdvancedMarker position={primerPunto} title="Inicio">
              <BusPin color={colors.primary} />
            </AdvancedMarker>
          )}
          {ultimoPunto && (
            <AdvancedMarker position={ultimoPunto} title="Fin">
              <BusPin color="#ff4444" />
            </AdvancedMarker>
          )}

          {gpsActivo && ultimaPosicion && (
            <AdvancedMarker
              position={{ lat: ultimaPosicion.lat, lng: ultimaPosicion.lng }}
              title="Mi posición"
            >
              <BusPin color={colors.primary} />
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
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
