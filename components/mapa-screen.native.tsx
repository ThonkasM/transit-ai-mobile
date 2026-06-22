import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { router, useFocusEffect } from 'expo-router';
import { VoltText } from '@/components/volt-text';
import { colors } from '@/constants/colors';
import { api } from '@/utils/api';
import { obtenerSocketViajes } from '@/utils/socket';
import { getSelectedId, getLineas, getOpciones, getRouteIdx, setOpciones, clearRuta } from '@/shared/selected-line';
import type { OpcionRuta } from '@/shared/selected-line';

/* ─── types ─── */

interface Coord {
  latitude: number;
  longitude: number;
}

/* ─── helpers ─── */

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

function toCoord(c: any): Coord {
  if (Array.isArray(c) && c.length >= 2) return { latitude: Number(c[0]), longitude: Number(c[1]) };
  return { latitude: Number(c.latitude ?? c.lat ?? 0), longitude: Number(c.longitude ?? c.lng ?? 0) };
}

async function calcularRuta(o: Coord, d: Coord): Promise<OpcionRuta[]> {
  return api.post<OpcionRuta[]>('/planificador/calcular', {
    origenLat: o.latitude, origenLng: o.longitude,
    destinoLat: d.latitude, destinoLng: d.longitude,
  });
}

/* ─── screen ─── */

type Paso = 'origen' | 'destino' | null;

export default function MapaScreen() {
  const centroRef = useRef({ latitude: -17.7833, longitude: -63.1821 });
  const calculatingRef = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(() => getSelectedId());
  const [paso, setPaso] = useState<Paso>(null);
  const [origen, setOrigen] = useState<Coord | null>(null);
  const [destino, setDestino] = useState<Coord | null>(null);
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

  const iniciarCalculo = () => { setPaso('origen'); setOrigen(null); setDestino(null); setRuta(null); setError(null); clearRuta(); calculatingRef.current = false; };

  const confirmarPaso = () => {
    const c = centroRef.current;
    if (paso === 'origen') { setOrigen(c); setPaso('destino'); }
    else { setDestino(c); setPaso(null); }
  };

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
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{ latitude: -17.7833, longitude: -63.1821, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        onRegionChangeComplete={(r) => { centroRef.current = { latitude: r.latitude, longitude: r.longitude }; }}
      >
        {/* selected line from Ver Líneas */}
        {lineasVisibles.map((l) => {
          if (!l.puntos || l.puntos.length < 2) return null;
          const v = l.puntos.filter(cOk).map(toCoord);
          return v.length > 1 ? <Polyline key={l.id} coordinates={v} strokeColor={colors.primary} strokeWidth={3} /> : null;
        })}

        {/* active buses on selected line */}
        {Object.values(busesEnLinea).map((bus) => (
          <Marker
            key={bus.viajeId}
            coordinate={{ latitude: bus.lat, longitude: bus.lng }}
            rotation={bus.rumbo}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.busMarker}>
              <View style={styles.busDot} />
            </View>
          </Marker>
        ))}

        {/* calculated route from opciones */}
        {ruta?.segmentos?.map((seg: any, i: number) =>
          seg.tipo === 'bus' ? (
            <Polyline key={`b-${i}`} coordinates={seg.puntosRuta.map(toCoord)} strokeColor={colors.primary} strokeWidth={6} />
          ) : (
            <Polyline key={`w-${i}`} coordinates={seg.puntosRuta.map(toCoord)} strokeColor="#9ca3af" strokeWidth={4} lineDashPattern={[6, 4]} />
          )
        )}

        {/* walking markers */}
        {ruta?.segmentos
          ?.filter((s: any) => s.tipo === 'caminata')
          .flatMap((s: any, i: number) => [
            <Marker key={`ws-${i}`} coordinate={toCoord(s.desde)} pinColor="#9ca3af" title={`Caminar ${s.distanciaMetros}m`} />,
            <Marker key={`we-${i}`} coordinate={toCoord(s.hasta)} pinColor="#9ca3af" />,
          ])}

        {/* boarding / alighting */}
        {ruta?.segmentos
          ?.filter((s: any) => s.tipo === 'bus')
          .flatMap((s: any, i: number) => [
            <Marker key={`emb-${i}`} coordinate={toCoord(s.embarque)} pinColor={colors.primary} title={`Subir: ${s.linea.nombre}`} />,
            <Marker key={`des-${i}`} coordinate={toCoord(s.descenso)} pinColor="#ff4444" title={`Bajar: ${s.linea.nombre}`} />,
          ])}

        {/* origin / destination markers */}
        {origen && cOk(origen) && <Marker coordinate={origen} title="Origen" pinColor="#00d992" />}
        {destino && cOk(destino) && <Marker coordinate={destino} title="Destino" pinColor="#ff4444" />}
      </MapView>

      {/* center pin */}
      {paso && (
        <View style={styles.pinCentro}>
          <View style={styles.pinHead} />
          <View style={styles.pinBody} />
        </View>
      )}

      {/* loading overlay */}
      {calculando && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
          <VoltText type="body" color={colors.mute} style={{ marginTop: 12 }}>Calculando ruta...</VoltText>
        </View>
      )}

      {/* error banner */}
      {error && !calculando && (
        <View style={styles.errorBanner}>
          <VoltText type="body-sm" color="#ff4444">{error}</VoltText>
          <Pressable onPress={() => setError(null)} style={{ marginLeft: 12 }}>
            <VoltText type="body-sm" color={colors.primary}>X</VoltText>
          </Pressable>
        </View>
      )}

      {/* normal bottom bar */}
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

      {/* calcular step bar */}
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
          <Pressable style={styles.btnSm} onPress={confirmarPaso}>
            <VoltText type="button" color={colors.onPrimary}>{paso === 'origen' ? 'Origen' : 'Destino'}</VoltText>
          </Pressable>
        </View>
      )}

      {/* step banner */}
      {paso && (
        <View style={styles.banner}>
          <VoltText type="caption" color={colors.primary}>
            {paso === 'origen' ? 'Desliza el mapa. El centro marca tu origen' : 'Desliza el mapa. El centro marca tu destino'}
          </VoltText>
        </View>
      )}
    </View>
  );
}

/* ─── styles ─── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  map: { width: '100%', height: '100%' },
  loader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(16,16,16,0.8)' },
  errorBanner: { position: 'absolute', top: 16, left: 16, right: 16, padding: 12, borderRadius: 10, backgroundColor: 'rgba(255,68,68,0.15)', borderWidth: 1, borderColor: '#ff4444', flexDirection: 'row', alignItems: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12 },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary },
  btnOutline: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: colors.canvasSoft, borderWidth: 1, borderColor: colors.hairline },
  calcBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12 },
  btnSm: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary },
  btnOutlineSm: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.canvasSoft, borderWidth: 1, borderColor: colors.hairline },
  stepIndicator: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.hairline, borderWidth: 2, borderColor: colors.hairline },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepLine: { width: 24, height: 2, backgroundColor: colors.hairline },
  pinCentro: { position: 'absolute', top: '50%', left: '50%', marginLeft: -12, marginTop: -36, alignItems: 'center' },
  pinHead: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, borderWidth: 3, borderColor: '#000' },
  pinBody: { width: 3, height: 24, backgroundColor: colors.primary },
  banner: { position: 'absolute', top: 16, left: 16, right: 16, padding: 10, borderRadius: 10, backgroundColor: 'rgba(0,217,146,0.15)', borderWidth: 1, borderColor: colors.primary, alignItems: 'center' },
  busMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,217,146,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#000',
  },
});
