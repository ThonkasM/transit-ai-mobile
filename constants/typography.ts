import { TextStyle } from 'react-native';

const inter = 'Inter, system-ui, -apple-system, sans-serif';
const mono = 'SFMono-Regular, Menlo, Monaco, Consolas, monospace';

export const typography: Record<string, TextStyle> = {
  'display-xl': {
    fontFamily: inter,
    fontSize: 60,
    fontWeight: '400',
    lineHeight: 60,
    letterSpacing: -0.65,
  },
  'display-lg': {
    fontFamily: inter,
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 40,
    letterSpacing: -0.9,
  },
  'display-md': {
    fontFamily: inter,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  'display-sm': {
    fontFamily: inter,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  'eyebrow-mono': {
    fontFamily: inter,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 2.52,
    textTransform: 'uppercase',
  },
  'body-lg': {
    fontFamily: inter,
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
  },
  'body-md': {
    fontFamily: inter,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 26,
  },
  'body-md-strong': {
    fontFamily: inter,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  'body-sm': {
    fontFamily: inter,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  'body-sm-strong': {
    fontFamily: inter,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 23,
  },
  caption: {
    fontFamily: inter,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  'caption-strong': {
    fontFamily: inter,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  code: {
    fontFamily: mono,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  'button-md': {
    fontFamily: inter,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
} as const;
