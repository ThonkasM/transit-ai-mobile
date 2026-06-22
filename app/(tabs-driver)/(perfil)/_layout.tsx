import { Stack } from 'expo-router/stack';
import { colors } from '@/constants/colors';

export default function DriverPerfilLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.canvas },
        headerTitleStyle: { color: colors.ink },
        headerLargeTitle: true,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Perfil' }} />
    </Stack>
  );
}
