import { View, StyleSheet } from 'react-native';
import { VoltText } from '@/components/volt-text';
import { VoltButton } from '@/components/volt-button';
import { useAuth } from '@/contexts/auth';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={styles.root}>
      <VoltText type="title" color={colors.inkStrong}>Perfil</VoltText>
      <VoltText type="body" color={colors.body}>{user?.nombre}</VoltText>
      <VoltText type="body-sm" color={colors.mute}>{user?.email}</VoltText>
      <VoltButton title="Cerrar Sesión" variant="outline" onPress={logout} />
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.canvas, padding: 24, gap: spacing.lg, justifyContent: 'center', alignItems: 'center' } });
