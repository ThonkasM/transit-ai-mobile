import { Stack } from 'expo-router/stack';

export default function MapaLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="lineas" options={{ presentation: 'modal', headerShown: true, headerTitle: 'Líneas', headerStyle: { backgroundColor: '#101010' }, headerTintColor: '#f2f2f2' }} />
      <Stack.Screen name="opciones" options={{ headerShown: true, headerTitle: 'Opciones de ruta', headerStyle: { backgroundColor: '#101010' }, headerTintColor: '#f2f2f2' }} />
    </Stack>
  );
}
