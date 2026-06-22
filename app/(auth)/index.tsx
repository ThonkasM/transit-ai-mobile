import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { VoltText } from '@/components/volt-text';
import { VoltButton } from '@/components/volt-button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <VoltText type="eyebrow-mono" color={colors.primarySoft}>TRANSIT AI</VoltText>
      <VoltText type="hero" color={colors.inkStrong} style={styles.headline}>
        {'Transporte\ninteligente\npara tu ciudad'}
      </VoltText>
      <VoltText type="body" color={colors.body} style={styles.subtitle}>
        Planifica tus rutas, sigue los buses en tiempo real y paga tu pasaje desde la app.
      </VoltText>
      <VoltButton title="Iniciar Sesión" variant="primary" fullWidth onPress={() => router.push('/login')} />
      <VoltButton title="Crear Cuenta" variant="outline" fullWidth onPress={() => router.push('/register')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing['3xl'], gap: spacing.xl, backgroundColor: colors.canvas },
  headline: { marginTop: spacing.sm },
  subtitle: { marginBottom: spacing.xl },
});
