// ─── Design Tokens ───────────────────────────────────────────
//
// Single source of truth for color, type, spacing, and elevation.
// Theme-aware: light + dark variants are defined separately; the
// `useTheme()` hook from src/theme/ThemeProvider picks one at runtime.
//
// Sign convention for status semantics:
//   - "Prayed" → emerald  (positive / success)
//   - "Active" → emerald  (current / in-window)
//   - "Passed" → muted    (de-emphasized)
//   - "Featured" → gold   (premium / highlight)

import { Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export interface ThemePalette {
  // Backgrounds — 5 M3 elevation levels
  bgBase:            string;  // canvas
  bgSurface:         string;  // level 0
  bgSurfaceVariant:  string;  // level 1
  bgSurfaceContainer:string;  // level 2
  bgSurfaceHigh:     string;  // level 3

  // Brand
  heroBg:            string;  // dark header / hero card
  navy:              string;
  navySoft:          string;
  onHero:            string;  // text/icon on heroBg

  // Accent
  gold:              string;
  goldLight:         string;
  goldPale:          string;
  goldOn:            string;  // text on gold
  timerAmber:        string;

  emerald:           string;
  emeraldPale:       string;
  emeraldOn:         string;  // text on emerald

  // Functional accents
  purple:            string;
  teal:              string;
  green:             string;
  blue:              string;
  red:               string;
  amber:             string;   // for the "joyful" mood in journal

  // Text — 4 levels
  textPrimary:       string;
  textSecondary:     string;
  textMuted:         string;
  textOnAccent:      string;  // generic "on accent" (white-ish)

  // Borders
  border:            string;
  borderStrong:      string;

  // Status backgrounds (subtle tints used on rows/badges)
  bgPrayed:          string;  // next prayer row tint
  bgActive:          string;  // active prayer row tint
  bgPassed:          string;  // passed prayer row tint
  bgMuted:           string;  // generic subtle bg
  bgFeatured:        string;  // "Dua of the day" gold tint
  bgTint:            string;  // 8% accent overlay

  // Shadow
  shadow:            string;

  // Inverse (for use on dark hero)
  onDarkMuted:       string;
}

// ─── LIGHT PALETTE (the original) ─────────────────────────────
const light: ThemePalette = {
  bgBase:             '#FAF6EF',
  bgSurface:          '#FFFFFF',
  bgSurfaceVariant:   '#F4EFE5',
  bgSurfaceContainer: '#EDE6D6',
  bgSurfaceHigh:      '#E4DBC6',

  heroBg:             '#014836',
  navy:               '#071A35',
  navySoft:           '#1A3560',
  onHero:             '#FFFFFF',

  gold:               '#B8892F',
  goldLight:          '#D4AF6A',
  goldPale:           '#F0E4C8',
  goldOn:             '#FFFFFF',
  timerAmber:         '#FDD370',

  emerald:            '#0F7A4F',
  emeraldPale:        '#D4EDE1',
  emeraldOn:          '#FFFFFF',

  purple:             '#7C3AED',
  teal:               '#0891B2',
  green:              '#059669',
  blue:               '#2563EB',
  red:                '#DC2626',
  amber:              '#F59E0B',

  textPrimary:        '#071A35',
  textSecondary:      '#6B7280',
  textMuted:          '#9CA3AF',
  textOnAccent:       '#FFFFFF',

  border:             'rgba(7,26,53,0.08)',
  borderStrong:       'rgba(7,26,53,0.15)',

  bgPrayed:           '#F0FAF5',
  bgActive:           '#E8F5F0',
  bgPassed:           '#FAFAFA',
  bgMuted:            '#F5F5F0',
  bgFeatured:         '#FFF8E7',
  bgTint:             'rgba(15,122,79,0.08)',

  shadow:             'rgba(7,26,53,0.12)',
  onDarkMuted:        'rgba(255,255,255,0.7)',
};

// ─── DARK PALETTE ─────────────────────────────────────────────
// Same brand language, inverted surface. Gold + emerald read great
// on dark navy; we keep them but bump saturation slightly.
const dark: ThemePalette = {
  bgBase:             '#0A0F1A',
  bgSurface:          '#101726',
  bgSurfaceVariant:   '#172033',
  bgSurfaceContainer: '#1E2940',
  bgSurfaceHigh:      '#28344E',

  heroBg:             '#014836',  // keep hero brand-recognizable
  navy:               '#E6ECF7',  // primary text on dark
  navySoft:           '#A6B3CC',
  onHero:             '#FFFFFF',

  gold:               '#D4AF6A',
  goldLight:          '#E5C689',
  goldPale:           '#3D2F12',
  goldOn:             '#1A1208',
  timerAmber:         '#FDD370',

  emerald:            '#3FBF85',
  emeraldPale:        '#10321F',
  emeraldOn:          '#04140C',

  purple:             '#A78BFA',
  teal:               '#22D3EE',
  green:              '#34D399',
  blue:               '#60A5FA',
  red:                '#F87171',
  amber:              '#FBBF24',

  textPrimary:        '#F1F5F9',
  textSecondary:      '#94A3B8',
  textMuted:          '#64748B',
  textOnAccent:       '#FFFFFF',

  border:             'rgba(255,255,255,0.08)',
  borderStrong:       'rgba(255,255,255,0.18)',

  bgPrayed:           'rgba(63,191,133,0.10)',
  bgActive:           'rgba(63,191,133,0.16)',
  bgPassed:           'rgba(255,255,255,0.03)',
  bgMuted:            'rgba(255,255,255,0.04)',
  bgFeatured:         'rgba(212,175,106,0.10)',
  bgTint:             'rgba(63,191,133,0.10)',

  shadow:             'rgba(0,0,0,0.6)',
  onDarkMuted:        'rgba(255,255,255,0.7)',
};

export const palettes: Record<ColorScheme, ThemePalette> = { light, dark };

// ─── Legacy "C" object (light palette, kept for back-compat) ──
//
// New code should import from src/theme/ThemeProvider (useTheme)
// or from this file via `palettes.light`. The flat C object is
// kept so the existing 200+ style references keep working during
// the migration; once everything uses useTheme() it can go.
export const C = light;

// ─── Radius scale ────────────────────────────────────────────
export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

// ─── Spacing scale (4-pt grid) ────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Typography scale (M3-aligned) ────────────────────────────
//
// display — hero numerals, splash
// headline — page titles, large card titles
// title — section headers, card titles
// body — primary content
// label — buttons, chips, nav labels
// caption — metadata, hints
export const FONT = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  medium:  Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }) as string,
  bold:    Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
};

export const TYPE = {
  display:  { fontFamily: FONT.bold,    fontSize: 36, lineHeight: 44, fontWeight: '700' as const, letterSpacing: -0.5 },
  headline: { fontFamily: FONT.bold,    fontSize: 24, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.2 },
  title:    { fontFamily: FONT.medium,  fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body:     { fontFamily: FONT.regular, fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  label:    { fontFamily: FONT.medium,  fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  caption:  { fontFamily: FONT.regular, fontSize: 11, lineHeight: 14, fontWeight: '400' as const },
};

export const TYPE_NUMERIC = {
  ...TYPE,
  display:  { ...TYPE.display,  fontVariant: ['tabular-nums'] as const },
  headline: { ...TYPE.headline, fontVariant: ['tabular-nums'] as const },
  title:    { ...TYPE.title,    fontVariant: ['tabular-nums'] as const },
  body:     { ...TYPE.body,     fontVariant: ['tabular-nums'] as const },
};

// ─── Elevation / shadow presets ──────────────────────────────
export const ELEVATION = {
  none: {},
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  level3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// ─── Breakpoints (for adaptive layouts) ──────────────────────
export const BREAKPOINTS = {
  phone: 0,
  tablet: 600,  // NavigationRail kicks in
  desktop: 1024,
} as const;

// ─── Animation durations ─────────────────────────────────────
export const MOTION = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

// ─── Re-export prayer config (kept here for back-compat) ──────
export const PRAYER_IDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerId = typeof PRAYER_IDS[number];

export interface PrayerTime {
  id: PrayerId;
  name: string;
  arabic: string;
  icon: string;
  iconActive: string;
  time: string;
  minutes: number;
  status: 'upcoming' | 'active' | 'passed';
}

export interface PrayerLogEntry {
  date: string;
  prayerId: PrayerId;
  status: 'prayed' | 'qaza' | 'missed';
  time?: string;
}

export type CalculationMethod =
  | 'muslim_world_league' | 'egyptian' | 'umm_al_qura' | 'isna' | 'karachi'
  | 'dubai' | 'qatar' | 'kuwait' | 'moonsighting_committee' | 'singapore'
  | 'tehran' | 'north_america' | 'custom';
export type Madhab = 'shafi' | 'hanafi';

export interface AppSettings {
  calculationMethod: CalculationMethod;
  madhab: Madhab;
  notificationsEnabled: boolean;
  fajrAlarmEnabled: boolean;
  fajrAlarmMinutes: number;
  iqamaCountdownEnabled: boolean;
  location: { latitude: number; longitude: number; name: string } | null;
  themePreference: 'light' | 'dark' | 'system';
  onboardingComplete: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  calculationMethod: 'muslim_world_league',
  madhab: 'shafi',
  notificationsEnabled: true,
  fajrAlarmEnabled: false,
  fajrAlarmMinutes: 15,
  iqamaCountdownEnabled: false,
  location: null,
  themePreference: 'system',
  onboardingComplete: false,
};

export const NAV_TABS = [
  { id: 'home',      label: 'Home',      icon: 'home-outline',      iconActive: 'home'      },
  { id: 'worship',   label: 'Worship',   icon: 'heart-outline',     iconActive: 'heart'     },
  { id: 'calendar',  label: 'Calendar',  icon: 'calendar-outline',  iconActive: 'calendar'  },
  { id: 'duas',      label: 'Duas',      icon: 'book-outline',      iconActive: 'book'      },
  { id: 'qibla',     label: 'Qibla',     icon: 'compass-outline',   iconActive: 'compass'   },
] as const;

export type TabId = typeof NAV_TABS[number]['id'];

export const PRAYER_ICONS: Record<PrayerId, { icon: string; iconActive: string }> = {
  fajr:    { icon: 'sunny-outline',        iconActive: 'sunny'        },
  sunrise: { icon: 'partly-sunny-outline', iconActive: 'partly-sunny' },
  dhuhr:   { icon: 'sun-outline',          iconActive: 'sun'          },
  asr:     { icon: 'cloud-outline',        iconActive: 'cloud'        },
  maghrib: { icon: 'sunset-outline',       iconActive: 'sunset'       },
  isha:    { icon: 'moon-outline',         iconActive: 'moon'         },
};

// ─── Drawer destinations (extras beyond the 5 tabs) ─────────
export const DRAWER_ITEMS = [
  { id: 'hadith',    label: 'Hadith',     icon: 'document-text-outline', color: C.gold,    desc: '30 authentic hadiths' },
  { id: 'friday',    label: 'Friday',     icon: 'star-outline',         color: C.purple,  desc: 'Surah Al-Kahf & khutbah' },
  { id: 'weekly',    label: 'Weekly',     icon: 'calendar-clear-outline', color: C.teal,  desc: 'Sunnah revival tracker' },
  { id: 'zakat',     label: 'Zakat',      icon: 'wallet-outline',       color: C.green,   desc: 'Calculator & charity log' },
  { id: 'journal',   label: 'Journal',    icon: 'create-outline',       color: C.blue,    desc: 'Prayer reflections' },
  { id: 'mosques',   label: 'Mosques',    icon: 'location-outline',     color: C.teal,    desc: 'Find nearby mosques' },
  { id: 'settings',  label: 'Settings',   icon: 'settings-outline',     color: C.textSecondary, desc: 'Preferences & calculation' },
] as const;

export type DrawerItemId = typeof DRAWER_ITEMS[number]['id'];

// ─── Dua types ──────────────────────────────────────────────
export interface Dua {
  id: string;
  title: string;
  arabic: string;
  transliteration?: string;
  meaning: string;
  source?: string;
  category: DuaCategory;
  repeatCount?: number;
  isFavorite?: boolean;
}

export type DuaCategory =
  | 'morning' | 'evening' | 'sleep' | 'waking'
  | 'mosque' | 'travel' | 'eating' | 'home'
  | 'prayer' | 'protection' | 'forgiveness' | 'gratitude'
  | 'sickness' | 'distress' | 'general';

export const DUA_CATEGORIES: { value: DuaCategory; label: string; icon: string }[] = [
  { value: 'morning',     label: 'Morning',     icon: 'sunny-outline' },
  { value: 'evening',     label: 'Evening',     icon: 'moon-outline' },
  { value: 'sleep',       label: 'Before Sleep',icon: 'bed-outline' },
  { value: 'waking',      label: 'After Waking',icon: 'alarm-outline' },
  { value: 'mosque',      label: 'Mosque',      icon: 'business-outline' },
  { value: 'travel',      label: 'Travel',      icon: 'airplane-outline' },
  { value: 'eating',      label: 'Eating',      icon: 'restaurant-outline' },
  { value: 'home',        label: 'Home',        icon: 'home-outline' },
  { value: 'prayer',      label: 'Prayer',      icon: 'hand-left-outline' },
  { value: 'protection',  label: 'Protection',  icon: 'shield-outline' },
  { value: 'forgiveness', label: 'Forgiveness', icon: 'water-outline' },
  { value: 'gratitude',   label: 'Gratitude',   icon: 'heart-outline' },
  { value: 'sickness',    label: 'Sickness',    icon: 'medical-outline' },
  { value: 'distress',    label: 'Distress',    icon: 'sad-outline' },
  { value: 'general',     label: 'General',     icon: 'chatbubble-outline' },
];

// ─── Hadith types ───────────────────────────────────────────
export interface Hadith {
  id: string;
  arabic: string;
  english: string;
  narrator: string;
  source: string;
  book: string;
  chapter?: string;
  grade: 'sahih' | 'hasan' | 'daif';
  category: string;
  isFavorite?: boolean;
}

// ─── Fasting types ──────────────────────────────────────────
export interface FastingLog {
  date: string;
  type: 'ramadan' | 'monday' | 'thursday' | 'white_days' | 'ashura' | 'arafah' | 'custom' | 'makeup';
  completed: boolean;
  notes?: string;
}

// ─── Quran Tracker types ────────────────────────────────────
export interface QuranLog {
  date: string;
  pagesRead: number;
  surah?: string;
  ayahStart?: number;
  ayahEnd?: number;
  notes?: string;
}

// ─── Dhikr History types ────────────────────────────────────
export interface DhikrSession {
  id: string;
  date: string;
  subhanallah: number;
  alhamdulillah: number;
  allahuakbar: number;
  custom?: { label: string; count: number }[];
}

// ─── Zakat types ────────────────────────────────────────────
export interface ZakatRecord {
  id: string;
  date: string;
  goldValue: number;
  silverValue: number;
  cash: number;
  investments: number;
  debts: number;
  totalAssets: number;
  zakatDue: number;
  paid: boolean;
}

export interface CharityRecord {
  id: string;
  date: string;
  amount: number;
  category: 'sadaqah' | 'zakat' | 'fidya' | 'kaffarah' | 'general';
  recipient?: string;
  notes?: string;
}

// ─── Prayer Journal types ───────────────────────────────────
export interface PrayerJournalEntry {
  id: string;
  date: string;
  prayerId: PrayerId;
  mood: 'peaceful' | 'grateful' | 'distracted' | 'tired' | 'joyful' | 'anxious';
  reflection?: string;
  gratitude?: string;
  improvement?: string;
}

// ─── Islamic Event types ────────────────────────────────────
export interface IslamicEvent {
  id: string;
  title: string;
  titleArabic?: string;
  hijriDate: { day: number; month: number };
  gregorianDate?: string;
  type: 'ramadan' | 'eid' | 'hajj' | 'ashura' | 'mawlid' | 'laylatul_qadr' | 'white_days' | 'jumuah' | 'general';
  description?: string;
  isFixedHijri: boolean;
}

// ─── Weekly Activity types ──────────────────────────────────
export interface WeeklyActivity {
  id: string;
  title: string;
  description: string;
  dayOfWeek: number;
  type: 'fasting' | 'sunnah' | 'quran' | 'dhikr' | 'charity' | 'reminder';
  isEnabled: boolean;
}
