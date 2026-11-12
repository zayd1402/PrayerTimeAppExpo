import { computeDayState, formatClock, formatDuration } from '../design/dayState';

// Sydney, 12 November: Fajr 4:09, sunrise 5:45, Dhuhr 12:41, Asr 4:23, Maghrib 7:34, Isha 9:04.
const T = { fajr: 249, sunrise: 345, dhuhr: 761, asr: 983, maghrib: 1174, isha: 1264 };

describe('computeDayState', () => {
  it('shows the dawn sky and puts an unlogged Fajr in the hero', () => {
    const s = computeDayState(T, 270, {});
    expect(s.sky).toBe('dawn');
    expect(s.open).toBe('fajr');
    expect(s.hero).toEqual({ mode: 'now', prayer: 'fajr', minutes: 75 });
  });

  it('moves on to the next prayer once Fajr is logged', () => {
    const s = computeDayState(T, 270, { fajr: 'prayed' });
    expect(s.hero).toEqual({ mode: 'next', prayer: 'dhuhr', minutes: 491 });
  });

  it('has nothing open between sunrise and Dhuhr', () => {
    const s = computeDayState(T, 600, {});
    expect(s.sky).toBe('day');
    expect(s.open).toBeNull();
    expect(s.next).toBe('dhuhr');
  });

  it('keeps a prayer that just started in the hero for its first half hour', () => {
    const s = computeDayState(T, 761 + 10, { fajr: 'prayed' });
    expect(s.hero).toEqual({ mode: 'now', prayer: 'dhuhr', minutes: 983 - 771 });
  });

  it('hands over to the next prayer early once the current one is marked', () => {
    const s = computeDayState(T, 761 + 10, { fajr: 'prayed', dhuhr: 'prayed' });
    expect(s.hero).toEqual({ mode: 'next', prayer: 'asr', minutes: 983 - 771 });
  });

  it('switches to the next prayer after the first half hour, even if unmarked', () => {
    const s = computeDayState(T, 761 + 30, { fajr: 'prayed' });
    expect(s.hero.mode).toBe('next');
    expect(s.hero.prayer).toBe('asr');
  });

  it('shows the next prayer while a long window is open', () => {
    const s = computeDayState(T, 863, { fajr: 'prayed' });
    expect(s.open).toBe('dhuhr');
    expect(s.hero).toEqual({ mode: 'next', prayer: 'asr', minutes: 120 });
  });

  it('uses the golden sky for Asr and the Maghrib sky after sunset', () => {
    expect(computeDayState(T, 1130, {}).sky).toBe('golden');
    expect(computeDayState(T, 1180, {}).sky).toBe('maghrib');
  });

  it('counts down to tomorrow after Isha', () => {
    const s = computeDayState(T, 1335, { isha: 'prayed' });
    expect(s.sky).toBe('night');
    expect(s.nextIsTomorrow).toBe(true);
    expect(s.hero).toEqual({ mode: 'next', prayer: 'fajr', minutes: 1440 + 249 - 1335 });
  });

  it('keeps the night sky before Fajr with nothing to log', () => {
    const s = computeDayState(T, 120, {});
    expect(s.sky).toBe('night');
    expect(s.open).toBeNull();
    expect(s.next).toBe('fajr');
    expect(s.nextIsTomorrow).toBe(false);
  });
});

describe('formatting', () => {
  it('formats durations and clock times', () => {
    expect(formatDuration(120)).toBe('2h 0m');
    expect(formatDuration(44)).toBe('44m');
    expect(formatClock(983)).toBe('4:23 PM');
    expect(formatClock(249, false)).toBe('4:09');
    expect(formatClock(0)).toBe('12:00 AM');
  });
});
