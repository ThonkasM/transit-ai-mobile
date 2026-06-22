import { View, StyleSheet, Pressable } from 'react-native';
import { VoltText } from '@/components/volt-text';
import { colors } from '@/constants/colors';
import { spacing, rounded } from '@/constants/spacing';
import { useAuth } from '@/contexts/auth';

export default function DriverPerfilScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <VoltText type="hero" color={colors.primary}>
            {user?.nombre?.charAt(0)?.toUpperCase() ?? 'C'}
          </VoltText>
        </View>
        <VoltText type="title" color={colors.ink} style={styles.name}>
          {user?.nombre ?? 'Chofer'}
        </VoltText>
        <VoltText type="body" color={colors.mute}>
          {user?.email ?? ''}
        </VoltText>
        <View style={styles.roleBadge}>
          <VoltText type="caption" color={colors.primary}>Chofer</VoltText>
        </View>
      </View>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <VoltText type="button" color="#ff4444">Cerrar Sesión</VoltText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    gap: spacing['2xl'],
    paddingTop: spacing['4xl'],
  },
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing['2xl'],
    borderRadius: rounded.md,
    backgroundColor: colors.canvasSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,217,146,0.1)',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: { marginTop: spacing.xs },
  roleBadge: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: rounded.pill,
    backgroundColor: 'rgba(0,217,146,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,146,0.3)',
  },
  logoutBtn: {
    paddingVertical: spacing.lg,
    borderRadius: rounded.md,
    backgroundColor: 'rgba(255,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.25)',
    alignItems: 'center',
  },
});
