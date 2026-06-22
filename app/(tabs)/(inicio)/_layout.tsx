import { Stack } from 'expo-router/stack';
import { colors } from '@/constants/colors';

export default function InicioLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.canvas },
        headerTitleStyle: { color: colors.ink },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mi Billetera', headerLargeTitle: true }} />
      <Stack.Screen name="recargar" options={{ title: 'Recargar', headerLargeTitle: false }} />
      <Stack.Screen name="historial" options={{ title: 'Movimientos', headerLargeTitle: false }} />
    </Stack>
  );
}
