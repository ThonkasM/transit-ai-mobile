import { useState } from 'react';
import { Link } from 'expo-router';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { VoltText } from '@/components/volt-text';
import { VoltButton } from '@/components/volt-button';
import { useAuth } from '@/contexts/auth';
import { colors } from '@/constants/colors';
import { spacing, rounded } from '@/constants/spacing';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <VoltText type="eyebrow-mono" color={colors.primarySoft}>TRANSIT AI</VoltText>
      <VoltText type="section" color={colors.inkStrong}>Iniciar Sesión</VoltText>

      <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor={colors.mute}
        keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <View style={styles.passwordRow}>
        <TextInput style={styles.passwordInput} placeholder="Contraseña" placeholderTextColor={colors.mute}
          secureTextEntry={!showPassword} value={password} onChangeText={setPassword} onSubmitEditing={handleLogin} />
        <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
          <MaterialCommunityIcons name={showPassword ? 'eye' : 'eye-off'} size={22} color={colors.mute} />
        </Pressable>
      </View>

      {error ? <VoltText type="caption" color={colors.primaryDeep}>{error}</VoltText> : null}

      <VoltButton title="Iniciar Sesión" variant="primary" fullWidth loading={loading} onPress={handleLogin} />
      <Link href="/register">
        <VoltText type="body-sm" color={colors.primarySoft}>¿No tienes cuenta? Crear una</VoltText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing['3xl'], gap: spacing.lg, alignItems: 'center', backgroundColor: colors.canvas },
  input: { width: '100%', backgroundColor: colors.canvasSoft, color: colors.ink, borderWidth: 1, borderColor: colors.hairline, borderRadius: rounded.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: 16, minHeight: 48 },
  passwordRow: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, backgroundColor: colors.canvasSoft, color: colors.ink, borderWidth: 1, borderColor: colors.hairline, borderRadius: rounded.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: 16, minHeight: 48 },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
});
