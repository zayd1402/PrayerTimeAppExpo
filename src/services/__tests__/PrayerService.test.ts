import { jest } from '@jest/globals';

// Mock TimezoneService so tests are deterministic regardless of machine timezone
jest.mock('../TimezoneService', () => ({
  getTimezoneOffset: jest.fn(() => 0), // UTC
}));

import { getTimezoneOffset } from '../TimezoneService';
import {
  calculatePrayerTimes,
  minutesToTimeString,
  minutesToDisplayHours,
  minutesToDisplayMinutes,
  getPrayerStatus,
  getPrayerTimesObject,
  getNextPrayer,
  getTimeUntilNext,
  calculateQiblaDirection,
  bearingToCompassDirection,
  haversineDistance,
} from '../PrayerService';

import type { PrayerId, PrayerTime, CalculationMethod } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────

function assertMinutesClose(actual: number, expected: number, tolerance = 3) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

// ─── minutesToTimeString ──────────────────────────────────────

describe('minutesToTimeString', () => {
  it('converts 0 minutes to 12:00 AM', () => {
    expect(minutesToTimeString(0)).toBe('12:00 AM');
  });

  it('converts 60 minutes to 1:00 AM', () => {
    expect(minutesToTimeString(60)).toBe('1:00 AM');
  });

  it('converts 720 minutes to 12:00 PM', () => {
    expect(minutesToTimeString(720)).toBe('12:00 PM');
  });

  it('converts 780 minutes to 1:00 PM', () => {
    expect(minutesToTimeString(780)).toBe('1:00 PM');
  });

  it('pads single-digit minutes', () => {
    expect(minutesToTimeString(485)).toBe('8:05 AM');
  });

  it('handles midnight wraparound (1440 = 12:00 AM)', () => {
    expect(minutesToTimeString(1440)).toBe('12:00 AM');
  });
});

// ─── minutesToDisplayHours / minutesToDisplayMinutes ──────────

describe('minutesToDisplayHours', () => {
  it('returns hour part of minutes', () => {
    expect(minutesToDisplayHours(485)).toBe(8);
  });

  it('wraps at 24h', () => {
    expect(minutesToDisplayHours(1500)).toBe(1);
  });
});

describe('minutesToDisplayMinutes', () => {
  it('returns minute part', () => {
    expect(minutesToDisplayMinutes(485)).toBe(5);
  });

  it('handles exact hour', () => {
    expect(minutesToDisplayMinutes(480)).toBe(0);
  });
});

// ─── getPrayerStatus ──────────────────────────────────────────

describe('getPrayerStatus', () => {
  it('returns "upcoming" when prayer is in the future', () => {
    expect(getPrayerStatus(500, 400)).toBe('upcoming');
  });

  it('returns "active" when prayer just passed (within 30 min)', () => {
    // Prayer at 500, current at 505 = 5 min after → within 30 min window → active
    expect(getPrayerStatus(500, 505)).toBe('active');
  });

  it('returns "active" when prayer is exactly now', () => {
    expect(getPrayerStatus(500, 500)).toBe('active');
  });

  it('returns "passed" when prayer is more than 30 min ago', () => {
    expect(getPrayerStatus(500, 531)).toBe('passed');
  });
});

// ─── getNextPrayer ────────────────────────────────────────────

describe('getNextPrayer', () => {
  const makePrayer = (id: PrayerId, minutes: number): PrayerTime => ({
    id,
    name: '',
    arabic: '',
    icon: '',
    iconActive: '',
    time: '',
    minutes,
    status: 'upcoming',
  });

  it('returns next upcoming prayer excluding sunrise', () => {
    const times: PrayerTime[] = [
      makePrayer('fajr', 300),
      makePrayer('sunrise', 360),
      makePrayer('dhuhr', 720),
      makePrayer('asr', 960),
      makePrayer('maghrib', 1080),
      makePrayer('isha', 1200),
    ];
    const next = getNextPrayer(times, 730);
    expect(next).not.toBeNull();
    expect(next!.id).toBe('asr');
  });

  it('wraps to first prayer of next day when all passed', () => {
    const times: PrayerTime[] = [
      makePrayer('fajr', 300),
      makePrayer('sunrise', 360),
      makePrayer('dhuhr', 720),
      makePrayer('asr', 960),
      makePrayer('maghrib', 1080),
      makePrayer('isha', 1200),
    ];
    // Everything passed including isha
    const next = getNextPrayer(times, 1300);
    expect(next).not.toBeNull();
    expect(next!.id).toBe('fajr');
  });

  it('returns null when prayer array is empty', () => {
    expect(getNextPrayer([], 500)).toBeNull();
  });
});

// ─── getTimeUntilNext ─────────────────────────────────────────

describe('getTimeUntilNext', () => {
  it('returns hours and minutes', () => {
    const prayer: PrayerTime = { id: 'dhuhr', name: '', arabic: '', icon: '', iconActive: '', time: '', minutes: 720, status: 'upcoming' };
    expect(getTimeUntilNext(prayer, 600)).toBe('2h 0m');
  });

  it('returns minutes only', () => {
    const prayer: PrayerTime = { id: 'dhuhr', name: '', arabic: '', icon: '', iconActive: '', time: '', minutes: 720, status: 'upcoming' };
    expect(getTimeUntilNext(prayer, 710)).toBe('10m');
  });

  it('handles next-day wraparound: fajr at 300, now at 1300 → 440 min = 7h 20m', () => {
    const prayer: PrayerTime = { id: 'fajr', name: '', arabic: '', icon: '', iconActive: '', time: '', minutes: 300, status: 'upcoming' };
    expect(getTimeUntilNext(prayer, 1300)).toBe('7h 20m');
  });

  it('returns 0m when difference is zero', () => {
    const prayer: PrayerTime = { id: 'fajr', name: '', arabic: '', icon: '', iconActive: '', time: '', minutes: 300, status: 'active' };
    expect(getTimeUntilNext(prayer, 300)).toBe('0m');
  });
});

// ─── calculatePrayerTimes ─────────────────────────────────────

describe('calculatePrayerTimes', () => {
  test('returns all 6 prayer keys with valid minute values', () => {
    const times = calculatePrayerTimes(
      new Date(Date.UTC(2024, 0, 1)),
      0, 0, 'muslim_world_league', 'shafi'
    );
    expect(Object.keys(times).sort()).toEqual(
      ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].sort()
    );
    for (const id of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerId[]) {
      expect(times[id]).toBeGreaterThanOrEqual(0);
      expect(times[id]).toBeLessThan(1440);
    }
  });

  test('dhuhr is near solar noon at equator UTC', () => {
    const times = calculatePrayerTimes(
      new Date(Date.UTC(2024, 0, 1)),
      0, 0, 'muslim_world_league', 'shafi'
    );
    // Dhuhr = 12 + tzOff - lonCorr - eqt/60 ≈ near 12:00 UTC = 720 min
    assertMinutesClose(times.dhuhr, 720, 10);
  });

  test('fajr is before sunrise (smaller minute value)', () => {
    const times = calculatePrayerTimes(
      new Date(Date.UTC(2024, 5, 1)),
      48.8566, 2.3522, 'muslim_world_league', 'shafi'
    );
    expect(times.fajr).toBeLessThan(times.sunrise);
  });

  test('asha is after maghrib (larger minute value)', () => {
    const times = calculatePrayerTimes(
      new Date(Date.UTC(2024, 5, 1)),
      48.8566, 2.3522, 'muslim_world_league', 'shafi'
    );
    expect(times.isha).toBeGreaterThan(times.maghrib);
  });

  test('Sydney Dec 21: all values in valid range with correct fajr before sunrise', () => {
    const times = calculatePrayerTimes(
      new Date(Date.UTC(2024, 11, 21)), // Dec 21
      -33.8688, // Sydney
      151.2093,
      'muslim_world_league',
      'shafi'
    );
    for (const id of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerId[]) {
      expect(times[id]).toBeGreaterThanOrEqual(0);
      expect(times[id]).toBeLessThan(1440);
    }
    // Fajr before sunrise: universal invariant (both use same noon/midnight reference style)
    expect(times.fajr).toBeLessThan(times.sunrise);
    // Dhuhr before asr: both use 12+ convention
    expect(times.dhuhr).toBeLessThan(times.asr);
  });

  // Reference values from the standard solar-angle formulas (praytimes.org
  // method), cross-checked independently of the app code. Times are local.
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const REFERENCE: {
    city: string; lat: number; lon: number; tz: number; date: [number, number, number];
    method: CalculationMethod; madhab: 'shafi' | 'hanafi'; expected: Record<PrayerId, string>;
  }[] = [
    {
      city: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 11, date: [2026, 10, 12],
      method: 'muslim_world_league', madhab: 'shafi',
      expected: { fajr: '4:11', sunrise: '5:46', dhuhr: '12:39', asr: '16:23', maghrib: '19:33', isha: '21:02' },
    },
    {
      city: 'London', lat: 51.5074, lon: -0.1278, tz: 0, date: [2026, 10, 12],
      method: 'muslim_world_league', madhab: 'shafi',
      expected: { fajr: '5:17', sunrise: '7:14', dhuhr: '11:45', asr: '13:52', maghrib: '16:16', isha: '18:05' },
    },
    {
      city: 'New York (Hanafi)', lat: 40.7128, lon: -74.006, tz: -4, date: [2026, 2, 15],
      method: 'isna', madhab: 'hanafi',
      expected: { fajr: '5:52', sunrise: '7:07', dhuhr: '13:05', asr: '17:16', maghrib: '19:03', isha: '20:18' },
    },
    {
      city: 'Makkah', lat: 21.4225, lon: 39.8262, tz: 3, date: [2026, 10, 12],
      method: 'umm_al_qura', madhab: 'shafi',
      expected: { fajr: '5:11', sunrise: '6:30', dhuhr: '12:05', asr: '15:17', maghrib: '17:40', isha: '19:10' },
    },
  ];

  test.each(REFERENCE)('$city matches reference timetable within 3 minutes', ({ lat, lon, tz, date, method, madhab, expected }) => {
    (getTimezoneOffset as jest.Mock).mockReturnValue(tz);
    try {
      const times = calculatePrayerTimes(new Date(date[0], date[1], date[2]), lat, lon, method, madhab);
      for (const id of Object.keys(expected) as PrayerId[]) {
        assertMinutesClose(times[id], toMin(expected[id]), 3);
      }
    } finally {
      (getTimezoneOffset as jest.Mock).mockReturnValue(0);
    }
  });

  test('high latitude summer still gives Fajr before sunrise and Isha after Maghrib', () => {
    (getTimezoneOffset as jest.Mock).mockReturnValue(1);
    try {
      const times = calculatePrayerTimes(new Date(2026, 5, 21), 51.5074, -0.1278, 'muslim_world_league', 'shafi');
      expect(times.fajr).toBeLessThan(times.sunrise);
      expect(times.isha).toBeGreaterThan(times.maghrib);
      expect(times.fajr).toBeGreaterThan(0);
    } finally {
      (getTimezoneOffset as jest.Mock).mockReturnValue(0);
    }
  });

  test('different calculation methods produce different fajr times', () => {
    const date = new Date(Date.UTC(2024, 5, 1));
    // Cairo: below 48°, so no high-latitude rule evens the methods out.
    const mwl = calculatePrayerTimes(date, 30.0444, 31.2357, 'muslim_world_league', 'shafi');
    const isna = calculatePrayerTimes(date, 30.0444, 31.2357, 'isna', 'shafi');
    // ISNA's 15° Fajr angle is shallower than MWL's 18°, so ISNA's Fajr is later.
    expect(isna.fajr).toBeGreaterThan(mwl.fajr);
  });

  test('Shafi vs Hanafi produce different Asr times', () => {
    const date = new Date(Date.UTC(2024, 5, 1));
    const shafi = calculatePrayerTimes(date, 48.8566, 2.3522, 'muslim_world_league', 'shafi');
    const hanafi = calculatePrayerTimes(date, 48.8566, 2.3522, 'muslim_world_league', 'hanafi');
    expect(hanafi.asr).not.toEqual(shafi.asr);
  });

  test('Umm Al-Qura uses minutes-after-maghrib for Isha', () => {
    const times = calculatePrayerTimes(
      new Date(Date.UTC(2024, 5, 1)),
      21.4225,  // Mecca lat
      39.8264,  // Mecca lon
      'umm_al_qura',
      'shafi'
    );
    // Umm Al-Qura: Isha = Maghrib + 90min
    const expectedIsha = times.maghrib + 90;
    assertMinutesClose(times.isha, expectedIsha, 5);
  });
});

// ─── getPrayerTimesObject ─────────────────────────────────────

describe('getPrayerTimesObject', () => {
  // Helper: create a real-ish date that won't change the mock behavior
  const testDate = new Date(Date.UTC(2024, 0, 1));

  it('returns 6 prayers in correct order', () => {
    const result = getPrayerTimesObject(
      testDate, 0, 0, 'muslim_world_league', 'shafi'
    );
    expect(result).toHaveLength(6);
    expect(result.map(p => p.id)).toEqual(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
  });

  it('includes all required fields', () => {
    const result = getPrayerTimesObject(
      testDate, 0, 0, 'muslim_world_league', 'shafi'
    );
    for (const prayer of result) {
      expect(prayer).toHaveProperty('id');
      expect(prayer).toHaveProperty('name');
      expect(prayer).toHaveProperty('arabic');
      expect(prayer).toHaveProperty('icon');
      expect(prayer).toHaveProperty('iconActive');
      expect(prayer).toHaveProperty('time');
      expect(prayer).toHaveProperty('minutes');
      expect(prayer).toHaveProperty('status');
      expect(typeof prayer.minutes).toBe('number');
    }
  });

  it('uses manually provided currentMinutes for status calculation', () => {
    const result = getPrayerTimesObject(
      testDate, 0, 0, 'muslim_world_league', 'shafi',
      0 // midnight — should show fajr as upcoming
    );
    const fajr = result.find(p => p.id === 'fajr');
    expect(fajr).toBeDefined();
    expect(fajr!.status).toBe('upcoming');
  });
});

// ─── Qibla Direction ──────────────────────────────────────────

describe('calculateQiblaDirection', () => {
  it('from Mecca to Kaaba returns ~0°', () => {
    const bearing = calculateQiblaDirection(21.4225, 39.8264); // same as Kaaba
    assertMinutesClose(bearing, 0, 5);
  });

  it('from Sydney returns a bearing ~278°', () => {
    const bearing = calculateQiblaDirection(-33.8688, 151.2093);
    assertMinutesClose(bearing, 278, 3);
  });

  it('bearing is always 0-360', () => {
    for (const [lat, lon] of [[90, 0], [-90, 0], [0, 180], [51.5, -0.13]]) {
      const bearing = calculateQiblaDirection(lat, lon);
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    }
  });
});

// ─── bearingToCompassDirection ────────────────────────────────

describe('bearingToCompassDirection', () => {
  it('returns N for 0°', () => expect(bearingToCompassDirection(0)).toBe('N'));
  it('returns N for 360°', () => expect(bearingToCompassDirection(360)).toBe('N'));
  it('returns E for 90°', () => expect(bearingToCompassDirection(90)).toBe('E'));
  it('returns S for 180°', () => expect(bearingToCompassDirection(180)).toBe('S'));
  it('returns W for 270°', () => expect(bearingToCompassDirection(270)).toBe('W'));
  it('returns NE for 45°', () => expect(bearingToCompassDirection(45)).toBe('NE'));
  it('returns NW for 315°', () => expect(bearingToCompassDirection(315)).toBe('NW'));

  it('handles edge between directions at 348.75° → N', () => {
    expect(bearingToCompassDirection(349)).toBe('N');
  });
});

// ─── haversineDistance ────────────────────────────────────────

describe('haversineDistance', () => {
  it('zero distance between same point', () => {
    expect(haversineDistance(0, 0, 0, 0)).toBeCloseTo(0, 5);
  });

  it('Mecca to Medina ~338 km', () => {
    const dist = haversineDistance(21.4225, 39.8264, 24.4670, 39.6111);
    expect(dist).toBeGreaterThan(300);
    expect(dist).toBeLessThan(380);
  });

  it('equator to pole is 1/4 circumference ~10007 km', () => {
    const dist = haversineDistance(0, 0, 90, 0);
    expect(dist).toBeGreaterThan(9900);
    expect(dist).toBeLessThan(10100);
  });

  it('Sydney to Mecca ~13300 km', () => {
    const dist = haversineDistance(-33.8688, 151.2093, 21.4225, 39.8264);
    expect(dist).toBeGreaterThan(12000);
    expect(dist).toBeLessThan(14000);
  });
});

// ─── Bug Fix Regression Tests ─────────────────────────────────

describe('Bug fix regression: times are measured from midnight, not from noon', () => {
  test('equator on Jan 1: Dhuhr near noon, Maghrib near 6 PM', () => {
    const times = calculatePrayerTimes(
      new Date(Date.UTC(2024, 0, 1)),
      0, 0, // equator, prime meridian
      'muslim_world_league',
      'shafi'
    );
    // Dhuhr near noon — depends on EOT which depends on correct declination via M
    assertMinutesClose(times.dhuhr, 720, 10);
    // Day is ~12h at the equator, so sunset is ~6h after noon (~18:00 = 1080 min).
    // The old code returned ~6 AM here because it measured from midnight.
    assertMinutesClose(times.maghrib, 1087, 10);
    assertMinutesClose(times.sunrise, 1080 - 727, 15);
  });
});

describe('Bug fix regression: Isha formula', () => {
  test('Isha is after Maghrib (not before)', () => {
    const date = new Date(Date.UTC(2024, 5, 1)); // June
    const methods: CalculationMethod[] = ['muslim_world_league', 'isna', 'egyptian', 'karachi'];
    for (const method of methods) {
      const times = calculatePrayerTimes(date, 48.8566, 2.3522, method, 'shafi');
      expect(times.isha).toBeGreaterThan(times.maghrib);
    }
  });
});
