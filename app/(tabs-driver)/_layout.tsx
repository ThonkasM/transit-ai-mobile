import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '@/constants/colors';

const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  inicio: 'home',
  mapa: 'map',
  perfil: 'account',
};

export default function DriverTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mute,
        tabBarStyle: {
          backgroundColor: colors.canvas,
          borderTopColor: colors.hairline,
        },
      }}
    >
      <Tabs.Screen
        name="(inicio)"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name={iconMap.inicio} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="(mapa)"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name={iconMap.mapa} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="(perfil)"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name={iconMap.perfil} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
