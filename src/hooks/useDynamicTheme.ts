import { useEffect } from 'react';
import { ThemeColors } from '@/hooks/useLandingContent';

const defaultThemeColors: ThemeColors = {
  primary: '0 72% 51%',
  primaryForeground: '0 0% 100%',
  accent: '0 0% 10%',
  background: '0 0% 100%',
  foreground: '0 0% 5%',
  muted: '0 0% 96%',
  mutedForeground: '0 0% 45%',
};

export const useDynamicTheme = (themeColors?: ThemeColors) => {
  useEffect(() => {
    const colors = themeColors || defaultThemeColors;
    const root = document.documentElement;

    // Apply theme colors to CSS variables
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-foreground', colors.primaryForeground);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--muted-foreground', colors.mutedForeground);
    root.style.setProperty('--ring', colors.primary);
    
    // Also update card and popover to match
    root.style.setProperty('--card', colors.background);
    root.style.setProperty('--card-foreground', colors.foreground);
    root.style.setProperty('--popover', colors.background);
    root.style.setProperty('--popover-foreground', colors.foreground);

    // Cleanup function to reset to default on unmount
    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-foreground');
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--muted-foreground');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--card');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--popover');
      root.style.removeProperty('--popover-foreground');
    };
  }, [themeColors]);
};
