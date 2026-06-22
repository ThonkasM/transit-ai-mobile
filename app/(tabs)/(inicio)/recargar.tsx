import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Linking } from 'react-native';
import { VoltText } from '@/components/volt-text';
import { VoltButton } from '@/components/volt-button';
import { VoltInput } from '@/components/volt-input';
import { colors } from '@/constants/colors';
import { spacing, rounded } from '@/constants/spacing';
import { billeteraServicio } from '@/utils/billetera';

const MONTOS_FIJOS = [10, 20, 50, 100];
const METODOS = [
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

export default function RecargarScreen() {
  const [monto, setMonto] = useState('20');
  const [metodo, setMetodo] = useState('TARJETA');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
  const [stripeReturned, setStripeReturned] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const handleStripe = async () => {
    const m = parseFloat(monto);
    if (!(m > 0)) return;
    setStripeLoading(true);
    setMensaje(null);
    try {
      const { url } = await billeteraServicio.stripeCheckout({ monto: m });
      const match = url.match(/cs_[a-zA-Z0-9]+/);
      if (match) setStripeSessionId(match[0]);
      setStripeReturned(false);
      await Linking.openURL(url);
      setStripeReturned(true);
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo iniciar el pago con Stripe.' });
    } finally {
      setStripeLoading(false);
    }
  };

  const handleConfirmar = async () => {
    if (!stripeSessionId) return;
    setConfirmLoading(true);
    setMensaje(null);
    try {
      const r = await billeteraServicio.stripeConfirmar({ sessionId: stripeSessionId }) as { recargaBs?: number };
      setMensaje({
        tipo: 'ok',
        texto: r.recargaBs ? `¡Recarga exitosa de Bs ${r.recargaBs.toFixed(2)}!` : '¡Recarga acreditada!',
      });
      setStripeReturned(false);
      setStripeSessionId(null);
    } catch {
      setMensaje({ tipo: 'error', texto: 'El pago aún no se completó o ya fue procesado.' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSimular = async () => {
    const m = parseFloat(monto);
    if (!(m > 0)) return;
    setSimLoading(true);
    setMensaje(null);
    try {
      const r = await billeteraServicio.recargar({ monto: m, metodo });
      setMensaje({
        tipo: 'ok',
        texto: `¡Recarga exitosa de Bs ${r.recargaBs.toFixed(2)}! Saldo actual: Bs ${r.saldoBs.toFixed(2)}`,
      });
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo realizar la recarga.' });
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.card}>
        <VoltText type="title" color={colors.inkStrong}>Recargar saldo</VoltText>
        <VoltText type="body-sm" color={colors.mute}>
          Pagá con tarjeta real de prueba (Stripe) o simulá la recarga. El saldo se acredita al instante.
        </VoltText>

        {mensaje && (
          <View
            style={[
              styles.msgBox,
              mensaje.tipo === 'ok' ? styles.msgOk : styles.msgError,
            ]}
          >
            <VoltText
              type="body-sm"
              color={mensaje.tipo === 'ok' ? colors.primary : colors.primaryDeep}
              style={{ fontWeight: '600' }}
            >
              {mensaje.texto}
            </VoltText>
          </View>
        )}

        <VoltText type="caption" color={colors.body} style={styles.label}>
          Monto (Bs)
        </VoltText>
        <View style={styles.montosRow}>
          {MONTOS_FIJOS.map((m) => {
            const sel = monto === String(m);
            return (
              <Pressable
                key={m}
                onPress={() => setMonto(String(m))}
                style={[styles.montoBtn, sel && styles.montoBtnActive]}
              >
                <VoltText
                  type="body"
                  color={sel ? colors.onPrimary : colors.body}
                  style={{ fontWeight: '700' }}
                >
                  {m}
                </VoltText>
              </Pressable>
            );
          })}
        </View>

        <VoltInput
          placeholder="Otro monto"
          value={monto}
          onChangeText={setMonto}
          keyboardType="numeric"
        />

        <VoltText type="caption" color={colors.body} style={styles.label}>
          Método de pago
        </VoltText>
        <View style={styles.metodosRow}>
          {METODOS.map(({ value, label }) => {
            const sel = metodo === value;
            return (
              <Pressable
                key={value}
                onPress={() => setMetodo(value)}
                style={[styles.metodoBtn, sel && styles.metodoBtnActive]}
              >
                <VoltText type="body-sm" color={sel ? colors.primary : colors.body}>
                  {label}
                </VoltText>
              </Pressable>
            );
          })}
        </View>

        {/* Stripe */}
        <VoltButton
          title={
            stripeLoading
              ? 'Abriendo Stripe...'
              : `Pagar con tarjeta · Bs ${parseFloat(monto || '0').toFixed(2)}`
          }
          variant="primary"
          fullWidth
          onPress={handleStripe}
          loading={stripeLoading}
          disabled={!(parseFloat(monto) > 0)}
        />

        <VoltText type="caption" color={colors.mute} style={{ textAlign: 'center' }}>
          Tarjeta de prueba: 4242 4242 4242 4242 · cualquier fecha futura y CVC
        </VoltText>

        {stripeReturned && stripeSessionId && (
          <View style={styles.confirmSection}>
            <VoltText type="body-sm" color={colors.body} style={{ textAlign: 'center' }}>
              ¿Completaste el pago en Stripe?
            </VoltText>
            <VoltButton
              title={confirmLoading ? 'Verificando...' : 'Verificar pago'}
              variant="outline"
              fullWidth
              onPress={handleConfirmar}
              loading={confirmLoading}
            />
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <VoltText type="caption" color={colors.mute}>o simular</VoltText>
          <View style={styles.dividerLine} />
        </View>

        <VoltButton
          title={
            simLoading
              ? 'Recargando...'
              : `Simular recarga Bs ${parseFloat(monto || '0').toFixed(2)}`
          }
          variant="outline"
          fullWidth
          onPress={handleSimular}
          loading={simLoading}
          disabled={!(parseFloat(monto) > 0)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing['6xl'] },
  card: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  msgBox: {
    borderRadius: rounded.sm,
    borderWidth: 1,
    padding: spacing.md,
  },
  msgOk: {
    borderColor: colors.primary,
  },
  msgError: {
    borderColor: colors.primaryDeep,
  },
  label: {
    marginBottom: -spacing.sm,
  },
  montosRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  montoBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
  },
  montoBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  metodosRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  metodoBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
  },
  metodoBtnActive: {
    borderColor: colors.primary,
  },
  confirmSection: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.hairline,
  },
});
