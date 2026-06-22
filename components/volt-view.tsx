import { View, type ViewProps } from 'react-native';
import { colors } from '@/constants/colors';

export function VoltView({ style, ...rest }: ViewProps) {
  return <View style={[{ backgroundColor: colors.canvas }, style]} {...rest} />;
}
