import { MMKV } from 'react-native-mmkv';
import { 
  PrayerId, PrayerLogEntry, AppSettings, DEFAULT_SETTINGS,
  FastingLog, QuranLog, DhikrSession, 
  ZakatRecord, CharityRecord, PrayerJournalEntry
} from '../types';

export const storage = new MMKV({ id: 'prayertime-storage' });

// ─── helpers ────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getString(key);
    if (raw !== undefined) return JSON.parse(raw);
    return fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

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
  KAHF_PROGRESS:  '@prayertime:kahf_last_read',
  KHUTBAH_NOTES:  '@prayertime:khutbah_notes',
  FRIDAY_CHECKLIST:'@prayertime:friday_checklist',
};

// ─── Settings ───────────────────────────────────────────────
export async function loadSettings(): Promise<AppSettings> {
  return load<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  save(KEYS.SETTINGS, settings);
}

// ─── Prayer Log ──────────────────────────────────────────────
type DayLog = Record<PrayerId, PrayerLogEntry['status']>;

export async function loadPrayerLog(): Promise<Record<string, DayLog>> {
  return load<Record<string, DayLog>>(KEYS.PRAYER_LOG, {});
}

export async function savePrayerLog(log: Record<string, DayLog>): Promise<void> {
  save(KEYS.PRAYER_LOG, log);
}

export async function markPrayer(
  dateKey: string,
  prayerId: PrayerId,
  status: PrayerLogEntry['status']
): Promise<Record<string, DayLog>> {
  const log = load<Record<string, DayLog>>(KEYS.PRAYER_LOG, {});
  if (!log[dateKey]) log[dateKey] = {} as DayLog;
  log[dateKey][prayerId] = status;
  save(KEYS.PRAYER_LOG, log);
  return log;
}

export async function getPrayerLogForDate(dateKey: string): Promise<DayLog | null> {
  const log = load<Record<string, DayLog>>(KEYS.PRAYER_LOG, {});
  return log[dateKey] || null;
}

// ─── Stats ───────────────────────────────────────────────────
export async function getStreak(): Promise<number> {
  const log = load<Record<string, DayLog>>(KEYS.PRAYER_LOG, {});
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
  const log = load<Record<string, DayLog>>(KEYS.PRAYER_LOG, {});
  let total = 0;
  for (const day of Object.values(log)) {
    total += Object.values(day).filter(s => s === 'prayed').length;
  }
  return total;
}

export async function getOnTimeRate(): Promise<number> {
  const log = load<Record<string, DayLog>>(KEYS.PRAYER_LOG, {});
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
  const log = load<Record<string, DayLog>>(KEYS.PRAYER_LOG, {});
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
  return load<string[]>(KEYS.FAVORITE_DUAS, []);
}

export async function toggleFavoriteDua(duaId: string): Promise<string[]> {
  const favs = load<string[]>(KEYS.FAVORITE_DUAS, []);
  const idx = favs.indexOf(duaId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(duaId);
  save(KEYS.FAVORITE_DUAS, favs);
  return favs;
}

export async function isFavoriteDua(duaId: string): Promise<boolean> {
  const favs = load<string[]>(KEYS.FAVORITE_DUAS, []);
  return favs.includes(duaId);
}

// ─── Hadith ──────────────────────────────────────────────────
export async function getLastHadithIndex(): Promise<number> {
  return storage.getNumber(KEYS.HADITH_INDEX) ?? 0;
}

export async function setLastHadithIndex(index: number): Promise<void> {
  storage.set(KEYS.HADITH_INDEX, index);
}

export async function getFavoriteHadiths(): Promise<string[]> {
  return load<string[]>(KEYS.FAVORITE_HADITH, []);
}

export async function toggleFavoriteHadith(hadithId: string): Promise<string[]> {
  const favs = load<string[]>(KEYS.FAVORITE_HADITH, []);
  const idx = favs.indexOf(hadithId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(hadithId);
  save(KEYS.FAVORITE_HADITH, favs);
  return favs;
}

export async function getLastHadithDate(): Promise<string | null> {
  return storage.getString(KEYS.LAST_HADITH_DATE) ?? null;
}

export async function setLastHadithDate(date: string): Promise<void> {
  storage.set(KEYS.LAST_HADITH_DATE, date);
}

// ─── Fasting Log ─────────────────────────────────────────────
export async function loadFastingLog(): Promise<Record<string, FastingLog>> {
  return load<Record<string, FastingLog>>(KEYS.FASTING_LOG, {});
}

export async function saveFastingLog(log: Record<string, FastingLog>): Promise<void> {
  save(KEYS.FASTING_LOG, log);
}

export async function toggleFast(dateKey: string, type: FastingLog['type']): Promise<Record<string, FastingLog>> {
  const log = load<Record<string, FastingLog>>(KEYS.FASTING_LOG, {});
  if (log[dateKey]) {
    delete log[dateKey];
  } else {
    log[dateKey] = { date: dateKey, type, completed: true };
  }
  save(KEYS.FASTING_LOG, log);
  return log;
}

// ─── Quran Log ───────────────────────────────────────────────
export async function loadQuranLog(): Promise<Record<string, QuranLog>> {
  return load<Record<string, QuranLog>>(KEYS.QURAN_LOG, {});
}

export async function saveQuranLog(log: Record<string, QuranLog>): Promise<void> {
  save(KEYS.QURAN_LOG, log);
}

export async function addQuranLog(entry: QuranLog): Promise<Record<string, QuranLog>> {
  const log = load<Record<string, QuranLog>>(KEYS.QURAN_LOG, {});
  log[entry.date] = entry;
  save(KEYS.QURAN_LOG, log);
  return log;
}

export async function getWeeklyQuranStats(): Promise<number[]> {
  const log = load<Record<string, QuranLog>>(KEYS.QURAN_LOG, {});
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
  return load<DhikrSession[]>(KEYS.DHIKR_HISTORY, []);
}

export async function saveDhikrHistory(history: DhikrSession[]): Promise<void> {
  save(KEYS.DHIKR_HISTORY, history);
}

export async function addDhikrSession(session: DhikrSession): Promise<DhikrSession[]> {
  const history = load<DhikrSession[]>(KEYS.DHIKR_HISTORY, []);
  history.push(session);
  if (history.length > 90) history.shift();
  save(KEYS.DHIKR_HISTORY, history);
  return history;
}

export async function getTodayDhikrCount(): Promise<{ subhanallah: number; alhamdulillah: number; allahuakbar: number }> {
  const history = load<DhikrSession[]>(KEYS.DHIKR_HISTORY, []);
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
  return load<ZakatRecord[]>(KEYS.ZAKAT_RECORDS, []);
}

export async function saveZakatRecords(records: ZakatRecord[]): Promise<void> {
  save(KEYS.ZAKAT_RECORDS, records);
}

export async function addZakatRecord(record: ZakatRecord): Promise<ZakatRecord[]> {
  const records = load<ZakatRecord[]>(KEYS.ZAKAT_RECORDS, []);
  records.push(record);
  save(KEYS.ZAKAT_RECORDS, records);
  return records;
}

// ─── Charity Log ─────────────────────────────────────────────
export async function loadCharityLog(): Promise<CharityRecord[]> {
  return load<CharityRecord[]>(KEYS.CHARITY_LOG, []);
}

export async function saveCharityLog(records: CharityRecord[]): Promise<void> {
  save(KEYS.CHARITY_LOG, records);
}

export async function addCharityRecord(record: CharityRecord): Promise<CharityRecord[]> {
  const records = load<CharityRecord[]>(KEYS.CHARITY_LOG, []);
  records.push(record);
  save(KEYS.CHARITY_LOG, records);
  return records;
}

export async function getCharityTotal(): Promise<number> {
  const records = load<CharityRecord[]>(KEYS.CHARITY_LOG, []);
  return records.reduce((sum, r) => sum + r.amount, 0);
}

// ─── Prayer Journal ──────────────────────────────────────────
export async function loadPrayerJournal(): Promise<Record<string, PrayerJournalEntry[]>> {
  return load<Record<string, PrayerJournalEntry[]>>(KEYS.PRAYER_JOURNAL, {});
}

export async function savePrayerJournal(journal: Record<string, PrayerJournalEntry[]>): Promise<void> {
  save(KEYS.PRAYER_JOURNAL, journal);
}

export async function addJournalEntry(entry: PrayerJournalEntry): Promise<Record<string, PrayerJournalEntry[]>> {
  const journal = load<Record<string, PrayerJournalEntry[]>>(KEYS.PRAYER_JOURNAL, {});
  if (!journal[entry.date]) journal[entry.date] = [];
  journal[entry.date].push(entry);
  save(KEYS.PRAYER_JOURNAL, journal);
  return journal;
}

// ─── Direct MMKV access for screens that import storage ─────
export { storage as mmkv };

// ─── Clear All Data ──────────────────────────────────────────
export async function clearAllData(): Promise<void> {
  const keys = Object.values(KEYS);
  keys.forEach(key => storage.delete(key));
}

// ─── Friday Screen Data ─────────────────────────────────────
export async function getFridayChecklist(): Promise<Record<string, boolean>> {
  return load<Record<string, boolean>>(KEYS.FRIDAY_CHECKLIST, {});
}

export async function setFridayChecklist(data: Record<string, boolean>): Promise<void> {
  save(KEYS.FRIDAY_CHECKLIST, data);
}

export async function getKahfProgress(): Promise<number> {
  return storage.getNumber(KEYS.KAHF_PROGRESS) ?? 0;
}

export async function setKahfProgress(section: number): Promise<void> {
  storage.set(KEYS.KAHF_PROGRESS, section);
}

export async function getKhutbahNotes(): Promise<string> {
  return storage.getString(KEYS.KHUTBAH_NOTES) ?? '';
}

export async function setKhutbahNotes(text: string): Promise<void> {
  storage.set(KEYS.KHUTBAH_NOTES, text);
}

// ─── Sunnah Streak ──────────────────────────────────────────
export async function getSunnahStreak(): Promise<number> {
  const raw = storage.getString('@prayertime:sunnah_log');
  if (!raw) return 0;
  const log: Record<string, any> = JSON.parse(raw);
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
    const completed = Object.values(dayLog).filter(v => v === 100 || v === 1 || v === 3).length;
    if (completed > 0) streak++;
    else break;
  }
  return streak;
}
