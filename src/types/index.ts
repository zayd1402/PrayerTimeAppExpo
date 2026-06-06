// ─── Design Tokens — Light Gold Sunset ──────────────────────
export const C = {
  // Backgrounds — warm cream tones
  bgBase:       '#FDF8F3',  // warm cream base
  bgSurface:    '#FFFFFF',  // white
  heroBg:       '#FCE4C9',  // soft peach gold — hero card gradient start

  // Accent — Warm Gold
  gold:         '#D4A03C',  // warm gold accent
  goldLight:    '#E8C97A',  // light gold
  goldPale:     '#F5E6CC',  // pale gold

  // Accent — Warm Coral (replaces green/emerald for active states)
  coral:        '#E8826B',  // warm coral — primary active accent
  coralPale:    '#FDE8E2',  // pale coral background

  // Timer
  timerAmber:   '#E8A045',  // warm amber for countdown display

  // Secondary accents
  warmAmber:    '#E8A87C',  // soft amber
  rose:         '#E8B4B8',  // soft rose
  warmBlue:     '#8BA4C7',  // muted warm blue
  red:          '#DC2626',  // keep — it's a semantic color

  // Text — warm browns (no cold navy)
  textPrimary:  '#3D2C1A',  // warm dark brown
  textSecondary:'#8B7355',  // warm medium brown
  textMuted:    '#B8A088',  // warm muted brown

  // Borders — warm tones
  border:       '#EDE0D4',  // warm cream border
  borderStrong: '#DCC8B8',  // stronger warm border

  // Radius scale
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },

  // Typography scale — matching DESIGN.md hierarchy
  type: {
    display:  { fontSize: 32, fontWeight: '700' as const, lineHeight: 1.15 },
    headline: { fontSize: 22, fontWeight: '700' as const, lineHeight: 1.25 },
    title:    { fontSize: 16, fontWeight: '600' as const, lineHeight: 1.3  },
    body:     { fontSize: 14, fontWeight: '400' as const, lineHeight: 1.55 },
    label:    { fontSize: 12, fontWeight: '500' as const, lineHeight: 1.3  },
    caption:  { fontSize: 10, fontWeight: '500' as const, lineHeight: 1.2  },
  },

  // ─── Deprecated aliases (migrate to the names above) ─────
  // These exist so the app doesn't break mid-migration.
  // Once all source files use coral/coralPale, remove these.
  /** @deprecated Use C.coral instead */
  emerald:     '#E8826B',
  /** @deprecated Use C.coralPale instead */
  emeraldPale: '#FDE8E2',
  /** @deprecated Use C.textPrimary instead */
  navy:        '#3D2C1A',
  /** @deprecated Use C.textSecondary instead */
  navySoft:    '#8B7355',
  /** @deprecated Use C.rose instead */
  purple:      '#E8B4B8',
  /** @deprecated Use C.warmAmber instead */
  teal:        '#E8A87C',
  /** @deprecated Use C.gold instead */
  green:       '#D4A03C',
  /** @deprecated Use C.warmBlue instead */
  blue:        '#8BA4C7',
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
