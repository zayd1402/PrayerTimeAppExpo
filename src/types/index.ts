// ─── Design Tokens ───────────────────────────────────────────
export const C = {
  bgBase:       '#FBF5EC',
  bgSurface:    '#FFFDF9',
  bgWarm:       '#F4E8D6',
  navy:         '#071A35',
  navySoft:     '#1B3558',
  gold:         '#B88420',
  goldLight:    '#D7B46A',
  goldPale:     '#F2E4C6',
  emerald:      '#0B7A53',
  emeraldPale:  '#DDEEE4',
  sand:         '#E9D7B8',
  textPrimary:  '#071A35',
  textSecondary:'#5F6572',
  textMuted:    '#9A938A',
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
  calendarIntegrationEnabled: boolean;
  visibleCalendarIds?: string[];
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
  calendarIntegrationEnabled: false,
  visibleCalendarIds: [],
  location: null,
};

export interface CalendarEventSummary {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  calendarTitle: string;
  calendarColor: string;
  isAllDay: boolean;
}

// ─── Navigation ─────────────────────────────────────────────
export const NAV_TABS = [
  { id: 'home',      label: 'Home',      icon: 'home-outline',      iconActive: 'home'      },
  { id: 'qibla',     label: 'Qibla',     icon: 'compass-outline',   iconActive: 'compass'   },
  { id: 'calendar',  label: 'Calendar',  icon: 'calendar-outline',  iconActive: 'calendar'  },
  { id: 'settings',  label: 'Settings',  icon: 'settings-outline',  iconActive: 'settings'  },
] as const;

export type TabId = typeof NAV_TABS[number]['id'];

// ─── Icons Map ───────────────────────────────────────────────
export const PRAYER_ICONS: Record<PrayerId, { icon: string; iconActive: string }> = {
  fajr:    { icon: 'sunny-outline',        iconActive: 'sunny'        },
  sunrise: { icon: 'partly-sunny-outline', iconActive: 'partly-sunny' },
  dhuhr:  { icon: 'sunny-outline',         iconActive: 'sunny'        },
  asr:    { icon: 'cloud-outline',         iconActive: 'cloud'         },
  maghrib:{ icon: 'partly-sunny-outline',  iconActive: 'partly-sunny' },
  isha:   { icon: 'moon-outline',          iconActive: 'moon'          },
};
