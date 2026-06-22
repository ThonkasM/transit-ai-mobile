import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { VoltText } from '@/components/volt-text';
import { colors } from '@/constants/colors';
import { getOpciones, setRouteIdx } from '@/shared/selected-line';

function SegBus({ s }: { s: any }) {
  return (
    <View style={styles.segBus}>
      <VoltText type="body-sm" color={colors.ink}>
        {s.linea.codigo || s.linea.nombre}
      </VoltText>
      <VoltText type="caption" color={colors.mute}>
        {s.distanciaKm} km · {s.tiempoMin} min · Bs {s.linea.tarifa ?? 0}
      </VoltText>
    </View>
  );
}

function SegWalk({ s }: { s: any }) {
  return (
    <View style={styles.segWalk}>
      <View style={styles.segWalkIcon}>
        <VoltText type="caption" color={colors.mute}>🚶</VoltText>
      </View>
      <View style={{ flex: 1 }}>
        <VoltText type="body-sm" color={colors.ink}>Caminata</VoltText>
        <VoltText type="caption" color={colors.mute}>
          {s.distanciaMetros}m · {s.tiempoMin} min
        </VoltText>
      </View>
    </View>
  );
}

export default function OpcionesScreen() {
  const opciones = getOpciones();

  const seleccionar = (idx: number) => {
    setRouteIdx(idx);
    router.back();
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} bounces={false} showsVerticalScrollIndicator={false}>
        {opciones.map((op, i) => (
          <Pressable key={i} style={styles.card} onPress={() => seleccionar(i)}>
            <View style={styles.cardHeader}>
              <VoltText type="title" color={colors.ink}>Opción {i + 1}</VoltText>
              <VoltText type="body" color={colors.primary}>{op.tiempoTotalMin} min</VoltText>
            </View>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <VoltText type="body-sm" color={colors.ink}>Bs {op.costoTotal}</VoltText>
                <VoltText type="caption" color={colors.mute}>Costo</VoltText>
              </View>
              <View style={styles.stat}>
                <VoltText type="body-sm" color={colors.ink}>{op.caminataMetros}m</VoltText>
                <VoltText type="caption" color={colors.mute}>A pie</VoltText>
              </View>
              <View style={styles.stat}>
                <VoltText type="body-sm" color={colors.ink}>{op.transbordos}</VoltText>
                <VoltText type="caption" color={colors.mute}>Transbordos</VoltText>
              </View>
              <View style={styles.stat}>
                <VoltText type="body-sm" color={colors.ink}>{op.tiempoEsperaMin} min</VoltText>
                <VoltText type="caption" color={colors.mute}>Espera</VoltText>
              </View>
            </View>

            <View style={styles.segments}>
              {op.segmentos.map((seg: any, j: number) =>
                seg.tipo === 'bus'
                  ? <SegBus key={j} s={seg} />
                  : <SegWalk key={j} s={seg} />
              )}
            </View>

            <View style={styles.cardArrow}>
              <VoltText type="body" color={colors.primary}>Seleccionar →</VoltText>
            </View>
          </Pressable>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 16 },
  card: {
    backgroundColor: colors.canvasSoft, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.hairline,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  stats: {
    flexDirection: 'row', gap: 16, marginBottom: 14,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline,
  },
  stat: { alignItems: 'center', flex: 1 },
  segments: { gap: 8, marginBottom: 12 },
  segBus: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.canvas, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  segWalk: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.canvas, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    borderLeftWidth: 3, borderLeftColor: '#9ca3af', borderStyle: 'dashed',
  },
  segWalkIcon: { width: 24, alignItems: 'center' },
  cardArrow: { alignItems: 'flex-end' },
});
