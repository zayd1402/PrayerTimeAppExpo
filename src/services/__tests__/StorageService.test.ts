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

import {
  loadSettings,
  saveSettings,
  markPrayer,
  getPrayerLogForDate,
  toggleFavoriteDua,
  getFavoriteDuas,
  toggleFavoriteHadith,
  getFavoriteHadiths,
  toggleFast,
  loadFastingLog,
  addQuranLog,
  loadQuranLog,
  addDhikrSession,
  getTodayDhikrCount,
  getFridayChecklist,
  setFridayChecklist,
  getKahfProgress,
  setKahfProgress,
  clearAllData,
  clearPrayer,
  markMissedPrayers,
  getOnTimeRate,
  loadPrayerLog,
} from '../StorageService';
import { DEFAULT_SETTINGS } from '../../types';

beforeEach(() => {
  Object.keys(store).forEach(key => delete store[key]);
});

describe('StorageService', () => {
  describe('settings', () => {
    it('returns default settings when none are saved', async () => {
      const settings = await loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('saves and loads settings', async () => {
      const custom = { ...DEFAULT_SETTINGS, notificationsEnabled: false };
      await saveSettings(custom);
      const loaded = await loadSettings();
      expect(loaded.notificationsEnabled).toBe(false);
    });
  });

  describe('prayer log', () => {
    it('marks a prayer as prayed', async () => {
      const log = await markPrayer('2024-06-13', 'fajr', 'prayed');
      expect(log['2024-06-13'].fajr).toBe('prayed');
    });

    it('retrieves the prayer log for a specific date', async () => {
      await markPrayer('2024-06-13', 'dhuhr', 'qaza');
      const dayLog = await getPrayerLogForDate('2024-06-13');
      expect(dayLog).toEqual({ dhuhr: 'qaza' });
    });

    it('returns null for dates without logs', async () => {
      const dayLog = await getPrayerLogForDate('2024-06-01');
      expect(dayLog).toBeNull();
    });
  });

  describe('clearPrayer', () => {
    it('removes the entry instead of storing a status', async () => {
      await markPrayer('2024-06-13', 'dhuhr', 'prayed');
      await markPrayer('2024-06-13', 'asr', 'prayed');
      await clearPrayer('2024-06-13', 'dhuhr');
      expect(await getPrayerLogForDate('2024-06-13')).toEqual({ asr: 'prayed' });
    });

    it('drops the day once its last entry is cleared', async () => {
      await markPrayer('2024-06-13', 'dhuhr', 'qaza');
      await clearPrayer('2024-06-13', 'dhuhr');
      expect(await getPrayerLogForDate('2024-06-13')).toBeNull();
    });
  });

  describe('markMissedPrayers', () => {
    const times = { fajr: 300, sunrise: 390, dhuhr: 750, asr: 960, maghrib: 1140, isha: 1230 };

    it('fills unlogged prayers on past days since tracking started', async () => {
      await markPrayer('2024-06-11', 'fajr', 'prayed');
      const now = new Date(2024, 5, 13, 4, 0); // before Fajr
      const log = await markMissedPrayers(now, times);
      expect(log['2024-06-11']).toEqual({
        fajr: 'prayed', dhuhr: 'missed', asr: 'missed', maghrib: 'missed', isha: 'missed',
      });
      // Yesterday's Isha is still in its window before today's Fajr
      expect(log['2024-06-12']).toEqual({
        fajr: 'missed', dhuhr: 'missed', asr: 'missed', maghrib: 'missed',
      });
      expect(log['2024-06-10']).toBeUndefined();
      expect(log['2024-06-13']).toBeUndefined();
    });

    it('marks today\'s prayers missed only once their window has ended', async () => {
      await markPrayer('2024-06-13', 'fajr', 'qaza');
      const now = new Date(2024, 5, 13, 17, 0); // after Asr starts, before Maghrib
      const log = await markMissedPrayers(now, times);
      expect(log['2024-06-13']).toEqual({ fajr: 'qaza', dhuhr: 'missed' });
      // Tracking started today, so yesterday is left alone
      expect(log['2024-06-12']).toBeUndefined();
    });

    it('does nothing for a brand-new user', async () => {
      await markMissedPrayers(new Date(2024, 5, 13, 3, 0), times);
      expect(await loadPrayerLog()).toEqual({});
    });
  });

  describe('getOnTimeRate', () => {
    it('counts qaza and missed prayers against the rate', async () => {
      await markPrayer('2024-06-13', 'fajr', 'prayed');
      await markPrayer('2024-06-13', 'dhuhr', 'qaza');
      await markPrayer('2024-06-13', 'asr', 'missed');
      await markPrayer('2024-06-13', 'maghrib', 'missed');
      expect(await getOnTimeRate()).toBe(25);
    });
  });

  describe('favorite duas', () => {
    it('toggles a dua favorite on and off', async () => {
      const added = await toggleFavoriteDua('dua-1');
      expect(added).toContain('dua-1');
      const removed = await toggleFavoriteDua('dua-1');
      expect(removed).not.toContain('dua-1');
    });

    it('returns saved favorites', async () => {
      await toggleFavoriteDua('dua-1');
      await toggleFavoriteDua('dua-2');
      const favs = await getFavoriteDuas();
      expect(favs).toEqual(['dua-1', 'dua-2']);
    });
  });

  describe('favorite hadiths', () => {
    it('toggles a hadith favorite on and off', async () => {
      const added = await toggleFavoriteHadith('hadith-1');
      expect(added).toContain('hadith-1');
      const removed = await toggleFavoriteHadith('hadith-1');
      expect(removed).not.toContain('hadith-1');
    });

    it('returns saved hadith favorites', async () => {
      await toggleFavoriteHadith('hadith-1');
      const favs = await getFavoriteHadiths();
      expect(favs).toContain('hadith-1');
    });
  });

  describe('fasting log', () => {
    it('toggles a fast entry', async () => {
      const withFast = await toggleFast('2024-06-13', 'monday');
      expect(withFast['2024-06-13']).toEqual({ date: '2024-06-13', type: 'monday', completed: true });
      const withoutFast = await toggleFast('2024-06-13', 'monday');
      expect(withoutFast['2024-06-13']).toBeUndefined();
    });

    it('loads the fasting log', async () => {
      await toggleFast('2024-06-13', 'ramadan');
      const log = await loadFastingLog();
      expect(log['2024-06-13'].type).toBe('ramadan');
    });
  });

  describe('quran log', () => {
    it('adds and loads a quran entry', async () => {
      await addQuranLog({ date: '2024-06-13', pagesRead: 5, surah: 'Al-Fatiha' });
      const log = await loadQuranLog();
      expect(log['2024-06-13'].pagesRead).toBe(5);
    });
  });

  describe('dhikr history', () => {
    it('adds a dhikr session and returns today count', async () => {
      const today = new Date().toISOString().split('T')[0];
      await addDhikrSession({ id: '1', date: today, subhanallah: 33, alhamdulillah: 33, allahuakbar: 34 });
      const count = await getTodayDhikrCount();
      expect(count).toEqual({ subhanallah: 33, alhamdulillah: 33, allahuakbar: 34 });
    });
  });

  describe('friday data', () => {
    it('saves and loads friday checklist', async () => {
      await setFridayChecklist({ ghusl: true, surahKahf: false });
      const checklist = await getFridayChecklist();
      expect(checklist).toEqual({ ghusl: true, surahKahf: false });
    });

    it('saves and loads kahf progress', async () => {
      await setKahfProgress(3);
      const progress = await getKahfProgress();
      expect(progress).toBe(3);
    });
  });

  describe('clearAllData', () => {
    it('removes all known storage keys', async () => {
      await saveSettings({ ...DEFAULT_SETTINGS, location: { name: 'Test', latitude: 0, longitude: 0, source: 'manual-city' } });
      await markPrayer('2024-06-13', 'fajr', 'prayed');
      await clearAllData();
      expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
      expect(await getPrayerLogForDate('2024-06-13')).toBeNull();
    });
  });
});
