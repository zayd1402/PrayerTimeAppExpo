// Jest runs in Australia/Sydney (see jest.globalSetup.js), where the UTC date is
// still yesterday until 11am, so UTC date keys go wrong every morning.

import { jest } from '@jest/globals';

const store: Record<string, string | number | boolean> = {};

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn((key: string) => (store[key] as string | undefined)),
    set: jest.fn((key: string, value: string | number | boolean) => {
      store[key] = value;
    }),
    getNumber: jest.fn((key: string) => (store[key] as number | undefined)),
    remove: jest.fn((key: string) => {
      delete store[key];
    }),
  })),
}));

import { getLocalDateKey, getLocalDateKeyDaysAgo, getPrayerDateKey } from '../date';
import {
  markPrayer,
  getStreak,
  getHeatmapData,
  addKhushuEntry,
  getKhushuAverage,
  addDhikrSession,
  getTodayDhikrCount,
  addQuranLog,
  getWeeklyQuranStats,
  mmkv,
  getSunnahStreak,
} from '../../services/StorageService';

// 6:30am on 12 Nov in Sydney, just after Fajr, is still 11 Nov in UTC.
const MORNING = new Date(2026, 10, 12, 6, 30);

beforeEach(() => {
  Object.keys(store).forEach(key => delete store[key]);
  jest.useFakeTimers({ now: MORNING });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('local date helpers', () => {
  it('uses the local day, not the UTC day', () => {
    expect(MORNING.toISOString().slice(0, 10)).toBe('2026-11-11');
    expect(getLocalDateKey(MORNING)).toBe('2026-11-12');
  });

  it('steps back whole local days across a DST change', () => {
    // Sydney clocks went forward on 4 Oct 2026.
    expect(getLocalDateKeyDaysAgo(40, MORNING)).toBe('2026-10-03');
    expect(getLocalDateKeyDaysAgo(0, MORNING)).toBe('2026-11-12');
  });

  it('logs an Isha notification delivered after midnight under the previous day', () => {
    expect(getPrayerDateKey('isha', new Date(2026, 10, 12, 0, 40))).toBe('2026-11-11');
  });

  it('logs an Isha notification delivered in the evening under that day', () => {
    expect(getPrayerDateKey('isha', new Date(2026, 10, 11, 19, 10))).toBe('2026-11-11');
  });

  it('logs other prayers under the day they were delivered', () => {
    expect(getPrayerDateKey('fajr', new Date(2026, 10, 12, 5, 30))).toBe('2026-11-12');
  });
});

describe('streak and heatmap use local dates', () => {
  it("counts a streak that includes this morning's Fajr", async () => {
    await markPrayer('2026-11-10', 'dhuhr', 'prayed');
    await markPrayer('2026-11-11', 'isha', 'prayed');
    await markPrayer('2026-11-12', 'fajr', 'prayed');
    expect(await getStreak()).toBe(3);
  });

  it('keeps the streak when a late Isha is logged under yesterday after midnight', async () => {
    jest.setSystemTime(new Date(2026, 10, 12, 0, 30));
    await markPrayer('2026-11-10', 'fajr', 'prayed');
    await markPrayer(getPrayerDateKey('isha', new Date(2026, 10, 12, 0, 20)), 'isha', 'prayed');
    await markPrayer('2026-11-12', 'fajr', 'prayed');
    expect(await getStreak()).toBe(3);
  });

  it("puts this morning's Fajr in the heatmap under today", async () => {
    await markPrayer('2026-11-12', 'fajr', 'prayed');
    const heat = await getHeatmapData(1);
    expect(heat['2026-11-12']).toBe(1);
  });

  it('counts the sunnah streak by local day', async () => {
    mmkv.set('@prayertime:sunnah_log', JSON.stringify({
      '2026-11-11': { witr: 1 },
      '2026-11-12': { witr: 1 },
    }));
    expect(await getSunnahStreak()).toBe(2);
  });
});

describe("khushu', dhikr and Quran use local dates", () => {
  it("includes this morning's khushu' entry in today's trend", async () => {
    await addKhushuEntry({
      date: getLocalDateKey(),
      prayerId: 'fajr',
      level: 4,
      distractions: [],
      prePrayerPrep: { wuduPresence: true, arrivedEarly: false, recitedAdhkar: false },
    });
    const { entries, trend } = await getKhushuAverage(7);
    expect(entries).toBe(1);
    expect(trend[6]).toBe(4);
  });

  it("counts this morning's dhikr as today", async () => {
    await addDhikrSession({ id: '1', date: '2026-11-12', subhanallah: 33, alhamdulillah: 33, allahuakbar: 34 });
    expect(await getTodayDhikrCount()).toEqual({ subhanallah: 33, alhamdulillah: 33, allahuakbar: 34 });
  });

  it("shows this morning's Quran pages as today in the weekly chart", async () => {
    await addQuranLog({ date: '2026-11-12', pagesRead: 5 });
    const week = await getWeeklyQuranStats();
    expect(week[6]).toBe(5);
  });
});
