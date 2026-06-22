import { Stack } from 'expo-router/stack';
import { colors } from '@/constants/colors';

export default function DriverInicioLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Inicio', headerLargeTitle: true }} />
    </Stack>
  );
}
