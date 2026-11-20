import {
  Habit, HabitLog, consistencyNote, habitKept, ladder, milestoneDue, needsWelcomeBack, nextStep, prayerConsistency,
  reflectionDay, stepKeptDays, windowKeys,
} from '../design/journey';
import type { PrayerLog } from '../design/habits';
import { getLocalDateKeyDaysAgo } from '../utils/date';

const NOW = new Date(2026, 10, 20, 14, 0); // Friday 20 November 2026
const ago = (n: number) => getLocalDateKeyDaysAgo(n, NOW);
const ALL = { fajr: 'prayed', dhuhr: 'prayed', asr: 'prayed', maghrib: 'prayed', isha: 'prayed' } as const;

function prayerDays(from: number, to: number, day: PrayerLog[string] = ALL): PrayerLog {
  const log: PrayerLog = {};
  for (let i = from; i >= to; i--) log[ago(i)] = { ...day };
  return log;
}

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'a', title: 'Morning adhkar', anchor: 'fajr', category: 'dhikr', createdAt: ago(60), ...over,
});

describe('journey', () => {
  it('lists window keys oldest first and respects the start day', () => {
    expect(windowKeys(3, NOW)).toEqual([ago(2), ago(1), ago(0)]);
    expect(windowKeys(5, NOW, ago(1))).toEqual([ago(1), ago(0)]);
    expect(windowKeys(2, NOW, undefined, 1)).toEqual([ago(2), ago(1)]);
  });

  it('waits for a week of settled days before showing the rate', () => {
    expect(prayerConsistency(prayerDays(5, 0), NOW)).toBeNull();
    const c = prayerConsistency(prayerDays(10, 0), NOW);
    expect(c?.days).toBe(10);
    expect(c?.rate).toBe(1);
  });

  it('compares the rate only with the month before', () => {
    const log = { ...prayerDays(60, 31, { fajr: 'prayed', dhuhr: 'missed', asr: 'prayed', maghrib: 'prayed', isha: 'missed' }), ...prayerDays(30, 1) };
    const c = prayerConsistency(log, NOW)!;
    expect(Math.round(c.previous! * 100)).toBe(60);
    expect(consistencyNote(c)).toBe('Up from 60% the month before');
    expect(consistencyNote({ ...c, rate: 0.4 })).toBe('60% the month before. Small steps count.');
  });

  it('does not count today against a habit until it is done', () => {
    const h = habit({ createdAt: ago(2) });
    expect(habitKept(h, {}, NOW)).toEqual({ kept: 0, days: 2 });
    expect(habitKept(h, { [ago(0)]: ['a'] }, NOW)).toEqual({ kept: 1, days: 3 });
  });

  it('opens the next rung at 21 of 30 days and keeps it reached', () => {
    const fard = prayerDays(20, 0);
    expect(stepKeptDays(0, [], fard, {}, NOW)).toBe(21);
    const up = ladder(0, [], fard, {}, NOW);
    expect(up.level).toBe(1);
    expect(up.rungs.map(r => r.state)).toEqual(['kept', 'current', 'locked', 'locked']);
    expect(up.rungs[1].needsHabits).toBe(true);
    // A bad month afterwards never takes the rung away.
    const later = ladder(1, [], {}, {}, NOW);
    expect(later.rungs[0].state).toBe('kept');
    expect(later.rungs[2].detail).toBe('Opens when step 2 holds');
  });

  it('shows progress on the current rung', () => {
    const r = ladder(0, [], prayerDays(8, 0), {}, NOW).rungs[0];
    expect(r.state).toBe('current');
    expect(r.detail).toBe('9 of 21 days so far');
  });

  it('suggests a first habit, then the ladder step once the prayers hold', () => {
    expect(nextStep([], [], {}, NOW)?.habits[0].title).toBe('Morning adhkar');
    const fard = prayerDays(25, 0);
    const { rungs } = ladder(0, [habit()], fard, {}, NOW);
    const offer = nextStep([habit()], rungs, fard, NOW);
    expect(offer?.title).toBe('Sunnah of Fajr and Dhuhr');
    expect(offer?.habits).toHaveLength(2);
    expect(nextStep([habit()], ladder(0, [habit()], {}, {}, NOW).rungs, {}, NOW)).toBeNull();
  });

  it('welcomes someone back after three empty days, ignoring missed marks', () => {
    expect(needsWelcomeBack({}, {}, NOW)).toBe(false);
    expect(needsWelcomeBack(prayerDays(3, 3), {}, NOW)).toBe(false);
    expect(needsWelcomeBack(prayerDays(4, 4), {}, NOW)).toBe(true);
    const missed: PrayerLog = { ...prayerDays(6, 6), [ago(1)]: { fajr: 'missed' } };
    expect(needsWelcomeBack(missed, {}, NOW)).toBe(true);
    expect(needsWelcomeBack(prayerDays(6, 6), { [ago(1)]: ['a'] } as HabitLog, NOW)).toBe(false);
  });

  it('celebrates 40 of 45 days once', () => {
    const log: HabitLog = {};
    for (let i = 39; i >= 0; i--) log[ago(i)] = ['a'];
    expect(milestoneDue([habit()], log, NOW)?.kept).toBe(40);
    expect(milestoneDue([habit({ milestoneSeen: true })], log, NOW)).toBeNull();
  });

  it('offers the reflection on Fridays only', () => {
    expect(reflectionDay(NOW)).toBe('2026-11-20');
    expect(reflectionDay(new Date(2026, 10, 19))).toBeUndefined();
  });
});
