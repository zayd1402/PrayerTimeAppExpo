// The habit side of the app: habits anchored to a prayer, the 30-day consistency rate that
// replaces streaks, the ladder from the obligatory to the extra, and when to welcome someone back.
// Pure, so it can be tested without React or storage.
import { getLocalDateKey, getLocalDateKeyDaysAgo } from '../utils/date';
import { FIVE } from './dayState';
import type { PrayerLog } from './habits';

export type HabitCategory = 'salah' | 'quran' | 'dhikr';
export type AnchorPrayer = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface Habit {
  id: string;
  /** What to do, in a few words: "One page of Quran". */
  title: string;
  /** How long or how much: "5 minutes". */
  detail?: string;
  category: HabitCategory;
  /** The prayer the habit is stacked after. Every habit has one. */
  anchor: AnchorPrayer;
  /** The person's own words. Never rewritten. */
  intention?: string;
  /** When they'll do it: "After Fajr, before my phone". */
  plan?: string;
  /** Day key the habit was added. Days before it never count against it. */
  createdAt: string;
  /** Ladder step this habit belongs to, when it came from the ladder. */
  step?: number;
  /** Set once the 40-day moment has been shown. */
  milestoneSeen?: boolean;
}

export type HabitDraft = Omit<Habit, 'id' | 'createdAt'>;

/** Day key to the ids of the habits done that day. */
export type HabitLog = Record<string, string[]>;

export const MAX_PER_PRAYER = 3;
export const RATE_WINDOW = 30;
/** A ladder step opens the next one once it holds on this many of the last 30 days. */
export const STEP_OPENS_AT = 21;
/** Fewer settled days than this says nothing about a pattern, so the meter waits. */
export const MIN_METER_DAYS = 7;
/** Days with nothing logged before Today says welcome back. */
export const RETURN_GAP_DAYS = 3;
export const MILESTONE_DAYS = 40;
export const MILESTONE_WINDOW = 45;

export const ANCHOR_NAMES: Record<AnchorPrayer, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

export const CATEGORY_NAMES: Record<HabitCategory, string> = { salah: 'Salah', quran: 'Quran', dhikr: 'Dhikr' };

/** Habits stacked after one prayer, in the order they were added. */
export function habitsFor(habits: Habit[], anchor: AnchorPrayer): Habit[] {
  return habits.filter(h => h.anchor === anchor);
}

export function canAddTo(habits: Habit[], anchor: AnchorPrayer): boolean {
  return habitsFor(habits, anchor).length < MAX_PER_PRAYER;
}

/** Day keys for the last `days` days ending today, oldest first, from `since` on. */
export function windowKeys(days: number, now: Date = new Date(), since?: string, endDaysAgo = 0): string[] {
  const keys: string[] = [];
  for (let i = days - 1 + endDaysAgo; i >= endDaysAgo; i--) {
    const k = getLocalDateKeyDaysAgo(i, now);
    if (!since || k >= since) keys.push(k);
  }
  return keys;
}

/** All five prayers on time that day. */
export function fardKept(log: PrayerLog, key: string): boolean {
  const day = log[key];
  return !!day && FIVE.every(id => day[id] === 'prayed');
}

export function habitDone(log: HabitLog, key: string, id: string): boolean {
  return !!log[key]?.includes(id);
}

/** The earliest day with a prayer actually kept (on time or qaza), or undefined. */
export function firstKeptKey(log: PrayerLog): string | undefined {
  return Object.keys(log)
    .filter(k => FIVE.some(id => log[k]?.[id] === 'prayed' || log[k]?.[id] === 'qaza'))
    .sort()[0];
}

export interface Consistency {
  /** 0 to 1. */
  rate: number;
  /** Settled days the rate is over. */
  days: number;
  /** Weekly rates, oldest first, for the sparkline. */
  trend: number[];
  /** The rate over the 30 days before, if there were any. */
  previous: number | null;
}

/** On-time share of the five prayers over settled days (up to yesterday) from `since`. */
function prayerRateOver(keys: string[], log: PrayerLog): number | null {
  if (!keys.length) return null;
  const onTime = keys.reduce((n, k) => n + FIVE.filter(id => log[k]?.[id] === 'prayed').length, 0);
  return onTime / (keys.length * FIVE.length);
}

/** The five prayers' 30-day consistency. Null until there are MIN_METER_DAYS settled days. */
export function prayerConsistency(log: PrayerLog, now: Date = new Date()): Consistency | null {
  const since = firstKeptKey(log);
  if (!since) return null;
  const keys = windowKeys(RATE_WINDOW, now, since, 1);
  if (keys.length < MIN_METER_DAYS) return null;
  const trend: number[] = [];
  for (let w = 5; w >= 0; w--) {
    const r = prayerRateOver(windowKeys(7, now, since, 1 + w * 7), log);
    if (r !== null) trend.push(r);
  }
  return {
    rate: prayerRateOver(keys, log) ?? 0,
    days: keys.length,
    trend,
    previous: prayerRateOver(windowKeys(RATE_WINDOW, now, since, 1 + RATE_WINDOW), log),
  };
}

/** "Up from 68% the month before". Compares only with the person's own past, and never scolds. */
export function consistencyNote(c: Consistency): string | undefined {
  if (c.previous === null) return undefined;
  const now = Math.round(c.rate * 100);
  const before = Math.round(c.previous * 100);
  if (now > before) return `Up from ${before}% the month before`;
  if (now === before) return 'Steady with the month before';
  return `${before}% the month before. Small steps count.`;
}

/** Days a habit was kept in the window, and the days that count (from when it was added). */
export function habitKept(habit: Habit, log: HabitLog, now: Date = new Date(), days = RATE_WINDOW): { kept: number; days: number } {
  const today = getLocalDateKey(now);
  const keys = windowKeys(days, now, habit.createdAt);
  const kept = keys.filter(k => habitDone(log, k, habit.id)).length;
  // Today only counts against the habit once it is over, so a morning check never shows a dip.
  const counted = keys.filter(k => k < today || habitDone(log, k, habit.id)).length;
  return { kept, days: counted };
}

// ─── The ladder ────────────────────────────────────────────────────────────────

export interface LadderDef {
  title: string;
  /** Habits added when the person takes this step. Empty for the five prayers. */
  habits: HabitDraft[];
}

export const LADDER: LadderDef[] = [
  { title: 'Five prayers on time', habits: [] },
  {
    title: 'Sunnah of Fajr and Dhuhr',
    habits: [
      { title: 'Two sunnah rakʿahs before', anchor: 'fajr', category: 'salah', step: 1 },
      { title: 'Two sunnah rakʿahs after', anchor: 'dhuhr', category: 'salah', step: 1 },
    ],
  },
  {
    title: 'Adhkar after every salah',
    habits: FIVE.map(id => ({
      title: 'Adhkar after salah', detail: 'SubhanAllah, alhamdulillah, Allahu akbar', anchor: id as AnchorPrayer, category: 'dhikr' as const, step: 2,
    })),
  },
  { title: 'Witr every night', habits: [{ title: 'Witr before sleep', anchor: 'isha', category: 'salah', step: 3 }] },
];

export type RungState = 'kept' | 'current' | 'locked';

export interface Rung {
  title: string;
  detail: string;
  state: RungState;
  /** 0 to 1 toward STEP_OPENS_AT, on the current rung. */
  progress?: number;
  /** True on the current rung when its habits haven't been added yet. */
  needsHabits?: boolean;
}

/** Days in the last 30 that a ladder step held. */
export function stepKeptDays(step: number, habits: Habit[], prayerLog: PrayerLog, habitLog: HabitLog, now: Date = new Date()): number {
  const keys = windowKeys(RATE_WINDOW, now);
  if (step === 0) return keys.filter(k => fardKept(prayerLog, k)).length;
  const own = habits.filter(h => h.step === step);
  if (!own.length) return 0;
  return keys.filter(k => own.every(h => k < h.createdAt || habitDone(habitLog, k, h.id)) && own.some(h => k >= h.createdAt)).length;
}

/**
 * The ladder as it stands. `level` is the highest step reached so far: once a step is
 * reached it stays reached, so a hard week never takes a rung away.
 * Returns the rungs and the level after today's numbers, which the caller saves.
 */
export function ladder(level: number, habits: Habit[], prayerLog: PrayerLog, habitLog: HabitLog, now: Date = new Date()): { rungs: Rung[]; level: number } {
  let reached = Math.max(0, Math.min(level, LADDER.length));
  while (reached < LADDER.length && stepKeptDays(reached, habits, prayerLog, habitLog, now) >= STEP_OPENS_AT) reached++;
  const rungs = LADDER.map((def, i): Rung => {
    const kept = stepKeptDays(i, habits, prayerLog, habitLog, now);
    if (i < reached) return { title: def.title, detail: `Kept ${kept} of the last 30 days`, state: 'kept' };
    if (i === reached) {
      const needsHabits = i > 0 && !habits.some(h => h.step === i);
      return {
        title: def.title,
        detail: needsHabits ? 'Ready when you are. Tap to begin' : `${kept} of ${STEP_OPENS_AT} days so far`,
        state: 'current',
        progress: kept / STEP_OPENS_AT,
        needsHabits,
      };
    }
    return { title: def.title, detail: `Opens when step ${i} holds`, state: 'locked' };
  });
  return { rungs, level: reached };
}

// ─── What Today offers ─────────────────────────────────────────────────────────

export interface NextStepOffer {
  title: string;
  detail: string;
  /** Habits the Add button sets up (the person still writes their intention). */
  habits: HabitDraft[];
}

export const FIRST_HABIT: HabitDraft = { title: 'Morning adhkar', detail: '5 minutes', anchor: 'fajr', category: 'dhikr' };

/** One small suggestion for growing the routine, only when what's there is holding. */
export function nextStep(habits: Habit[], rungs: Rung[], prayerLog: PrayerLog, now: Date = new Date()): NextStepOffer | null {
  if (!habits.length) {
    return { title: 'Say the morning adhkar after Fajr', detail: 'One small habit, tied to a prayer you already pray.', habits: [FIRST_HABIT] };
  }
  const current = rungs.findIndex(r => r.state === 'current');
  if (current > 0 && rungs[current].needsHabits) {
    const fard = stepKeptDays(0, habits, prayerLog, {}, now);
    return {
      title: LADDER[current].title,
      detail: `You have kept the five prayers on ${fard} of the last 30 days. Ready to add one more?`,
      habits: LADDER[current].habits,
    };
  }
  return null;
}

/** The last day anything was kept: a prayer on time or as qaza, or a habit. */
export function lastActiveKey(prayerLog: PrayerLog, habitLog: HabitLog): string | undefined {
  const keys = [
    ...Object.keys(prayerLog).filter(k => FIVE.some(id => prayerLog[k]?.[id] === 'prayed' || prayerLog[k]?.[id] === 'qaza')),
    ...Object.keys(habitLog).filter(k => habitLog[k]?.length),
  ].sort();
  return keys[keys.length - 1];
}

/** True after RETURN_GAP_DAYS or more with nothing logged, for someone who has logged before. */
export function needsWelcomeBack(prayerLog: PrayerLog, habitLog: HabitLog, now: Date = new Date()): boolean {
  const last = lastActiveKey(prayerLog, habitLog);
  if (!last) return false;
  return last <= getLocalDateKeyDaysAgo(RETURN_GAP_DAYS + 1, now);
}

/** A habit that has just reached 40 kept days out of the last 45, if one hasn't been celebrated yet. */
export function milestoneDue(habits: Habit[], log: HabitLog, now: Date = new Date()): { habit: Habit; kept: number } | null {
  for (const h of habits) {
    if (h.milestoneSeen) continue;
    const { kept } = habitKept(h, log, now, MILESTONE_WINDOW);
    if (kept >= MILESTONE_DAYS) return { habit: h, kept };
  }
  return null;
}

/** The Friday a reflection belongs to: today if it's Friday, else undefined. */
export function reflectionDay(now: Date = new Date()): string | undefined {
  return now.getDay() === 5 ? getLocalDateKey(now) : undefined;
}
