import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { VoltText } from '@/components/volt-text';
import { VoltButton } from '@/components/volt-button';
import { colors } from '@/constants/colors';
import { spacing, rounded } from '@/constants/spacing';
import { choferServicio, type AsignacionHoy } from '@/utils/chofer';

export default function DriverInicioScreen() {
  const [asignacion, setAsignacion] = useState<AsignacionHoy | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [lineaId, setLineaId] = useState<string | null>(null);

  useEffect(() => {
    choferServicio
      .obtenerAsignacionHoy()
      .then((data) => {
        setAsignacion(data);
        if (data?.route?.id) setLineaId(data.route.id);
      })
      .catch(() => setAsignacion(null))
      .finally(() => setCargando(false));
  }, []);

  const alEscanear = useCallback(
    async (result: BarcodeScanningResult) => {
      if (escaneando) return;
      setEscaneando(true);
      setMostrarCamara(false);

      try {
        if (!lineaId) {
          Alert.alert('Error', 'No se pudo determinar la línea del viaje.');
          return;
        }
        const res = await choferServicio.pagarQr(result.data, lineaId);
        if (res.ok) {
          Alert.alert('Cobro exitoso', `Se cobró Bs ${res.tarifaPagadaBs} al pasajero.`);
        } else {
          Alert.alert('Error', res.mensaje ?? 'No se pudo procesar el pago.');
        }
      } catch (err: any) {
        Alert.alert('Error', err?.message ?? 'Error al procesar el QR.');
      } finally {
        setEscaneando(false);
      }
    },
    [escaneando, lineaId]
  );

  const abrirCamara = useCallback(async () => {
    if (!permiso?.granted) {
      const result = await pedirPermiso();
      if (!result.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para escanear QR.');
        return;
      }
    }
    setMostrarCamara(true);
  }, [permiso, pedirPermiso]);

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (mostrarCamara) {
    return (
      <View style={styles.cameraRoot}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={alEscanear}
        />
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraFrame} />
          <VoltText type="caption" color={colors.ink} style={styles.cameraHint}>
            Apunta al código QR del pasajero
          </VoltText>
          <Pressable
            style={styles.cancelBtn}
            onPress={() => setMostrarCamara(false)}
          >
            <VoltText type="button" color={colors.ink}>Cancelar</VoltText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <VoltText type="section" color={colors.ink} style={styles.sectionTitle}>
        Mi Turno
      </VoltText>

      {!asignacion ? (
        <View style={styles.emptyCard}>
          <VoltText type="title" color={colors.ink}>Sin asignación hoy</VoltText>
          <VoltText type="body-sm" color={colors.mute} style={{ marginTop: spacing.sm }}>
            El administrador aún no te asignó una ruta para hoy.
          </VoltText>
        </View>
      ) : (
        <View style={styles.asignacionCard}>
          <View style={styles.row}>
            <VoltText type="title" color={colors.primary}>{asignacion.route.name}</VoltText>
          </View>
          <View style={styles.row}>
            <VoltText type="body-sm" color={colors.mute}>
              Bus {asignacion.internal.internalNumber} · {asignacion.internal.licensePlate}
            </VoltText>
          </View>
          <View style={styles.row}>
            <VoltText type="body-sm" color={colors.mute}>
              {asignacion.startTime?.slice(0, 5)} — {asignacion.endTime?.slice(0, 5)}
              {asignacion.shift ? ` · ${asignacion.shift.name}` : ''}
            </VoltText>
          </View>
          {asignacion.trips?.length > 0 && (
            <View style={styles.row}>
              <View style={styles.tripDot} />
              <VoltText type="body-sm" color={colors.primary}>Viaje en curso</VoltText>
            </View>
          )}
        </View>
      )}

      <View style={styles.divider} />

      <VoltText type="section" color={colors.ink} style={styles.sectionTitle}>
        Cobrar Pasaje
      </VoltText>
      <VoltText type="body-sm" color={colors.mute} style={styles.subtitle}>
        Escanea el código QR del pasajero para cobrar el pasaje
      </VoltText>

      <VoltButton
        title={escaneando ? 'Procesando...' : 'Escanear QR'}
        variant="primary"
        fullWidth
        loading={escaneando}
        onPress={abrirCamara}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['4xl'] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
  sectionTitle: { marginTop: spacing.sm },
  subtitle: { marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: colors.hairline, marginVertical: spacing.md },
  emptyCard: {
    padding: spacing['2xl'],
    borderRadius: rounded.md,
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
  },
  asignacionCard: {
    padding: spacing.lg,
    borderRadius: rounded.md,
    backgroundColor: 'rgba(0,217,146,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,146,0.2)',
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tripDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: colors.primary },
  cameraRoot: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  cameraFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: rounded.md,
    backgroundColor: 'transparent',
  },
  cameraHint: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: spacing['2xl'],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderRadius: rounded.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
