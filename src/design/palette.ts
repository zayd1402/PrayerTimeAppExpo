// Colours that sit outside the core light/dark tokens: the time-of-day skies on Today and
// the heat-map ramp on Habits. Values come from the approved design (v2, 12 Nov 2026).
import { useTheme } from '../context/ThemeContext';

export type SkyState = 'dawn' | 'day' | 'golden' | 'maghrib' | 'night';

export interface Sky {
  top: string;
  bottom: string;
  /** Main text on the sky. */
  fg: string;
  /** Secondary text on the sky. */
  fg2: string;
  /** Translucent fill for chips and empty progress segments on the sky. */
  wash: string;
}

const LIGHT_SKIES: Record<SkyState, Sky> = {
  dawn: { top: '#4B3247', bottom: '#8A4E52', fg: '#FFF4E2', fg2: 'rgba(255,244,226,0.78)', wash: 'rgba(255,244,226,0.16)' },
  day: { top: '#EFC98E', bottom: '#F7E2BC', fg: '#2D2010', fg2: 'rgba(45,32,16,0.70)', wash: 'rgba(45,32,16,0.12)' },
  golden: { top: '#D99A4E', bottom: '#ECC488', fg: '#2A1A0C', fg2: 'rgba(42,26,12,0.74)', wash: 'rgba(42,26,12,0.13)' },
  maghrib: { top: '#5A2A22', bottom: '#A8492C', fg: '#FFF4E2', fg2: 'rgba(255,244,226,0.80)', wash: 'rgba(255,244,226,0.16)' },
  night: { top: '#120D0B', bottom: '#3D2415', fg: '#FFF4E2', fg2: 'rgba(255,244,226,0.72)', wash: 'rgba(255,244,226,0.14)' },
};

// Dark mode keeps the same hues, dimmed, so the screen never gets bright at night.
const DARK_SKIES: Record<SkyState, Sky> = {
  dawn: { top: '#2A1B28', bottom: '#4A2C30', fg: '#FFF4E2', fg2: 'rgba(255,244,226,0.76)', wash: 'rgba(255,244,226,0.14)' },
  day: { top: '#5A4024', bottom: '#3A2A1A', fg: '#F6E9D4', fg2: 'rgba(246,233,212,0.74)', wash: 'rgba(246,233,212,0.14)' },
  golden: { top: '#6E421C', bottom: '#45291A', fg: '#F6E9D4', fg2: 'rgba(246,233,212,0.76)', wash: 'rgba(246,233,212,0.14)' },
  maghrib: { top: '#3E1A16', bottom: '#5A2A1E', fg: '#FFF4E2', fg2: 'rgba(255,244,226,0.78)', wash: 'rgba(255,244,226,0.14)' },
  night: { top: '#0A0705', bottom: '#24170F', fg: '#FFF4E2', fg2: 'rgba(255,244,226,0.72)', wash: 'rgba(255,244,226,0.12)' },
};

/** Heat-map fills for 0 to 5 prayers kept, plus the ink used on each step. */
export interface HeatRamp {
  fills: [string, string, string, string, string, string];
  inks: [string, string, string, string, string, string];
}

const LIGHT_HEAT: HeatRamp = {
  fills: ['#EFE6D6', '#F3D9B1', '#E8BB7D', '#D6974C', '#B8722A', '#8A5016'],
  inks: ['#5E4630', '#2D2010', '#2D2010', '#2D2010', '#FFF6E8', '#FFF6E8'],
};

const DARK_HEAT: HeatRamp = {
  fills: ['#241D17', '#3E2C1A', '#66421F', '#965F27', '#C88537', '#EBAE5C'],
  inks: ['#C4B49C', '#EFE3D1', '#EFE3D1', '#FFF4E2', '#1A120A', '#1A120A'],
};

export function skyFor(state: SkyState, isDark: boolean): Sky {
  return (isDark ? DARK_SKIES : LIGHT_SKIES)[state];
}

export function useSky(state: SkyState): Sky {
  const { isDark } = useTheme();
  return skyFor(state, isDark);
}

export function useHeatRamp(): HeatRamp {
  const { isDark } = useTheme();
  return isDark ? DARK_HEAT : LIGHT_HEAT;
}

export const SKIES = { light: LIGHT_SKIES, dark: DARK_SKIES };
export const HEAT = { light: LIGHT_HEAT, dark: DARK_HEAT };

/** Body and display font names, so screens don't repeat the strings. */
export const F = {
  display: 'BodoniModa_700Bold',
  displayMedium: 'BodoniModa_500Medium',
  body: 'Jost_400Regular',
  medium: 'Jost_500Medium',
  semibold: 'Jost_600SemiBold',
  arabic: 'Amiri_400Regular',
} as const;
