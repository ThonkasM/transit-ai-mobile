import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { VoltText } from '@/components/volt-text';
import { colors } from '@/constants/colors';
import { api } from '@/utils/api';
import { getSelectedId, setLineas, setSelectedId } from '@/shared/selected-line';

interface Linea {
  id: string;
  nombre: string;
  codigo: string;
  color: string;
  puntos: { latitude: number; longitude: number }[];
}

export default function LineasScreen() {
  const [lineas, setLocalLineas] = useState<Linea[]>([]);
  const selId = getSelectedId();

  useEffect(() => {
    api.get<Linea[]>('/planificador/lineas-mapa', { skipAuth: true })
      .then((data) => {
        setLineas(data);
        setLocalLineas(data);
      })
      .catch(() => {});
  }, []);

  const seleccionar = (id: string) => {
    setSelectedId(selId === id ? null : id);
    router.back();
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={lineas}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.item, selId === item.id && styles.itemActive]}
            onPress={() => seleccionar(item.id)}
          >
            <View style={{ flex: 1 }}>
              <VoltText type="body" color={selId === item.id ? colors.onPrimary : colors.ink}>
                {item.nombre}
              </VoltText>
              <VoltText type="caption" color={selId === item.id ? colors.onPrimary : colors.mute}>
                {item.codigo}
              </VoltText>
            </View>
          </Pressable>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas, paddingTop: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    marginHorizontal: 16, marginTop: 10,
    borderRadius: 12, backgroundColor: colors.canvasSoft,
    borderWidth: 1, borderColor: colors.hairline,
  },
  itemActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});
