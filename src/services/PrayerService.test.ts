import { describe, expect, it } from 'vitest';
import {
  calculatePrayerTimes,
  getCurrentMinutesForCoordinates,
  getNextPrayer,
  getPrayerTimesObject,
  getTimeZoneForCoordinates,
  minutesToTimeString,
} from './PrayerService';

describe('PrayerService', () => {
  it('uses the coordinate timezone when calculating Sydney prayer times', () => {
    const times = calculatePrayerTimes(
      new Date('2026-05-15T12:00:00Z'),
      -33.8688,
      151.2093,
      'muslim_world_league',
      'shafi'
    );

    expect(getTimeZoneForCoordinates(-33.8688, 151.2093)).toBe('Australia/Sydney');
    expect(times.fajr).toBeGreaterThanOrEqual(290);
    expect(times.fajr).toBeLessThanOrEqual(340);
    expect(times.dhuhr).toBeGreaterThanOrEqual(700);
    expect(times.dhuhr).toBeLessThanOrEqual(730);
    expect(times.maghrib).toBeGreaterThanOrEqual(1010);
    expect(times.maghrib).toBeLessThanOrEqual(1040);
  });

  it('rolls next prayer to tomorrow Fajr after Isha has passed', () => {
    const times = getPrayerTimesObject(
      new Date('2026-05-15T12:00:00Z'),
      -33.8688,
      151.2093,
      'muslim_world_league',
      'shafi',
      23 * 60
    );

    const next = getNextPrayer(times, 23 * 60);

    expect(next?.id).toBe('fajr');
    expect(next?.minutes).toBeGreaterThan(1440);
    expect(minutesToTimeString(next?.minutes ?? 0)).toMatch(/AM$/);
  });

  it('chooses the nearest upcoming prayer by adjusted minutes', () => {
    const next = getNextPrayer([
      { id: 'fajr', name: 'Fajr', arabic: '', icon: '', iconActive: '', time: '5:12 AM', minutes: 312, status: 'passed' },
      { id: 'sunrise', name: 'Sunrise', arabic: '', icon: '', iconActive: '', time: '6:38 AM', minutes: 398, status: 'passed' },
      { id: 'dhuhr', name: 'Dhuhr', arabic: '', icon: '', iconActive: '', time: '12:48 PM', minutes: 768, status: 'passed' },
      { id: 'asr', name: 'Asr', arabic: '', icon: '', iconActive: '', time: '3:42 PM', minutes: 942, status: 'passed' },
      { id: 'maghrib', name: 'Maghrib', arabic: '', icon: '', iconActive: '', time: '5:58 PM', minutes: 1078, status: 'upcoming' },
      { id: 'isha', name: 'Isha', arabic: '', icon: '', iconActive: '', time: '7:19 PM', minutes: 1159, status: 'upcoming' },
    ], 18 * 60);

    expect(next?.id).toBe('isha');
  });

  it('reads current minutes in the location timezone rather than device UTC', () => {
    const minutes = getCurrentMinutesForCoordinates(
      -33.8688,
      151.2093,
      new Date('2026-05-14T19:30:00Z')
    );

    expect(minutes).toBe(5 * 60 + 30);
  });
});
