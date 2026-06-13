import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { mmkv } from '../services/StorageService';
import { C } from '../types';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  isDark: false,
  setMode: () => {},
  toggle: () => {},
});

const STORAGE_KEY = '@prayertime:theme_mode';

function updateCTokens(isDark: boolean) {
  const targets = ['bgBase','bgSurface','bgCard','primary','primaryDark','primaryLight','gold','goldLight','goldPale','surfaceElevated','surfacePressed','heroBg','timerAmber','textPrimary','textSecondary','textMuted','red','white','border','borderStrong'] as const;
  const src = isDark ? darkC : C;
  for (const key of targets) {
    (C as Record<string, unknown>)[key] = src[key];
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = mmkv.getString(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return 'system';
  });

  useEffect(() => {
    mmkv.set(STORAGE_KEY, mode);
  }, [mode]);

  const isDark = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark';
    return mode === 'dark';
  }, [mode, systemScheme]);

  // Sync the global C token object to current theme
  useEffect(() => {
    updateCTokens(isDark);
  }, [isDark]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggle = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'system'
        ? (systemScheme === 'dark' ? 'light' : 'dark')
        : prev === 'dark' ? 'light' : 'dark';
      return next;
    });
  }, [systemScheme]);

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export type Tokens = typeof C;

export function useTokens(): Tokens {
  const { isDark } = useTheme();
  return isDark ? darkC : (C as Tokens);
}

// Dark variant of design tokens
export const darkC = {
  bgBase: '#1A1410',
  bgSurface: '#241E18',
  bgCard: '#2D241C',
  primary: '#D4A843',
  primaryDark: '#B8892F',
  primaryLight: '#3D2C18',
  gold: '#E6B84D',
  goldLight: '#C49A3C',
  goldPale: '#2D2418',
  surfaceElevated: '#2D241C',
  surfacePressed: '#3D2C1C',
  heroBg: '#0D0805',
  shadow: { shadowColor: 'rgba(0,0,0,0.3)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12 },
  timerAmber: '#E6B84D',
  textPrimary: '#EDE0D0',
  textSecondary: '#B8A88E',
  textMuted: '#806F58',
  red: '#D47A5C',
  white: '#FFFFFF',
  border: 'rgba(237,224,208,0.08)',
  borderStrong: 'rgba(237,224,208,0.15)',
  radius: { sm: 12, md: 14, lg: 16, xl: 24 },
  type: {
    display: { fontSize: 32, fontWeight: '700' as const, lineHeight: 1.15 },
    headline: { fontSize: 22, fontWeight: '700' as const, lineHeight: 1.25 },
    title: { fontSize: 16, fontWeight: '600' as const, lineHeight: 1.3 },
    body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 1.55 },
    label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 1.3 },
    caption: { fontSize: 10, fontWeight: '500' as const, lineHeight: 1.2 },
  },
};