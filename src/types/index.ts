// ─── Design Tokens ───────────────────────────────────────────
export const C = {
  bgBase:       '#FAF6EF',
  bgSurface:    '#FFFFFF',
  navy:         '#071A35',
  navySoft:     '#1A3560',
  gold:         '#B8892F',
  goldLight:    '#D4AF6A',
  goldPale:     '#F0E4C8',
  emerald:      '#0F7A4F',
  emeraldPale:  '#D4EDE1',
  textPrimary:  '#071A35',
  textSecondary:'#6B7280',
  textMuted:    '#9CA3AF',
  border:       'rgba(7,26,53,0.08)',
  borderStrong: 'rgba(7,26,53,0.15)',
};

// ─── Prayer IDs & Config ─────────────────────────────────────
export const PRAYER_IDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerId = typeof PRAYER_IDS[number];

export interface PrayerTime {
  id: PrayerId;
  name: string;
  arabic: string;
  icon: string;
  iconActive: string;
  time: string;       // "5:17 AM"
  minutes: number;   // minutes from midnight
  status: 'upcoming' | 'active' | 'passed';
}

export interface PrayerLogEntry {
  date: string;           // "2026-05-15"
  prayerId: PrayerId;
  status: 'prayed' | 'qaza' | 'missed';
  time?: string;          // actual time prayed
}

// ─── Settings Types ─────────────────────────────────────────
export type CalculationMethod = 'muslim_world_league' | 'egyptian' | 'umm_al_qura' | 'isna' | 'karachi';
export type Madhab = 'shafi' | 'hanafi';

export interface AppSettings {
  calculationMethod: CalculationMethod;
  madhab: Madhab;
  notificationsEnabled: boolean;
  fajrAlarmEnabled: boolean;
  fajrAlarmMinutes: number;   // minutes before
  iqamaCountdownEnabled: boolean;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  } | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  calculationMethod: 'muslim_world_league',
  madhab: 'shafi',
  notificationsEnabled: true,
  fajrAlarmEnabled: false,
  fajrAlarmMinutes: 15,
  iqamaCountdownEnabled: false,
  location: null,
};

// ─── Navigation ─────────────────────────────────────────────
export const NAV_TABS = [
  { id: 'home',      label: 'Home',      icon: 'home-outline',      iconActive: 'home'      },
  { id: 'countdown', label: 'Countdown', icon: 'time-outline',      iconActive: 'time'      },
  { id: 'calendar',  label: 'Calendar',  icon: 'calendar-outline',  iconActive: 'calendar'  },
  { id: 'journey',   label: 'Journey',   icon: 'analytics-outline',  iconActive: 'analytics' },
  { id: 'qibla',     label: 'Qibla',     icon: 'compass-outline',   iconActive: 'compass'   },
  { id: 'settings',  label: 'Settings',  icon: 'settings-outline',  iconActive: 'settings'  },
] as const;

export type TabId = typeof NAV_TABS[number]['id'];

// ─── Icons Map ───────────────────────────────────────────────
export const PRAYER_ICONS: Record<PrayerId, { icon: string; iconActive: string }> = {
  fajr:    { icon: 'sunny-outline',        iconActive: 'sunny'        },
  sunrise: { icon: 'partly-sunny-outline', iconActive: 'partly-sunny' },
  dhuhr:  { icon: 'sun-outline',           iconActive: 'sun'          },
  asr:    { icon: 'cloud-outline',         iconActive: 'cloud'         },
  maghrib:{ icon: 'sunset-outline',        iconActive: 'sunset'        },
  isha:   { icon: 'moon-outline',          iconActive: 'moon'          },
};
