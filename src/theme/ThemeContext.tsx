import React, {createContext, useContext, useMemo} from 'react';
import {COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS} from './index';

type Theme = {
  colors: typeof COLORS;
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  shadows: typeof SHADOWS;
  isDarkMode: boolean;
};

const defaultTheme: Theme = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
  isDarkMode: false,
};

const ThemeContext = createContext<Theme>(defaultTheme);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  // In the future, logic for dark mode can be injected here.
  const theme = useMemo(() => defaultTheme, []);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
