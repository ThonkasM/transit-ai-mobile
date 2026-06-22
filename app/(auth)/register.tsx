import { useState } from 'react';
import { Link } from 'expo-router';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { VoltText } from '@/components/volt-text';
import { VoltButton } from '@/components/volt-button';
import { useAuth } from '@/contexts/auth';
import { colors } from '@/constants/colors';
import { spacing, rounded } from '@/constants/spacing';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError('');
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError('Completa los campos obligatorios');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register({ email: email.trim(), nombre: nombre.trim(), password, telefono: telefono.trim() || undefined });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} contentInsetAdjustmentBehavior="automatic">
          <VoltText type="eyebrow-mono" color={colors.primarySoft}>TRANSIT AI</VoltText>
          <VoltText type="section" color={colors.inkStrong}>Crear Cuenta</VoltText>

          <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor={colors.mute}
            autoCapitalize="words" value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor={colors.mute}
            keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Teléfono (opcional)" placeholderTextColor={colors.mute}
            keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
          <View style={styles.passwordRow}>
            <TextInput style={styles.passwordInput} placeholder="Contraseña (mín. 6 caracteres)" placeholderTextColor={colors.mute}
              secureTextEntry={!showPassword} value={password} onChangeText={setPassword} onSubmitEditing={handleRegister} />
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <MaterialCommunityIcons name={showPassword ? 'eye' : 'eye-off'} size={22} color={colors.mute} />
            </Pressable>
          </View>

          {error ? <VoltText type="caption" color={colors.primaryDeep}>{error}</VoltText> : null}

          <VoltButton title="Crear Cuenta" variant="primary" fullWidth loading={loading} onPress={handleRegister} />
          <Link href="/login">
            <VoltText type="body-sm" color={colors.primarySoft}>¿Ya tienes cuenta? Iniciar Sesión</VoltText>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing['3xl'], gap: spacing.lg, alignItems: 'center' },
  input: { width: '100%', backgroundColor: colors.canvasSoft, color: colors.ink, borderWidth: 1, borderColor: colors.hairline, borderRadius: rounded.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: 16, minHeight: 48 },
  passwordRow: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, backgroundColor: colors.canvasSoft, color: colors.ink, borderWidth: 1, borderColor: colors.hairline, borderRadius: rounded.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: 16, minHeight: 48 },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
});
