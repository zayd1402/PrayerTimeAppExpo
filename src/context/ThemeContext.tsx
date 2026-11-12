import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { mmkv } from '../services/StorageService';
import { C, darkC } from '../types';

export { darkC };

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

/** Names of tokens that hold a colour, for data tables that pick a colour by role. */
export type ColorToken = Exclude<{ [K in keyof Tokens]: Tokens[K] extends string ? K : never }[keyof Tokens], 'fontArabic' | 'fontArabicBold'>;

export function useTokens(): Tokens {
  const { isDark } = useTheme();
  return isDark ? darkC : C;
}

type StyleFactory<S> = (tokens: Tokens) => S;
const styleCache = new WeakMap<StyleFactory<unknown>, { light?: unknown; dark?: unknown }>();

/**
 * Builds a screen's styles from the current theme's tokens. Each factory runs at
 * most once per theme, so switching theme is cheap and every screen re-renders
 * with the right colours. Use it instead of a module-level StyleSheet.create
 * that reads C, which freezes the light colours at import time.
 */
export function useThemedStyles<S>(factory: StyleFactory<S>): S {
  const { isDark } = useTheme();
  const key = isDark ? 'dark' : 'light';
  let entry = styleCache.get(factory as StyleFactory<unknown>);
  if (!entry) {
    entry = {};
    styleCache.set(factory as StyleFactory<unknown>, entry);
  }
  if (entry[key] === undefined) entry[key] = factory(isDark ? darkC : C);
  return entry[key] as S;
}
