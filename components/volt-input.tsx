import { TextInput, type TextInputProps, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';
import { rounded, spacing } from '@/constants/spacing';
import { VoltText } from './volt-text';

interface VoltInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function VoltInput({ label, error, style, ...rest }: VoltInputProps) {
  return (
    <View style={styles.wrapper}>
      {label && (
        <VoltText type="caption" color={colors.body} style={styles.label}>
          {label}
        </VoltText>
      )}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.mute}
        {...rest}
      />
      {error && (
        <VoltText type="caption" color={colors.primaryDeep} style={styles.error}>
          {error}
        </VoltText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
    width: '100%',
  },
  label: {
    paddingLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.canvasSoft,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.primaryDeep,
  },
  error: {
    paddingLeft: spacing.xs,
  },
});
