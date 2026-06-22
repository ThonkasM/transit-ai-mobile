import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { QrCode } from '@/components/qr-code';
import { VoltText } from '@/components/volt-text';
import { VoltButton } from '@/components/volt-button';
import { colors } from '@/constants/colors';
import { spacing, rounded } from '@/constants/spacing';
import {
  billeteraServicio,
  lineasServicio,
  type ResumenBilletera,
  type Linea,
  type ResultadoPago,
  type ResultadoQr,
  type EstadoAbono,
} from '@/utils/billetera';

const TABS = [
  { id: 'pagar' as const, label: 'Pagar' },
  { id: 'recargar' as const, label: 'Recargar' },
  { id: 'abono' as const, label: 'Abono' },
  { id: 'historial' as const, label: 'Movimientos' },
];

const CATEGORIA_LABEL: Record<string, string> = {
  GENERAL: 'General',
  ESTUDIANTE: 'Estudiante',
  ADULTO_MAYOR: 'Adulto mayor',
};

export default function BilleteraIndex() {
  const [tab, setTab] = useState<'pagar' | 'recargar' | 'abono' | 'historial'>('pagar');
  const [bil, setBil] = useState<ResumenBilletera | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [loadingBil, setLoadingBil] = useState(true);

  const cargar = () => {
    setLoadingBil(true);
    billeteraServicio.miBilletera().then(setBil).catch(() => {}).finally(() => setLoadingBil(false));
    lineasServicio.obtenerTodas().then(setLineas).catch(() => {});
  };

  useEffect(() => { cargar(); }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Balance card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <VoltText type="body-sm" color={colors.mute}>Mi billetera</VoltText>
          <Pressable onPress={cargar} style={styles.refreshBtn}>
            <VoltText type="caption" color={colors.primarySoft}>Actualizar</VoltText>
          </Pressable>
        </View>
        {loadingBil ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : (
          <>
            <VoltText type="hero" color={colors.inkStrong} style={styles.balanceAmount}>
              Bs {bil?.saldoBs.toFixed(2) ?? '0.00'}
            </VoltText>
            {bil?.categoria && (
              <View style={styles.categoriaBadge}>
                <VoltText type="caption" color={colors.primary}>
                  {CATEGORIA_LABEL[bil.categoria] ?? bil.categoria}
                </VoltText>
              </View>
            )}
          </>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const activo = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tab, activo && styles.tabActive]}
            >
              <VoltText
                type="body-sm"
                color={activo ? colors.primary : colors.mute}
              >
                {t.label}
              </VoltText>
            </Pressable>
          );
        })}
      </View>

      {/* Tab content */}
      {tab === 'pagar' && (
        <PagarTab lineas={lineas} onRefresh={cargar} />
      )}
      {tab === 'recargar' && (
        <View style={styles.tabContent}>
          <VoltText type="body" color={colors.body}>
            Recargá saldo para pagar tus pasajes. Elegí entre tarjeta o transferencia.
          </VoltText>
          <VoltButton
            title="Ir a recargar"
            variant="primary"
            fullWidth
            onPress={() => router.push('/(tabs)/(inicio)/recargar')}
          />
        </View>
      )}
      {tab === 'abono' && (
        <AbonoTab lineas={lineas} onRefresh={cargar} />
      )}
      {tab === 'historial' && (
        <View style={styles.tabContent}>
          <VoltText type="body" color={colors.body}>
            Consultá tus últimas recargas, pagos y compras de abono.
          </VoltText>
          <VoltButton
            title="Ver movimientos"
            variant="primary"
            fullWidth
            onPress={() => router.push('/(tabs)/(inicio)/historial')}
          />
        </View>
      )}
    </ScrollView>
  );
}

/** ─── PAGAR TAB ──────────────────────────────────────────── */
function PagarTab({ lineas, onRefresh }: { lineas: Linea[]; onRefresh: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [seg, setSeg] = useState(0);
  const [loadingQr, setLoadingQr] = useState(false);
  const [errorQr, setErrorQr] = useState<string | null>(null);
  const qrInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const generarQr = () => {
    setLoadingQr(true);
    setErrorQr(null);
    billeteraServicio.generarQr()
      .then((r: ResultadoQr) => { setQr(r.qr); setSeg(r.expiraEnSeg ?? 90); })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        setErrorQr(`Error: ${msg}`);
      })
      .finally(() => setLoadingQr(false));
  };

  useEffect(() => {
    if (seg <= 0) { setQr(null); return; }
    qrInterval.current = setInterval(() => setSeg((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => { if (qrInterval.current) clearInterval(qrInterval.current); };
  }, [seg]);

  const [lineaPago, setLineaPago] = useState('');
  const [loadingPago, setLoadingPago] = useState(false);
  const [resultadoPago, setResultadoPago] = useState<ResultadoPago | null>(null);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  useEffect(() => { if (lineas.length && !lineaPago) setLineaPago(lineas[0].id); }, [lineas]);

  const pagar = () => {
    if (!lineaPago) return;
    setLoadingPago(true);
    setResultadoPago(null);
    setErrorPago(null);
    billeteraServicio.pagar({ lineaId: lineaPago })
      .then((r) => { setResultadoPago(r); onRefresh(); })
      .catch(() => setErrorPago('No se pudo pagar. Verificá tu saldo.'))
      .finally(() => setLoadingPago(false));
  };

  const lineaSel = lineas.find((l) => l.id === lineaPago);

  return (
    <View style={styles.tabContent}>
      {/* QR section */}
      <View style={styles.card}>
        <VoltText type="title" color={colors.inkStrong}>Pagar con QR</VoltText>
        <VoltText type="body-sm" color={colors.mute} style={styles.cardSub}>
          Mostrá este código al chofer para que lo escanee.
        </VoltText>
        {qr ? (
          <View style={styles.qrContainer}>
            <View style={styles.qrCode}>
              <QrCode value={qr} size={190} backgroundColor="#ffffff" color="#000000" />
            </View>
            <VoltText
              type="caption"
              color={seg <= 15 ? colors.primaryDeep : colors.mute}
            >
              Expira en {seg}s
            </VoltText>
            <VoltButton
              title="Generar nuevo"
              variant="ghost"
              onPress={generarQr}
              loading={loadingQr}
            />
          </View>
        ) : errorQr ? (
          <View style={{ gap: spacing.md, alignItems: 'center' }}>
            <VoltText type="caption" color={colors.primaryDeep}>
              {errorQr}
            </VoltText>
            <VoltButton
              title="Reintentar"
              variant="ghost"
              onPress={generarQr}
            />
          </View>
        ) : (
          <VoltButton
            title={loadingQr ? 'Generando...' : 'Mostrar mi QR'}
            variant="primary"
            fullWidth
            onPress={generarQr}
            loading={loadingQr}
          />
        )}
      </View>

      {/* Manual payment */}
      <View style={styles.card}>
        <VoltText type="title" color={colors.inkStrong}>Pagar pasaje ahora</VoltText>
        <VoltText type="body-sm" color={colors.mute} style={styles.cardSub}>
          Elegí la línea en la que viajás y pagá directamente desde tu saldo.
        </VoltText>

        <VoltText type="caption" color={colors.body} style={styles.label}>
          Línea
        </VoltText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {lineas.map((l) => {
            const sel = lineaPago === l.id;
            return (
              <Pressable
                key={l.id}
                onPress={() => setLineaPago(l.id)}
                style={[styles.chip, sel && styles.chipActive]}
              >
                <VoltText type="caption" color={sel ? colors.onPrimary : colors.body}>
                  {l.name} · Bs {Number(l.fare).toFixed(2)}
                </VoltText>
              </Pressable>
            );
          })}
        </ScrollView>

        <VoltButton
          title={
            loadingPago
              ? 'Pagando...'
              : `Pagar ${lineaSel ? `Bs ${Number(lineaSel.fare).toFixed(2)}` : ''}`
          }
          variant="primary"
          fullWidth
          onPress={pagar}
          loading={loadingPago}
          disabled={!lineaPago}
        />

        {resultadoPago && (
          <View style={styles.successBox}>
            <VoltText type="body-sm" color={colors.primary} style={{ fontWeight: '600' }}>
              Pago realizado
            </VoltText>
            <VoltText type="caption" color={colors.mute}>
              Tarifa base: Bs {resultadoPago.tarifaBaseBs.toFixed(2)} · Descuento: Bs{' '}
              {resultadoPago.descuentoBs.toFixed(2)} ·{' '}
              <VoltText type="caption" color={colors.inkStrong}>
                Pagaste Bs {resultadoPago.tarifaPagadaBs.toFixed(2)}
              </VoltText>
            </VoltText>
          </View>
        )}
        {errorPago && (
          <VoltText type="caption" color={colors.primaryDeep} style={styles.errorText}>
            {errorPago}
          </VoltText>
        )}
      </View>
    </View>
  );
}

/** ─── ABONO TAB ──────────────────────────────────────────── */
function AbonoTab({ lineas, onRefresh }: { lineas: Linea[]; onRefresh: () => void }) {
  const [abono, setAbono] = useState<EstadoAbono | null>(null);
  const [loadingAbono, setLoadingAbono] = useState(true);
  const [lineaAbono, setLineaAbono] = useState('');
  const [loadingComprar, setLoadingComprar] = useState(false);
  const [errorComprar, setErrorComprar] = useState<string | null>(null);

  const cargarAbono = () => {
    setLoadingAbono(true);
    billeteraServicio.abonoActivo().then(setAbono).catch(() => {}).finally(() => setLoadingAbono(false));
  };

  useEffect(() => { cargarAbono(); }, []);

  const comprarAbono = () => {
    setLoadingComprar(true);
    setErrorComprar(null);
    billeteraServicio.comprarAbono(lineaAbono ? { lineaId: lineaAbono } : {})
      .then(() => { cargarAbono(); onRefresh(); })
      .catch(() => setErrorComprar('No se pudo comprar. Verificá tu saldo.'))
      .finally(() => setLoadingComprar(false));
  };

  if (loadingAbono) {
    return (
      <View style={styles.tabContent}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (abono?.activo) {
    return (
      <View style={styles.tabContent}>
        <View style={styles.successBox}>
          <VoltText type="body" color={colors.primary} style={{ fontWeight: '700' }}>
            Tenés un abono activo
          </VoltText>
          <VoltText type="body-sm" color={colors.mute} style={{ marginTop: spacing.xs }}>
            Válido hasta el{' '}
            {abono.validoHasta
              ? new Date(abono.validoHasta).toLocaleDateString('es-BO')
              : '—'}
          </VoltText>
          {abono.precioBs !== undefined && (
            <VoltText type="caption" color={colors.mute}>
              Precio: Bs {abono.precioBs.toFixed(2)}
            </VoltText>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <VoltText type="title" color={colors.inkStrong}>Abono / pase mensual</VoltText>
        <VoltText type="body-sm" color={colors.mute} style={styles.cardSub}>
          Comprá un pase y viajá durante el período de validez. Se paga desde tu saldo.
        </VoltText>
        <VoltText type="caption" color={colors.body} style={styles.label}>
          Línea (opcional)
        </VoltText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <Pressable
            onPress={() => setLineaAbono('')}
            style={[styles.chip, !lineaAbono && styles.chipActive]}
          >
            <VoltText type="caption" color={!lineaAbono ? colors.onPrimary : colors.body}>
              Todas las líneas
            </VoltText>
          </Pressable>
          {lineas.map((l) => {
            const sel = lineaAbono === l.id;
            return (
              <Pressable
                key={l.id}
                onPress={() => setLineaAbono(l.id)}
                style={[styles.chip, sel && styles.chipActive]}
              >
                <VoltText type="caption" color={sel ? colors.onPrimary : colors.body}>
                  {l.name}
                </VoltText>
              </Pressable>
            );
          })}
        </ScrollView>
        <VoltButton
          title={loadingComprar ? 'Comprando...' : 'Comprar abono'}
          variant="primary"
          fullWidth
          onPress={comprarAbono}
          loading={loadingComprar}
        />
        {errorComprar && (
          <VoltText type="caption" color={colors.primaryDeep} style={styles.errorText}>
            {errorComprar}
          </VoltText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing['6xl'] },
  balanceCard: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: rounded.md,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.canvasSoft,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  balanceAmount: {
    marginVertical: spacing.sm,
    fontSize: 32,
  },
  categoriaBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: rounded.pill,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    backgroundColor: colors.canvas,
  },
  tabActive: {
    borderColor: colors.primary,
  },
  tabContent: {
    gap: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.md,
    padding: spacing.xl,
    backgroundColor: colors.canvas,
    gap: spacing.md,
  },
  cardSub: {
    marginTop: -spacing.sm,
  },
  qrContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  qrCode: {
    width: 222,
    height: 222,
    backgroundColor: '#ffffff',
    padding: spacing.lg,
    borderRadius: rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  label: {
    marginBottom: -spacing.sm,
    marginTop: spacing.sm,
  },
  chipScroll: {
    maxHeight: 36,
    marginBottom: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  successBox: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: rounded.sm,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  errorText: {
    textAlign: 'center',
  },
});
