import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerId, PrayerLogEntry, AppSettings, DEFAULT_SETTINGS } from '../types';

// ─── Storage Keys ────────────────────────────────────────────
const KEYS = {
  SETTINGS:    '@prayertime:settings',
  PRAYER_LOG:  '@prayertime:prayer_log',
  LOCATION:    '@prayertime:location',
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
// Format: { "2026-05-15": { fajr: "prayed", dhuhr: "qaza", ... } }
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
  dateKey: string, // "2026-05-15"
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
    // Count as streak if at least one prayer (excluding sunrise) was prayed
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

// ─── Clear All Data ──────────────────────────────────────────
export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SETTINGS);
  await AsyncStorage.removeItem(KEYS.PRAYER_LOG);
  await AsyncStorage.removeItem(KEYS.LOCATION);
}