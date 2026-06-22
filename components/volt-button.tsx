import { Pressable, type PressableProps, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { rounded, spacing } from '@/constants/spacing';
import { VoltText } from './volt-text';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

interface VoltButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function VoltButton({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  ...rest
}: VoltButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyles: Record<ButtonVariant, object> = {
    primary: {
      backgroundColor: colors.primary,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: colors.canvas,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
  };

  const variantTextColors: Record<ButtonVariant, string> = {
    primary: colors.onPrimary,
    outline: colors.ink,
    ghost: colors.primarySoft,
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantTextColors[variant]} size="small" />
      ) : (
        <VoltText type="button" color={variantTextColors[variant]}>
          {title}
        </VoltText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
