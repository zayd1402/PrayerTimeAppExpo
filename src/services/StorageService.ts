import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PrayerId, PrayerLogEntry, AppSettings, DEFAULT_SETTINGS,
  Dua, Hadith, FastingLog, QuranLog, DhikrSession, 
  ZakatRecord, CharityRecord, PrayerJournalEntry, IslamicEvent
} from '../types';

// ─── Storage Keys ────────────────────────────────────────────
const KEYS = {
  SETTINGS:       '@prayertime:settings',
  PRAYER_LOG:     '@prayertime:prayer_log',
  LOCATION:       '@prayertime:location',
  FAVORITE_DUAS:  '@prayertime:favorite_duas',
  HADITH_INDEX:   '@prayertime:hadith_index',
  FAVORITE_HADITH:'@prayertime:favorite_hadith',
  FASTING_LOG:    '@prayertime:fasting_log',
  QURAN_LOG:      '@prayertime:quran_log',
  DHIKR_HISTORY:  '@prayertime:dhikr_history',
  ZAKAT_RECORDS:  '@prayertime:zakat_records',
  CHARITY_LOG:    '@prayertime:charity_log',
  PRAYER_JOURNAL: '@prayertime:prayer_journal',
  LAST_HADITH_DATE:'@prayertime:last_hadith_date',
};

// ─── Settings ───────────────────────────────────────────────
export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ─── Prayer Log ──────────────────────────────────────────────
type DayLog = Record<PrayerId, PrayerLogEntry['status']>;

export async function loadPrayerLog(): Promise<Record<string, DayLog>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PRAYER_LOG);
    if (raw) return JSON.parse(raw);
    return {};
  } catch {
    return {};
  }
}

export async function savePrayerLog(log: Record<string, DayLog>): Promise<void> {
  await AsyncStorage.setItem(KEYS.PRAYER_LOG, JSON.stringify(log));
}

export async function markPrayer(
  dateKey: string,
  prayerId: PrayerId,
  status: PrayerLogEntry['status']
): Promise<Record<string, DayLog>> {
  const log = await loadPrayerLog();
  if (!log[dateKey]) log[dateKey] = {} as DayLog;
  log[dateKey][prayerId] = status;
  await savePrayerLog(log);
  return log;
}

export async function getPrayerLogForDate(dateKey: string): Promise<DayLog | null> {
  const log = await loadPrayerLog();
  return log[dateKey] || null;
}

// ─── Stats ───────────────────────────────────────────────────
export async function getStreak(): Promise<number> {
  const log = await loadPrayerLog();
  const dates = Object.keys(log).sort().reverse();
  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedKey = expected.toISOString().split('T')[0];

    if (dates[i] !== expectedKey) break;
    const dayLog = log[dates[i]];
    const prayed = Object.entries(dayLog)
      .filter(([id, s]) => id !== 'sunrise' && s === 'prayed')
      .length;
    if (prayed > 0) streak++;
    else break;
  }
  return streak;
}

export async function getTotalPrayers(): Promise<number> {
  const log = await loadPrayerLog();
  let total = 0;
  for (const day of Object.values(log)) {
    total += Object.values(day).filter(s => s === 'prayed').length;
  }
  return total;
}

export async function getOnTimeRate(): Promise<number> {
  const log = await loadPrayerLog();
  let prayed = 0;
  let qaza = 0;
  for (const day of Object.values(log)) {
    for (const [id, status] of Object.entries(day)) {
      if (id === 'sunrise') continue;
      if (status === 'prayed') prayed++;
      else if (status === 'qaza') qaza++;
    }
  }
  const total = prayed + qaza;
  return total === 0 ? 0 : Math.round((prayed / total) * 100);
}

export async function getHeatmapData(months: number = 2): Promise<Record<string, number>> {
  const log = await loadPrayerLog();
  const result: Record<string, number> = {};
  const now = new Date();
  for (let i = 0; i < 30 * months; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (log[key]) {
      const count = Object.entries(log[key])
        .filter(([id, s]) => id !== 'sunrise' && s === 'prayed')
        .length;
      result[key] = count;
    }
  }
  return result;
}

// ─── Favorite Duas ───────────────────────────────────────────
export async function getFavoriteDuas(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.FAVORITE_DUAS);
    if (raw) return JSON.parse(raw);
    return [];
  } catch { return []; }
}

export async function toggleFavoriteDua(duaId: string): Promise<string[]> {
  const favs = await getFavoriteDuas();
  const idx = favs.indexOf(duaId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(duaId);
  await AsyncStorage.setItem(KEYS.FAVORITE_DUAS, JSON.stringify(favs));
  return favs;
}

export async function isFavoriteDua(duaId: string): Promise<boolean> {
  const favs = await getFavoriteDuas();
  return favs.includes(duaId);
}

// ─── Hadith ──────────────────────────────────────────────────
export async function getLastHadithIndex(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HADITH_INDEX);
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
}

export async function setLastHadithIndex(index: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.HADITH_INDEX, String(index));
}

export async function getFavoriteHadiths(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.FAVORITE_HADITH);
    if (raw) return JSON.parse(raw);
    return [];
  } catch { return []; }
}

export async function toggleFavoriteHadith(hadithId: string): Promise<string[]> {
  const favs = await getFavoriteHadiths();
  const idx = favs.indexOf(hadithId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(hadithId);
  await AsyncStorage.setItem(KEYS.FAVORITE_HADITH, JSON.stringify(favs));
  return favs;
}

export async function getLastHadithDate(): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS.LAST_HADITH_DATE);
}

export async function setLastHadithDate(date: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_HADITH_DATE, date);
}

// ─── Fasting Log ─────────────────────────────────────────────
export async function loadFastingLog(): Promise<Record<string, FastingLog>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.FASTING_LOG);
    if (raw) return JSON.parse(raw);
    return {};
  } catch { return {}; }
}

export async function saveFastingLog(log: Record<string, FastingLog>): Promise<void> {
  await AsyncStorage.setItem(KEYS.FASTING_LOG, JSON.stringify(log));
}

export async function toggleFast(dateKey: string, type: FastingLog['type']): Promise<Record<string, FastingLog>> {
  const log = await loadFastingLog();
  if (log[dateKey]) {
    delete log[dateKey];
  } else {
    log[dateKey] = { date: dateKey, type, completed: true };
  }
  await saveFastingLog(log);
  return log;
}

// ─── Quran Log ───────────────────────────────────────────────
export async function loadQuranLog(): Promise<Record<string, QuranLog>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.QURAN_LOG);
    if (raw) return JSON.parse(raw);
    return {};
  } catch { return {}; }
}

export async function saveQuranLog(log: Record<string, QuranLog>): Promise<void> {
  await AsyncStorage.setItem(KEYS.QURAN_LOG, JSON.stringify(log));
}

export async function addQuranLog(entry: QuranLog): Promise<Record<string, QuranLog>> {
  const log = await loadQuranLog();
  log[entry.date] = entry;
  await saveQuranLog(log);
  return log;
}

export async function getWeeklyQuranStats(): Promise<number[]> {
  const log = await loadQuranLog();
  const result: number[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    result.push(log[key]?.pagesRead || 0);
  }
  return result;
}

// ─── Dhikr History ───────────────────────────────────────────
export async function loadDhikrHistory(): Promise<DhikrSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DHIKR_HISTORY);
    if (raw) return JSON.parse(raw);
    return [];
  } catch { return []; }
}

export async function saveDhikrHistory(history: DhikrSession[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.DHIKR_HISTORY, JSON.stringify(history));
}

export async function addDhikrSession(session: DhikrSession): Promise<DhikrSession[]> {
  const history = await loadDhikrHistory();
  history.push(session);
  // Keep last 90 days
  if (history.length > 90) history.shift();
  await saveDhikrHistory(history);
  return history;
}

export async function getTodayDhikrCount(): Promise<{ subhanallah: number; alhamdulillah: number; allahuakbar: number }> {
  const history = await loadDhikrHistory();
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = history.filter(s => s.date === today);
  return todaySessions.reduce((acc, s) => ({
    subhanallah: acc.subhanallah + s.subhanallah,
    alhamdulillah: acc.alhamdulillah + s.alhamdulillah,
    allahuakbar: acc.allahuakbar + s.allahuakbar,
  }), { subhanallah: 0, alhamdulillah: 0, allahuakbar: 0 });
}

// ─── Zakat Records ───────────────────────────────────────────
export async function loadZakatRecords(): Promise<ZakatRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ZAKAT_RECORDS);
    if (raw) return JSON.parse(raw);
    return [];
  } catch { return []; }
}

export async function saveZakatRecords(records: ZakatRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ZAKAT_RECORDS, JSON.stringify(records));
}

export async function addZakatRecord(record: ZakatRecord): Promise<ZakatRecord[]> {
  const records = await loadZakatRecords();
  records.push(record);
  await saveZakatRecords(records);
  return records;
}

// ─── Charity Log ─────────────────────────────────────────────
export async function loadCharityLog(): Promise<CharityRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CHARITY_LOG);
    if (raw) return JSON.parse(raw);
    return [];
  } catch { return []; }
}

export async function saveCharityLog(records: CharityRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CHARITY_LOG, JSON.stringify(records));
}

export async function addCharityRecord(record: CharityRecord): Promise<CharityRecord[]> {
  const records = await loadCharityLog();
  records.push(record);
  await saveCharityLog(records);
  return records;
}

export async function getCharityTotal(): Promise<number> {
  const records = await loadCharityLog();
  return records.reduce((sum, r) => sum + r.amount, 0);
}

// ─── Prayer Journal ──────────────────────────────────────────
export async function loadPrayerJournal(): Promise<Record<string, PrayerJournalEntry[]>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PRAYER_JOURNAL);
    if (raw) return JSON.parse(raw);
    return {};
  } catch { return {}; }
}

export async function savePrayerJournal(journal: Record<string, PrayerJournalEntry[]>): Promise<void> {
  await AsyncStorage.setItem(KEYS.PRAYER_JOURNAL, JSON.stringify(journal));
}

export async function addJournalEntry(entry: PrayerJournalEntry): Promise<Record<string, PrayerJournalEntry[]>> {
  const journal = await loadPrayerJournal();
  if (!journal[entry.date]) journal[entry.date] = [];
  journal[entry.date].push(entry);
  await savePrayerJournal(journal);
  return journal;
}

// ─── Clear All Data ──────────────────────────────────────────
export async function clearAllData(): Promise<void> {
  const keys = Object.values(KEYS);
  await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
}
