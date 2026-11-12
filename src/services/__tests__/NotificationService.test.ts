import { jest } from '@jest/globals';

const scheduleNotificationAsync = jest.fn();
const cancelScheduledNotificationAsync = jest.fn();
const cancelAllScheduledNotificationsAsync = jest.fn();
const getAllScheduledNotificationsAsync = jest.fn(() => Promise.resolve([] as { identifier: string }[]));
const setNotificationChannelAsync = jest.fn();
const setNotificationCategoryAsync = jest.fn();
const dismissNotificationAsync = jest.fn(() => Promise.resolve());
let responseListener: ((response: unknown) => void) | null = null;
const addNotificationResponseReceivedListener = jest.fn((cb: (response: unknown) => void) => {
  responseListener = cb;
  return { remove: jest.fn() };
});

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync,
  setNotificationCategoryAsync,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  getAllScheduledNotificationsAsync,
  dismissNotificationAsync,
  addNotificationResponseReceivedListener,
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  AndroidImportance: { HIGH: 'high', DEFAULT: 'default' },
  AndroidNotificationPriority: { HIGH: 'high' },
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    TIME_INTERVAL: 'timeInterval',
    DATE: 'date',
  },
  IosAuthorizationStatus: { AUTHORIZED: 2, PROVISIONAL: 3 },
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Vibration: { vibrate: jest.fn() },
}));

import {
  setupNotificationChannels,
  setupNotificationCategories,
  schedulePrayerNotification,
  cancelAllNotifications,
  scheduleFridayReminders,
  cancelPrayerNotifications,
  cancelReminderNotifications,
  snoozePrayerNotification,
  setupNotificationResponseHandler,
} from '../NotificationService';

beforeEach(() => {
  jest.clearAllMocks();
  scheduleNotificationAsync.mockImplementation(() => Promise.resolve('id'));
  cancelScheduledNotificationAsync.mockImplementation(() => Promise.resolve());
});

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

function respond(actionIdentifier: string, date: number = Date.now()) {
  responseListener?.({
    actionIdentifier,
    notification: {
      date,
      request: {
        identifier: 'prayer-dhuhr',
        content: { title: 'Dhuhr Prayer Time', body: "It's time for Dhuhr prayer", data: { prayerId: 'dhuhr', action: 'time' } },
      },
    },
  });
}

describe('NotificationService', () => {
  describe('setupNotificationChannels', () => {
    it('creates prayer-times and reminders channels on Android', async () => {
      const { Platform } = jest.requireMock('react-native') as { Platform: { OS: string } };
      Platform.OS = 'android';
      await setupNotificationChannels();
      expect(setNotificationChannelAsync).toHaveBeenCalledWith(
        'prayer-times',
        expect.objectContaining({ name: 'Prayer Times' })
      );
      expect(setNotificationChannelAsync).toHaveBeenCalledWith(
        'reminders',
        expect.objectContaining({ name: 'Reminders' })
      );
    });

    it('does nothing on iOS', async () => {
      const { Platform } = jest.requireMock('react-native') as { Platform: { OS: string } };
      Platform.OS = 'ios';
      await setupNotificationChannels();
      expect(setNotificationChannelAsync).not.toHaveBeenCalled();
    });
  });

  describe('setupNotificationCategories', () => {
    it('registers prayer action category', async () => {
      await setupNotificationCategories();
      expect(setNotificationCategoryAsync).toHaveBeenCalledWith(
        'prayer-action',
        expect.arrayContaining([
          expect.objectContaining({ identifier: 'MARK_PRAYED' }),
          expect.objectContaining({ identifier: 'SNOOZE_10' }),
        ])
      );
    });
  });

  describe('schedulePrayerNotification', () => {
    it('schedules a one-off alert for a prayer on a given day', async () => {
      const at = new Date(2026, 10, 12, 4, 11);
      await schedulePrayerNotification('fajr', 'Fajr', at, '2026-11-12');
      expect(scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'prayer-fajr-2026-11-12',
          content: expect.objectContaining({
            title: 'Fajr Prayer Time',
            body: "It's time for Fajr prayer",
            data: { prayerId: 'fajr', dateKey: '2026-11-12', action: 'time' },
          }),
          trigger: { type: 'date', date: at },
        })
      );
    });

    it('schedules a Fajr alarm with a different identifier', async () => {
      await schedulePrayerNotification('fajr', 'Fajr', new Date(2026, 10, 12, 3, 56), '2026-11-12', true);
      expect(scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'fajr-alarm-2026-11-12',
          content: expect.objectContaining({ title: 'Fajr Alarm' }),
        })
      );
    });
  });

  describe('cancelPrayerNotifications', () => {
    it('cancels prayer alerts but keeps snoozes and fixed reminders', async () => {
      getAllScheduledNotificationsAsync.mockImplementationOnce(() => Promise.resolve([
        { identifier: 'prayer-asr-2026-11-12' },
        { identifier: 'fajr-alarm-2026-11-13' },
        { identifier: 'friday-dua-2026-11-13' },
        { identifier: 'snooze-asr' },
        { identifier: 'friday-kahf' },
        { identifier: 'morning-adhkar-daily' },
      ]));
      await cancelPrayerNotifications();
      const cancelled = cancelScheduledNotificationAsync.mock.calls.map(call => call[0]);
      expect(cancelled.sort()).toEqual(['fajr-alarm-2026-11-13', 'friday-dua-2026-11-13', 'prayer-asr-2026-11-12']);
      expect(cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    });
  });

  describe('cancelReminderNotifications', () => {
    it('cancels only the fixed reminders', async () => {
      await cancelReminderNotifications();
      const cancelled = cancelScheduledNotificationAsync.mock.calls.map(call => call[0]);
      expect(cancelled).toContain('friday-kahf');
      expect(cancelled).toContain('daily-hadith');
      expect(cancelled.some(id => String(id).startsWith('prayer-'))).toBe(false);
    });
  });

  describe('cancelAllNotifications', () => {
    it('cancels all scheduled notifications', async () => {
      await cancelAllNotifications();
      expect(cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('scheduleFridayReminders', () => {
    it('schedules the weekly Al-Kahf reminder (the dua hour follows Maghrib instead)', async () => {
      await scheduleFridayReminders();
      expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
      const calls = scheduleNotificationAsync.mock.calls.map(
        (call) => (call[0] as { identifier: string }).identifier
      );
      expect(calls).toEqual(['friday-kahf']);
    });
  });

  describe('snoozePrayerNotification', () => {
    it('re-schedules the prayer notification 10 minutes out in the same category', async () => {
      await snoozePrayerNotification({ title: 'Asr Prayer Time', body: 'body', data: { prayerId: 'asr' } });
      expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('snooze-asr');
      expect(scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'snooze-asr',
          content: expect.objectContaining({
            title: 'Asr Prayer Time',
            categoryIdentifier: 'prayer-action',
            data: { prayerId: 'asr', snoozed: true },
          }),
          trigger: { type: 'timeInterval', seconds: 600, repeats: false },
        })
      );
    });
  });

  describe('setupNotificationResponseHandler', () => {
    it('snoozes and dismisses on the Snooze action without marking prayed', async () => {
      const onMarkPrayed = jest.fn();
      setupNotificationResponseHandler(onMarkPrayed, jest.fn());
      respond('SNOOZE_10');
      await flush();
      expect(onMarkPrayed).not.toHaveBeenCalled();
      expect(dismissNotificationAsync).toHaveBeenCalledWith('prayer-dhuhr');
      expect(scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: 'snooze-dhuhr' })
      );
    });

    it('marks prayed and clears any pending snooze on Mark as Prayed', async () => {
      const onMarkPrayed = jest.fn();
      setupNotificationResponseHandler(onMarkPrayed, jest.fn());
      respond('MARK_PRAYED');
      await flush();
      expect(onMarkPrayed).toHaveBeenCalledWith('dhuhr', expect.any(Date), expect.objectContaining({ prayerId: 'dhuhr' }));
      expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('snooze-dhuhr');
      expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('passes the delivery time, not the time the action was tapped', () => {
      const onMarkPrayed = jest.fn();
      setupNotificationResponseHandler(onMarkPrayed, jest.fn());
      const delivered = new Date(2026, 10, 11, 19, 45).getTime();
      respond('MARK_PRAYED', delivered);
      expect(onMarkPrayed).toHaveBeenCalledWith('dhuhr', new Date(delivered), expect.anything());
    });

    it('falls back to now when the delivery time is missing', () => {
      const onMarkPrayed = jest.fn();
      setupNotificationResponseHandler(onMarkPrayed, jest.fn());
      const before = Date.now();
      respond('MARK_PRAYED', Number.NaN);
      const deliveredAt = onMarkPrayed.mock.calls[0][1] as Date;
      expect(deliveredAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('does not mark a prayer on a plain tap', () => {
      const onMarkPrayed = jest.fn();
      const onTap = jest.fn();
      setupNotificationResponseHandler(onMarkPrayed, onTap);
      respond('expo.modules.notifications.actions.DEFAULT');
      expect(onMarkPrayed).not.toHaveBeenCalled();
      expect(onTap).toHaveBeenCalled();
    });
  });
});
