import { Text, type TextProps } from 'react-native';
import { typography } from '@/constants/typography';
import { colors } from '@/constants/colors';

type TextType = keyof typeof typography | 'hero' | 'section' | 'title' | 'body' | 'body-sm' | 'caption' | 'button';

const typeMap: Record<string, keyof typeof typography> = {
  hero: 'display-lg',
  section: 'display-md',
  title: 'display-sm',
  body: 'body-md',
  'body-sm': 'body-sm',
  caption: 'caption',
  button: 'button-md',
};

interface VoltTextProps extends TextProps {
  type?: TextType;
  color?: string;
}

export function VoltText({ style, type = 'body', color, ...rest }: VoltTextProps) {
  const resolvedType = typeMap[type] ?? type;

  return (
    <Text
      style={[
        typography[resolvedType],
        { color: color ?? colors.ink },
        style,
      ]}
      {...rest}
    />
  );
}
