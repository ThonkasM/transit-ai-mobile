import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { APIProvider, AdvancedMarker, Map, Polyline, useMap } from '@vis.gl/react-google-maps';
import { router, useFocusEffect } from 'expo-router';
import { VoltText } from '@/components/volt-text';
import { colors } from '@/constants/colors';
import { api } from '@/utils/api';
import { obtenerSocketViajes } from '@/utils/socket';
import { getSelectedId, getLineas, getOpciones, getRouteIdx, setOpciones, clearRuta } from '@/shared/selected-line';
import type { OpcionRuta } from '@/shared/selected-line';

/* ─── types ─── */

interface LatLng { lat: number; lng: number }

/* ─── helpers ─── */

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const MAP_ID = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID || '';
const CENTER = { lat: -17.7833, lng: -63.1821 };

function cOk(c: any): boolean {
  if (Array.isArray(c) && c.length >= 2) {
    const lat = Number(c[0]); const lng = Number(c[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
  if (!c) return false;
  const lat = Number(c.latitude ?? c.lat);
  const lng = Number(c.longitude ?? c.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function toLatLng(c: any): LatLng {
  if (Array.isArray(c) && c.length >= 2) return { lat: Number(c[0]), lng: Number(c[1]) };
  return { lat: Number(c.latitude ?? c.lat ?? 0), lng: Number(c.longitude ?? c.lng ?? 0) };
}

async function calcularRuta(o: LatLng, d: LatLng): Promise<OpcionRuta[]> {
  return api.post<OpcionRuta[]>('/planificador/calcular', {
    origenLat: o.lat, origenLng: o.lng,
    destinoLat: d.lat, destinoLng: d.lng,
  });
}

function Pin({ color }: { color: string }) {
  return (
    <div style={{ width: 16, height: 22, position: 'relative' }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: color, border: '2px solid white' }} />
      <div style={{ position: 'absolute', bottom: 0, left: '50%', marginLeft: -4, width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `6px solid ${color}` }} />
    </div>
  );
}

/* ─── map click ─── */

type Paso = 'origen' | 'destino' | null;

function MapClickListener({ paso, onPoint }: { paso: Paso; onPoint: (c: LatLng) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !paso) return;
    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      onPoint({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, paso, onPoint]);
  return null;
}

/* ─── dashed polyline for walking ─── */

function DashedPolyline({ path }: { path: LatLng[] }) {
  const map = useMap();
  const ref = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length < 2) return;
    const poly = new google.maps.Polyline({
      map,
      path,
      strokeColor: '#9ca3af',
      strokeWeight: 3,
      strokeOpacity: 0,
      icons: [{
        icon: { path: 'M 0,-1 L 0,1', strokeOpacity: 1, strokeWeight: 3 },
        offset: '0',
        repeat: '14px',
      }],
    });
    ref.current = poly;
    return () => { poly.setMap(null); };
  }, [map, path]);

  return null;
}

/* ─── screen ─── */

export default function MapaScreen() {
  const calculatingRef = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(() => getSelectedId());
  const [paso, setPaso] = useState<Paso>(null);
  const [origen, setOrigen] = useState<LatLng | null>(null);
  const [destino, setDestino] = useState<LatLng | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [ruta, setRuta] = useState<OpcionRuta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [busesEnLinea, setBusesEnLinea] = useState<Record<string, { lat: number; lng: number; rumbo: number; viajeId: string }>>({});

  useEffect(() => {
    if (!selectedId) {
      setBusesEnLinea({});
      return;
    }
    const socket = obtenerSocketViajes();
    socket.emit('suscribir-linea', { lineaId: selectedId });
    setBusesEnLinea({});

    const lineaActual = selectedId;

    const onBusActualizado = (payload: any) => {
      if (!payload.viajeId || payload.latitud == null || payload.longitud == null) return;
      if (payload.lineaId && String(payload.lineaId) !== lineaActual) return;
      setBusesEnLinea((prev) => ({
        ...prev,
        [payload.viajeId]: {
          lat: payload.latitud,
          lng: payload.longitud,
          rumbo: payload.rumbo ?? 0,
          viajeId: payload.viajeId,
        },
      }));
    };

    socket.on('bus-actualizado', onBusActualizado);

    return () => {
      socket.off('bus-actualizado', onBusActualizado);
    };
  }, [selectedId]);

  useFocusEffect(useCallback(() => {
    setSelectedId(getSelectedId());
    const ops = getOpciones();
    if (ops.length > 0) {
      setRuta(ops[getRouteIdx()] ?? null);
      setOrigen(null);
      setDestino(null);
    }
  }, []));

  const lineas = getLineas();
  const lineasVisibles = selectedId ? lineas.filter((l) => l.id === selectedId) : [];

  const linePaths = lineasVisibles
    .filter((l) => l.puntos?.length > 1)
    .map((l) => ({ id: l.id, path: l.puntos.filter(cOk).map(toLatLng) }))
    .filter((p) => p.path.length > 1);

  const iniciarCalculo = () => { setPaso('origen'); setOrigen(null); setDestino(null); setRuta(null); setError(null); clearRuta(); calculatingRef.current = false; };

  const onMapPoint = useCallback((c: LatLng) => {
    if (paso === 'origen') { setOrigen(c); setPaso('destino'); }
    else if (paso === 'destino') { setDestino(c); setPaso(null); }
  }, [paso]);

  useEffect(() => {
    if (origen && destino && paso === null && !calculando && !calculatingRef.current) {
      calculatingRef.current = true;
      setCalculando(true);
      setError(null);
      calcularRuta(origen, destino)
        .then((data) => {
          setOpciones(data);
          if (data.length === 0) {
            setError('No se encontraron rutas para este trayecto.');
            calculatingRef.current = false;
          } else {
            setOrigen(null);
            setDestino(null);
            router.push('./opciones');
          }
        })
        .catch((err) => {
          setError(err?.message ?? 'Error al calcular la ruta.');
          calculatingRef.current = false;
        })
        .finally(() => setCalculando(false));
    }
  }, [origen, destino, paso, calculando]);

  const nuevaRuta = () => { setOrigen(null); setDestino(null); setRuta(null); setError(null); clearRuta(); };
  const cancelarCalculo = () => { setPaso(null); setOrigen(null); setDestino(null); setError(null); };

  return (
    <View style={styles.root}>
      <APIProvider apiKey={API_KEY}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={CENTER}
          defaultZoom={14}
          mapId={MAP_ID}
          disableDefaultUI zoomControl
          streetViewControl={false} mapTypeControl={false} fullscreenControl={false} clickableIcons={false}
        >
          <MapClickListener paso={paso} onPoint={onMapPoint} />

          {/* selected line */}
          {linePaths.map((l) => (
            <Polyline key={l.id} path={l.path} strokeColor={colors.primary} strokeWeight={3} />
          ))}

          {/* active buses on selected line */}
          {Object.values(busesEnLinea).map((bus) => (
            <AdvancedMarker
              key={bus.viajeId}
              position={{ lat: bus.lat, lng: bus.lng }}
              title={`Bus en línea`}
            >
              <Pin color={colors.primary} />
            </AdvancedMarker>
          ))}

          {/* calculated route */}
          {ruta?.segmentos?.map((seg: any, i: number) =>
            seg.tipo === 'bus' ? (
              <Polyline key={`b-${i}`} path={seg.puntosRuta.map(toLatLng)} strokeColor={colors.primary} strokeWeight={6} />
            ) : (
              <DashedPolyline key={`w-${i}`} path={seg.puntosRuta.map(toLatLng)} />
            )
          )}

          {/* walking markers */}
          {ruta?.segmentos
            ?.filter((s: any) => s.tipo === 'caminata')
            .flatMap((s: any, i: number) => [
              <AdvancedMarker key={`ws-${i}`} position={toLatLng(s.desde)} title={`Caminar ${s.distanciaMetros}m`}><Pin color="#9ca3af" /></AdvancedMarker>,
              <AdvancedMarker key={`we-${i}`} position={toLatLng(s.hasta)}><Pin color="#9ca3af" /></AdvancedMarker>,
            ])}

          {/* boarding / alighting */}
          {ruta?.segmentos
            ?.filter((s: any) => s.tipo === 'bus')
            .flatMap((s: any, i: number) => [
              <AdvancedMarker key={`emb-${i}`} position={toLatLng(s.embarque)} title={`Subir: ${s.linea.nombre}`}><Pin color={colors.primary} /></AdvancedMarker>,
              <AdvancedMarker key={`des-${i}`} position={toLatLng(s.descenso)} title={`Bajar: ${s.linea.nombre}`}><Pin color="#ff4444" /></AdvancedMarker>,
            ])}

          {/* origin / destination */}
          {origen && <AdvancedMarker position={origen} title="Origen"><Pin color="#00d992" /></AdvancedMarker>}
          {destino && <AdvancedMarker position={destino} title="Destino"><Pin color="#ff4444" /></AdvancedMarker>}
        </Map>
      </APIProvider>

      {/* loading */}
      {calculando && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
          <VoltText type="body" color={colors.mute} style={{ marginTop: 12 }}>Calculando ruta...</VoltText>
        </View>
      )}

      {/* error */}
      {error && !calculando && (
        <View style={styles.errorBanner}>
          <VoltText type="body-sm" color="#ff4444">{error}</VoltText>
          <Pressable onPress={() => setError(null)} style={{ marginLeft: 12 }}>
            <VoltText type="body-sm" color={colors.primary}>X</VoltText>
          </Pressable>
        </View>
      )}

      {/* bottom bar */}
      {!paso && !calculando && (
        <View style={styles.bottomBar}>
          <Pressable style={styles.btn} onPress={() => router.push('./lineas')}>
            <VoltText type="button" color={colors.onPrimary}>{selectedId ? '1 línea' : 'Ver Líneas'}</VoltText>
          </Pressable>
          {ruta ? (
            <Pressable style={styles.btnOutline} onPress={() => router.push('./opciones')}>
              <VoltText type="button" color={colors.ink}>Cambiar</VoltText>
            </Pressable>
          ) : (
            <Pressable style={styles.btnOutline} onPress={iniciarCalculo}>
              <VoltText type="button" color={colors.ink}>Calcular</VoltText>
            </Pressable>
          )}
          {ruta && (
            <Pressable style={styles.btnOutlineSm} onPress={nuevaRuta}>
              <VoltText type="button" color={colors.mute}>✕</VoltText>
            </Pressable>
          )}
        </View>
      )}

      {/* step bar */}
      {paso && (
        <View style={styles.calcBar}>
          <Pressable style={styles.btnOutlineSm} onPress={cancelarCalculo}>
            <VoltText type="button" color={colors.mute}>Cancelar</VoltText>
          </Pressable>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, paso === 'origen' && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, paso === 'destino' && styles.stepDotActive]} />
          </View>
          <View style={{ flex: 1 }} />
        </View>
      )}

      {/* banner */}
      {paso && (
        <View style={styles.banner}>
          <VoltText type="caption" color={colors.primary}>
            {paso === 'origen' ? 'Haz clic para marcar el origen' : 'Haz clic para marcar el destino'}
          </VoltText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  loader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(16,16,16,0.8)' },
  errorBanner: { position: 'absolute', top: 16, left: 16, right: 16, padding: 12, borderRadius: 10, backgroundColor: 'rgba(255,68,68,0.15)', borderWidth: 1, borderColor: '#ff4444', flexDirection: 'row', alignItems: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12 },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary },
  btnOutline: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: colors.canvasSoft, borderWidth: 1, borderColor: colors.hairline },
  calcBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12 },
  btnOutlineSm: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.canvasSoft, borderWidth: 1, borderColor: colors.hairline },
  stepIndicator: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.hairline, borderWidth: 2, borderColor: colors.hairline },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepLine: { width: 24, height: 2, backgroundColor: colors.hairline },
  banner: { position: 'absolute', top: 16, left: 16, right: 16, padding: 10, borderRadius: 10, backgroundColor: 'rgba(0,217,146,0.15)', borderWidth: 1, borderColor: colors.primary, alignItems: 'center' },
});
