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
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  type: 'fasting' | 'sunnah' | 'quran' | 'dhikr' | 'charity' | 'reminder';
  isEnabled: boolean;
}
