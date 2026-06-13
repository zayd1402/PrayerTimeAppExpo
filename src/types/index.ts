export const C = {
  bgBase: '#FDF8F0',
  bgSurface: '#F8F1E5',
  bgCard: '#F2E8D5',
  primary: '#C27A2D',
  primaryDark: '#9E5C1A',
  primaryLight: '#F0D9B0',
  gold: '#B8860B',
  goldLight: '#D4A843',
  goldPale: '#FBF0D5',
  surfaceElevated: '#F5ECD8',
  surfacePressed: '#EBDFC5',
  heroBg: '#3D2415',
  shadow: {
    shadowColor: 'rgba(61,36,21,0.10)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  timerAmber: '#B8860B',
  textPrimary: '#2D2010',
  textSecondary: '#6B5030',
  textMuted: '#8C7855',
  red: '#C4553B',
  white: '#FFFFFF',
  border: 'rgba(45,32,16,0.08)',
  borderStrong: 'rgba(45,32,16,0.15)',
  radius: {
    sm: 12,
    md: 14,
    lg: 16,
    xl: 24,
  },
  type: {
    display: { fontSize: 32, fontWeight: '700' as const, lineHeight: 1.15 },
    headline: { fontSize: 22, fontWeight: '700' as const, lineHeight: 1.25 },
    title: { fontSize: 16, fontWeight: '600' as const, lineHeight: 1.3 },
    body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 1.55 },
    label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 1.3 },
    caption: { fontSize: 10, fontWeight: '500' as const, lineHeight: 1.2 },
  },
};

export const PRAYER_IDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerId = typeof PRAYER_IDS[number];
export type PrayerNotificationId = Exclude<PrayerId, 'sunrise'>;

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
  | 'muslim_world_league'
  | 'egyptian'
  | 'umm_al_qura'
  | 'isna'
  | 'karachi'
  | 'dubai'
  | 'qatar'
  | 'kuwait'
  | 'moonsighting_committee'
  | 'singapore'
  | 'tehran'
  | 'north_america'
  | 'custom';

export type Madhab = 'shafi' | 'hanafi';
export type LocationSource = 'device' | 'manual-city';

export interface AppLocation {
  latitude: number;
  longitude: number;
  name: string;
  source?: LocationSource;
  timezone?: string;
}

export interface AppSettings {
  calculationMethod: CalculationMethod;
  madhab: Madhab;
  notificationsEnabled: boolean;
  liveCountdownEnabled: boolean;
  prayerNotifications: Record<PrayerNotificationId, boolean>;
  fajrAlarmEnabled: boolean;
  fajrAlarmMinutes: number;
  iqamaCountdownEnabled: boolean;
  location: AppLocation | null;
  adhanEnabled: boolean;
  adhanVariant: string;
  adhanVolume: number;
}

export const DEFAULT_PRAYER_NOTIFICATIONS: Record<PrayerNotificationId, boolean> = {
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
};

export const DEFAULT_SETTINGS: AppSettings = {
  calculationMethod: 'muslim_world_league',
  madhab: 'shafi',
  notificationsEnabled: false,
  liveCountdownEnabled: true,
  prayerNotifications: DEFAULT_PRAYER_NOTIFICATIONS,
  fajrAlarmEnabled: false,
  fajrAlarmMinutes: 15,
  iqamaCountdownEnabled: false,
  location: null,
  adhanEnabled: true,
  adhanVariant: 'default',
  adhanVolume: 1.0,
};

export const NAV_TABS = [
  { id: 'today', label: 'Today', icon: 'today-outline', iconActive: 'today' },
  { id: 'worship', label: 'Worship', icon: 'heart-outline', iconActive: 'heart' },
  { id: 'qibla-mosques', label: 'Qibla & Mosques', icon: 'navigate-outline', iconActive: 'navigate' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar-outline', iconActive: 'calendar' },
  { id: 'learn', label: 'Learn', icon: 'book-outline', iconActive: 'book' },
] as const;

export type TabId = typeof NAV_TABS[number]['id'];

export const PRAYER_ICONS: Record<PrayerId, { icon: string; iconActive: string }> = {
  fajr: { icon: 'sunny-outline', iconActive: 'sunny' },
  sunrise: { icon: 'partly-sunny-outline', iconActive: 'partly-sunny' },
  dhuhr: { icon: 'sun-outline', iconActive: 'sun' },
  asr: { icon: 'cloud-outline', iconActive: 'cloud' },
  maghrib: { icon: 'sunset-outline', iconActive: 'sunset' },
  isha: { icon: 'moon-outline', iconActive: 'moon' },
};

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
  | 'morning'
  | 'evening'
  | 'sleep'
  | 'waking'
  | 'mosque'
  | 'travel'
  | 'eating'
  | 'home'
  | 'prayer'
  | 'protection'
  | 'forgiveness'
  | 'gratitude'
  | 'sickness'
  | 'distress'
  | 'general';

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

export interface FastingLog {
  date: string;
  type: 'ramadan' | 'monday' | 'thursday' | 'white_days' | 'ashura' | 'arafah' | 'custom' | 'makeup';
  completed: boolean;
  notes?: string;
}

export interface QuranLog {
  date: string;
  pagesRead: number;
  surah?: string;
  ayahStart?: number;
  ayahEnd?: number;
  notes?: string;
}

export interface DhikrSession {
  id: string;
  date: string;
  subhanallah: number;
  alhamdulillah: number;
  allahuakbar: number;
  custom?: { label: string; count: number }[];
}

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

export interface PrayerJournalEntry {
  id: string;
  date: string;
  prayerId: PrayerId;
  mood: 'peaceful' | 'grateful' | 'distracted' | 'tired' | 'joyful' | 'anxious';
  reflection?: string;
  gratitude?: string;
  improvement?: string;
}

export interface IslamicEvent {
  id: string;
  title: string;
  titleArabic?: string;
  hijriDate: { day: number; month: number };
  gregorianDate?: string;
  type: 'ramadan' | 'eid' | 'hajj' | 'ashura' | 'mawlid' | 'laylatul_qadr' | 'white_days' | 'jumuah' | 'general';
  description?: string;
  descriptionArabic?: string;
  isFixedHijri: boolean;
}

export type KhushuLevel = 1 | 2 | 3 | 4 | 5;
export type DistractionType = 'phone' | 'noise' | 'thoughts' | 'tired' | 'rushed' | 'none';

export interface KhushuEntry {
  date: string;
  prayerId: PrayerId;
  level: KhushuLevel;
  distractions: DistractionType[];
  prePrayerPrep: {
    wuduPresence: boolean;
    arrivedEarly: boolean;
    recitedAdhkar: boolean;
  };
  note?: string;
}

export interface WeeklyActivity {
  id: string;
  title: string;
  description: string;
  dayOfWeek: number;
  type: 'fasting' | 'sunnah' | 'quran' | 'dhikr' | 'charity' | 'reminder';
  icon?: string;
  action?: FastingLog['type'];
  isEnabled?: boolean;
}
