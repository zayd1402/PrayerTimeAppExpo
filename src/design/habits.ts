// Numbers behind the Habits screen: heat levels per day, per-prayer rates and the one-line insight.
import type { PrayerId } from '../types';
import { getLocalDateKey } from '../utils/date';
import { FIVE } from './dayState';

export type DayLog = Partial<Record<PrayerId, 'prayed' | 'qaza' | 'missed'>>;
export type PrayerLog = Record<string, DayLog>;

/** Prayers kept that day, on time or qaza (0 to 5). */
export function dayLevel(day: DayLog | undefined): number {
  if (!day) return 0;
  return FIVE.filter(id => day[id] === 'prayed' || day[id] === 'qaza').length;
}

export function hasQaza(day: DayLog | undefined): boolean {
  return !!day && FIVE.some(id => day[id] === 'qaza');
}

export interface MonthCell {
  key: string;
  date: number;
  level: number;
  qaza: boolean;
  future: boolean;
  today: boolean;
}

/** Calendar cells for a month, with leading nulls so the 1st falls on its weekday (Sunday first). */
export function monthCells(year: number, month: number, log: PrayerLog, now: Date = new Date()): (MonthCell | null)[] {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const todayKey = getLocalDateKey(now);
  const cells: (MonthCell | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    const key = getLocalDateKey(date);
    cells.push({
      key, date: d, level: dayLevel(log[key]), qaza: hasQaza(log[key]),
      future: key > todayKey, today: key === todayKey,
    });
  }
  return cells;
}

export interface PrayerRate { id: PrayerId; onTime: number; days: number; pct: number }

/** On-time rate for each prayer over the given day keys. */
export function prayerRates(keys: string[], log: PrayerLog): PrayerRate[] {
  return FIVE.map(id => {
    const onTime = keys.filter(k => log[k]?.[id] === 'prayed').length;
    return { id, onTime, days: keys.length, pct: keys.length ? Math.round((onTime / keys.length) * 100) : 0 };
  });
}

/** Past days of the month up to yesterday; today only counts once it is the sole day. */
export function settledDays(year: number, month: number, now: Date = new Date()): string[] {
  const todayKey = getLocalDateKey(now);
  const days = new Date(year, month + 1, 0).getDate();
  const keys: string[] = [];
  for (let d = 1; d <= days; d++) {
    const k = getLocalDateKey(new Date(year, month, d));
    if (k < todayKey) keys.push(k);
  }
  return keys.length ? keys : (getLocalDateKey(new Date(year, month, 1)) <= todayKey ? [todayKey] : []);
}

export function monthInsight(rates: PrayerRate[], names: Record<string, string>): { lead: string; text: string } | null {
  if (!rates.length || rates[0].days === 0) return null;
  const low = [...rates].sort((a, b) => a.pct - b.pct)[0];
  if (low.pct === 100) return { lead: 'Every prayer on time.', text: 'A full month so far. MashaAllah, keep it going.' };
  return {
    lead: `${names[low.id]} is the one to work on.`,
    text: `You prayed it on time on ${low.onTime} of ${low.days} days this month. A reminder 15 minutes before might help.`,
  };
}

/** Day keys for the last `weeks` whole weeks ending this week, oldest first, Sunday first. */
export function yearGridKeys(weeks: number, now: Date = new Date()): string[] {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()));
  const keys: string[] = [];
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    keys.push(getLocalDateKey(new Date(end.getFullYear(), end.getMonth(), end.getDate() - i)));
  }
  return keys;
}

export interface RangeStats { onTimePct: number; fullDays: number; loggedDays: number }

export function rangeStats(keys: string[], log: PrayerLog, now: Date = new Date()): RangeStats {
  const todayKey = getLocalDateKey(now);
  const past = keys.filter(k => k <= todayKey);
  const logged = past.filter(k => log[k] && Object.keys(log[k]).length > 0);
  const onTime = logged.reduce((n, k) => n + FIVE.filter(id => log[k][id] === 'prayed').length, 0);
  return {
    onTimePct: logged.length ? Math.round((onTime / (logged.length * 5)) * 100) : 0,
    fullDays: past.filter(k => dayLevel(log[k]) === 5).length,
    loggedDays: logged.length,
  };
}
