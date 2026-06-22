import { ScrollView, Pressable, View, StyleSheet } from 'react-native';
import { VoltText } from '@/components/volt-text';
import { colors } from '@/constants/colors';

export interface LineaSelectable {
  id: string;
  nombre: string;
  codigo: string;
  color: string;
}

interface LineSelectorProps {
  lineas: LineaSelectable[];
  selectedLineId: string | null;
  onSelect: (id: string | null) => void;
}

export function LineSelector({ lineas, selectedLineId, onSelect }: LineSelectorProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable
          style={[styles.chip, selectedLineId === null && styles.chipActive]}
          onPress={() => onSelect(null)}
        >
          <VoltText
            type="body-sm"
            color={selectedLineId === null ? colors.onPrimary : colors.ink}
          >
            Todas
          </VoltText>
        </Pressable>

        {lineas.map((linea) => {
          const active = selectedLineId === linea.id;
          return (
            <Pressable
              key={linea.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(linea.id)}
            >
              <View style={[styles.dot, { backgroundColor: active ? colors.onPrimary : linea.color }]} />
              <VoltText
                type="body-sm"
                color={active ? colors.onPrimary : colors.ink}
              >
                {linea.codigo || linea.nombre}
              </VoltText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CHIP_HEIGHT = 36;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    zIndex: 10,
    height: CHIP_HEIGHT + 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: CHIP_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: CHIP_HEIGHT / 2,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
