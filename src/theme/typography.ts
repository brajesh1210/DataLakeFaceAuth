import { TextStyle } from 'react-native';
import { COLORS } from './colors';

type TypographyStyles = {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  bodyLarge: TextStyle;
  body: TextStyle;
  bodySmall: TextStyle;
  caption: TextStyle;
  button: TextStyle;
  label: TextStyle;
};

export const TYPOGRAPHY: TypographyStyles = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.text.primary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.text.primary,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.text.primary,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.text.secondary,
  },
  button: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.white,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
};
