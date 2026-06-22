import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { VoltText } from '@/components/volt-text';
import { colors } from '@/constants/colors';
import { spacing, rounded } from '@/constants/spacing';
import { billeteraServicio, type Movimiento } from '@/utils/billetera';

const TIPO_INFO: Record<string, { label: string; color: string; signo: string }> = {
  TOPUP: { label: 'Recarga', color: '#00d992', signo: '+' },
  FARE_PAYMENT: { label: 'Pasaje', color: '#3b82f6', signo: '\u2212' },
  PASS_PURCHASE: { label: 'Abono', color: '#a855f7', signo: '\u2212' },
};

export default function HistorialScreen() {
  const [movs, setMovs] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billeteraServicio.miHistorial()
      .then(setMovs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={movs}
      keyExtractor={(m) => m.id}
      contentContainerStyle={styles.list}
      contentInsetAdjustmentBehavior="automatic"
      ListEmptyComponent={
        <View style={styles.empty}>
          <VoltText type="body" color={colors.mute} style={{ textAlign: 'center' }}>
            Todavía no tenés movimientos. Recargá saldo o pagá un pasaje para verlos acá.
          </VoltText>
        </View>
      }
      renderItem={({ item: m }) => {
        const info = TIPO_INFO[m.tipo] ?? { label: m.tipo, color: colors.mute, signo: '' };
        return (
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: info.color + '1a' }]}>
              <VoltText type="caption" color={info.color} style={{ fontWeight: '600' }}>
                {info.signo}
              </VoltText>
            </View>
            <View style={styles.rowText}>
              <VoltText type="body-sm" color={colors.ink} style={{ fontWeight: '600' }}>
                {info.label}
              </VoltText>
              <VoltText type="caption" color={colors.mute}>
                {fmtFecha(m.fecha)}
              </VoltText>
            </View>
            <VoltText type="body" color={info.color} style={{ fontWeight: '700' }}>
              {info.signo} Bs {m.montoBs.toFixed(2)}
            </VoltText>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.xl,
    paddingBottom: spacing['6xl'],
    gap: spacing.sm,
  },
  empty: {
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    padding: spacing.md,
    backgroundColor: colors.canvas,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
});
