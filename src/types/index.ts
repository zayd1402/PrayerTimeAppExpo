// ─── Design Tokens — Neumorphism Purple + Gold ────────────────
// Source: UI-UX-Pro-Max skill — spiritual prayer app design system
// Style: Neumorphism (Soft UI) — embossed depth, monochromatic shifts

export const C = {
  // Backgrounds — lavender-cream spectrum
  bgBase:       '#FAF5FF',  // lavender cream — screen background
  bgSurface:    '#F5EEFF',  // subtle lavender tint for cards
  bgCard:       '#EFE6FF',  // card background (slightly darker for depth)

  // Primary — Spiritual Purple
  primary:      '#7C3AED',  // deep purple — primary accent, active states
  primaryDark:  '#5B21B6',  // darker purple — pressed states
  primaryLight: '#A78BFA',  // light purple — hover, subtle backgrounds

  // Accent — Warm Gold
  gold:         '#CA8A04',  // warm gold — sacred content, hadith, timer
  goldLight:    '#EAB308',  // brighter gold — hover
  goldPale:     '#FEF3C7',  // pale gold — backgrounds

  // Surface variations for neumorphism depth
  surfaceElevated: '#F3ECFF',
  surfacePressed:  '#E8D8FF',

  // Neumorphic shadow tokens
  shadow: {
    sm: { shadowColor: 'rgba(124,58,237,0.12)', shadowOffset: { width: -2, height: -2 }, shadowOpacity: 1, shadowRadius: 6 },
    md: { shadowColor: 'rgba(124,58,237,0.15)', shadowOffset: { width: -4, height: -4 }, shadowOpacity: 1, shadowRadius: 10 },
    lg: { shadowColor: 'rgba(124,58,237,0.18)', shadowOffset: { width: -6, height: -6 }, shadowOpacity: 1, shadowRadius: 16 },
  },

  // Timer
  timerAmber: '#CA8A04',

  // Text — purple spectrum
  textPrimary:  '#4C1D95',  // deep purple — primary text
  textSecondary:'#7C3AED',  // medium purple — secondary text
  textMuted:    '#A78BFA',  // light purple — muted/hints

  // Semantic
  red:          '#DC2626',
  white:        '#FFFFFF',

  // Borders
  border:       'rgba(124,58,237,0.08)',
  borderStrong: 'rgba(124,58,237,0.15)',

  // Radius scale
  radius: {
    sm: 12, md: 14, lg: 16, xl: 24,
  },

  // Typography scale
  type: {
    display:  { fontSize: 32, fontWeight: '700' as const, lineHeight: 1.15 },
    headline: { fontSize: 22, fontWeight: '700' as const, lineHeight: 1.25 },
    title:    { fontSize: 16, fontWeight: '600' as const, lineHeight: 1.3  },
    body:     { fontSize: 14, fontWeight: '400' as const, lineHeight: 1.55 },
    label:    { fontSize: 12, fontWeight: '500' as const, lineHeight: 1.3  },
    caption:  { fontSize: 10, fontWeight: '500' as const, lineHeight: 1.2  },
  },

  // ─── Deprecated aliases — keeps old code compiling ─────
  /** @deprecated Use C.primary */
  emerald:     '#7C3AED',
  /** @deprecated Use C.primaryLight */
  emeraldPale: '#A78BFA',
  /** @deprecated Use C.textPrimary */
  navy:        '#4C1D95',
  /** @deprecated Use C.textSecondary */
  navySoft:    '#7C3AED',
  /** @deprecated Use C.primaryLight */
  purple:      '#A78BFA',
  /** @deprecated Use C.primaryLight */
  teal:        '#A78BFA',
  /** @deprecated Use C.gold */
  green:       '#CA8A04',
  /** @deprecated Use C.primaryLight */
  blue:        '#A78BFA',
  /** @deprecated Use C.primary */
  coral:       '#7C3AED',
  /** @deprecated Use C.primaryLight */
  coralPale:   '#A78BFA',
  /** @deprecated Use C.gold */
  warmAmber:   '#CA8A04',
  /** @deprecated Use C.textSecondary */
  warmBlue:    '#7C3AED',
  /** @deprecated Use C.primaryLight */
  rose:        '#A78BFA',
  /** @deprecated Use C.bgBase */
  heroBg:      '#FAF5FF',
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

// ─── Settings Types ─────────────────────────────────────────
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
  { id: 'worship',   label: 'Worship',   icon: 'heart-outline',     iconActive: 'heart'     },
  { id: 'calendar',  label: 'Calendar',  icon: 'calendar-outline',  iconActive: 'calendar'  },
  { id: 'duas',      label: 'Duas',      icon: 'book-outline',      iconActive: 'book'      },
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

// ─── Dua Types ──────────────────────────────────────────────
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
  { value: 'morning', label: 'Morning', icon: 'sunny-outline' },
  { value: 'evening', label: 'Evening', icon: 'moon-outline' },
  { value: 'sleep', label: 'Before Sleep', icon: 'bed-outline' },
  { value: 'waking', label: 'After Waking', icon: 'alarm-outline' },
  { value: 'mosque', label: 'Mosque', icon: 'business-outline' },
  { value: 'travel', label: 'Travel', icon: 'airplane-outline' },
  { value: 'eating', label: 'Eating', icon: 'restaurant-outline' },
  { value: 'home', label: 'Home', icon: 'home-outline' },
  { value: 'prayer', label: 'Prayer', icon: 'hand-left-outline' },
  { value: 'protection', label: 'Protection', icon: 'shield-outline' },
  { value: 'forgiveness', label: 'Forgiveness', icon: 'water-outline' },
  { value: 'gratitude', label: 'Gratitude', icon: 'heart-outline' },
  { value: 'sickness', label: 'Sickness', icon: 'medical-outline' },
  { value: 'distress', label: 'Distress', icon: 'sad-outline' },
  { value: 'general', label: 'General', icon: 'chatbubble-outline' },
];

// ─── Hadith Types ───────────────────────────────────────────
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

// ─── Fasting Types ──────────────────────────────────────────
export interface FastingLog {
  date: string;
  type: 'ramadan' | 'monday' | 'thursday' | 'white_days' | 'ashura' | 'arafah' | 'custom' | 'makeup';
  completed: boolean;
  notes?: string;
}

// ─── Quran Tracker Types ────────────────────────────────────
export interface QuranLog {
  date: string;
  pagesRead: number;
  surah?: string;
  ayahStart?: number;
  ayahEnd?: number;
  notes?: string;
}

// ─── Dhikr History Types ────────────────────────────────────
export interface DhikrSession {
  id: string;
  date: string;
  subhanallah: number;
  alhamdulillah: number;
  allahuakbar: number;
  custom?: { label: string; count: number }[];
}

// ─── Zakat Types ────────────────────────────────────────────
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

// ─── Prayer Journal Types ───────────────────────────────────
export interface PrayerJournalEntry {
  id: string;
  date: string;
  prayerId: PrayerId;
  mood: 'peaceful' | 'grateful' | 'distracted' | 'tired' | 'joyful' | 'anxious';
  reflection?: string;
  gratitude?: string;
  improvement?: string;
}

// ─── Islamic Event Types ────────────────────────────────────
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

// ─── Weekly Activity Types ──────────────────────────────────
export interface WeeklyActivity {
  id: string;
  title: string;
  description: string;
  dayOfWeek: number;
  type: 'fasting' | 'sunnah' | 'quran' | 'dhikr' | 'charity' | 'reminder';
  isEnabled: boolean;
}
