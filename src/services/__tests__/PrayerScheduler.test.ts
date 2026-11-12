import { jest } from '@jest/globals';

const scheduleNotificationAsync = jest.fn((_req: unknown) => Promise.resolve('id'));
const cancelScheduledNotificationAsync = jest.fn((_id: string) => Promise.resolve());
const getAllScheduledNotificationsAsync = jest.fn(() => Promise.resolve([] as { identifier: string }[]));
const dismissNotificationAsync = jest.fn((_id: string) => Promise.resolve());

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  dismissNotificationAsync,
  AndroidNotificationPriority: { HIGH: 'high' },
  SchedulableTriggerInputTypes: { DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval', DATE: 'date' },
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
}));

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

const memory = new Map<string, string>();
const markPrayer = jest.fn((_date: string, _id: string, _status: string) => Promise.resolve({}));
jest.mock('../StorageService', () => ({
  markPrayer,
  storage: {
    getString: (key: string) => memory.get(key),
    set: (key: string, value: string) => { memory.set(key, value); },
  },
}));

import { planPrayerAlerts, schedulePrayerAlerts, handleNotificationResponseOnce, getAlertPlanKey } from '../PrayerScheduler';
import { DEFAULT_SETTINGS, AppSettings } from '../../types';

// Jest runs in Australia/Sydney (jest.globalSetup.js).
const SYDNEY: AppSettings = {
  ...DEFAULT_SETTINGS,
  notificationsEnabled: true,
  prayerNotifications: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  location: { latitude: -33.8688, longitude: 151.2093, name: 'Sydney' },
};

const hm = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

beforeEach(() => {
  jest.clearAllMocks();
  memory.clear();
});

describe('planPrayerAlerts', () => {
  it('plans a dated alert per prayer at that day\'s time, skipping ones already past', () => {
    const now = new Date(2026, 10, 12, 14, 0); // Thursday 2 PM
    const plan = planPrayerAlerts(SYDNEY, now, 2);
    const today = plan.filter(a => a.dateKey === '2026-11-12');
    expect(today.map(a => a.prayerId)).toEqual(['asr', 'maghrib', 'isha']);
    expect(hm(today[0].at)).toBe('16:23');
    expect(hm(today[2].at)).toBe('21:02');
    const tomorrow = plan.filter(a => a.dateKey === '2026-11-13' && a.kind === 'prayer');
    expect(tomorrow).toHaveLength(5);
    // Times move a little each day; a repeating alert would keep today's.
    expect(tomorrow[0].at.getMinutes()).not.toBe(11);
  });

  it('respects per-prayer switches and the Fajr alarm offset', () => {
    const settings: AppSettings = {
      ...SYDNEY,
      prayerNotifications: { fajr: false, dhuhr: true, asr: false, maghrib: false, isha: false },
      fajrAlarmEnabled: true,
      fajrAlarmMinutes: 15,
    };
    const plan = planPrayerAlerts(settings, new Date(2026, 10, 12, 0, 30), 1);
    expect(plan.map(a => `${a.kind}:${a.prayerId}`)).toEqual(['fajr-alarm:fajr', 'prayer:dhuhr']);
    expect(hm(plan[0].at)).toBe('3:56');
  });

  it('adds the Friday dua reminder an hour before Maghrib', () => {
    const plan = planPrayerAlerts(SYDNEY, new Date(2026, 10, 13, 9, 0), 1); // Friday
    const dua = plan.find(a => a.kind === 'friday-dua');
    expect(dua).toBeDefined();
    const maghrib = plan.find(a => a.prayerId === 'maghrib' && a.kind === 'prayer')!;
    expect(maghrib.at.getTime() - dua!.at.getTime()).toBe(60 * 60 * 1000);
  });

  it('plans nothing when notifications are off or there is no location', () => {
    expect(planPrayerAlerts({ ...SYDNEY, notificationsEnabled: false })).toEqual([]);
    expect(planPrayerAlerts({ ...SYDNEY, location: null })).toEqual([]);
  });

  it('changes its key when the day changes, so the queue is topped up daily', () => {
    expect(getAlertPlanKey(SYDNEY, new Date(2026, 10, 12, 23, 59)))
      .not.toEqual(getAlertPlanKey(SYDNEY, new Date(2026, 10, 13, 0, 1)));
  });
});

describe('schedulePrayerAlerts', () => {
  it('replaces only prayer alerts and schedules the new plan', async () => {
    getAllScheduledNotificationsAsync.mockImplementationOnce(() => Promise.resolve([
      { identifier: 'prayer-asr-2026-11-11' }, { identifier: 'friday-kahf' },
    ]));
    const count = await schedulePrayerAlerts(SYDNEY, new Date(2026, 10, 12, 14, 0));
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('prayer-asr-2026-11-11');
    expect(cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('friday-kahf');
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(count);
    expect(count).toBeGreaterThan(15);
  });
});

describe('handleNotificationResponseOnce', () => {
  const response = (dateKey?: string) => ({
    actionIdentifier: 'MARK_PRAYED',
    notification: {
      date: new Date(2026, 10, 13, 0, 40).getTime(),
      request: {
        identifier: 'prayer-isha-2026-11-12',
        content: { title: 'Isha', body: '', data: { prayerId: 'isha', ...(dateKey ? { dateKey } : {}) } },
      },
    },
  }) as unknown as Parameters<typeof handleNotificationResponseOnce>[0];

  it('marks the prayer on the day stored in the alert', async () => {
    const onMarked = jest.fn();
    await handleNotificationResponseOnce(response('2026-11-12'), onMarked);
    expect(markPrayer).toHaveBeenCalledWith('2026-11-12', 'isha', 'prayed');
    expect(onMarked).toHaveBeenCalledWith('2026-11-12');
  });

  it('ignores the same response the second time (listener and launch check)', async () => {
    await handleNotificationResponseOnce(response('2026-11-12'));
    await handleNotificationResponseOnce(response('2026-11-12'));
    expect(markPrayer).toHaveBeenCalledTimes(1);
  });

  it('falls back to the delivery time for older alerts without a day', async () => {
    await handleNotificationResponseOnce(response());
    // Isha delivered at 00:40 belongs to the previous day.
    expect(markPrayer).toHaveBeenCalledWith('2026-11-12', 'isha', 'prayed');
  });
});
