import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import qrcode from 'qrcode-generator';

interface QrCodeProps {
  value: string;
  size: number;
  backgroundColor?: string;
  color?: string;
}

export function QrCode({
  value,
  size,
  backgroundColor = '#ffffff',
  color = '#000000',
}: QrCodeProps) {
  const modules = useMemo(() => {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(value);
      qr.make();
      const count = qr.getModuleCount();
      const mods: { key: string; dark: boolean; x: number; y: number }[] = [];
      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.isDark(row, col)) {
            mods.push({ key: `${row}-${col}`, dark: true, x: col, y: row });
          }
        }
      }
      return { count, mods };
    } catch {
      return { count: 0, mods: [] };
    }
  }, [value]);

  if (modules.count === 0) return null;

  const m = size / modules.count;

  return (
    <View style={[styles.wrapper, { width: size, height: size, backgroundColor }]}>
      {modules.mods.map((mod) => (
        <View
          key={mod.key}
          style={{
            position: 'absolute',
            left: mod.x * m,
            top: mod.y * m,
            width: m + 0.5,
            height: m + 0.5,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
});
