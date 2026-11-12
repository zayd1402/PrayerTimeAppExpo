import { jest } from '@jest/globals';

const scheduleNotificationAsync = jest.fn();
const cancelScheduledNotificationAsync = jest.fn();
const cancelAllScheduledNotificationsAsync = jest.fn();
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
  snoozePrayerNotification,
  setupNotificationResponseHandler,
} from '../NotificationService';

beforeEach(() => {
  jest.clearAllMocks();
  scheduleNotificationAsync.mockImplementation(() => Promise.resolve('id'));
  cancelScheduledNotificationAsync.mockImplementation(() => Promise.resolve());
});

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

function respond(actionIdentifier: string) {
  responseListener?.({
    actionIdentifier,
    notification: {
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
    it('schedules a daily prayer notification', async () => {
      await schedulePrayerNotification('fajr', 'Fajr', 5, 30);
      expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('prayer-fajr');
      expect(scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'prayer-fajr',
          content: expect.objectContaining({
            title: 'Fajr Prayer Time',
            body: "It's time for Fajr prayer",
          }),
          trigger: expect.objectContaining({
            type: 'daily',
            hour: 5,
            minute: 30,
          }),
        })
      );
    });

    it('schedules a Fajr alarm with a different identifier', async () => {
      await schedulePrayerNotification('fajr', 'Fajr', 5, 15, true);
      expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('fajr-alarm');
      expect(scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'fajr-alarm',
          content: expect.objectContaining({ title: 'Fajr Alarm' }),
        })
      );
    });
  });

  describe('cancelAllNotifications', () => {
    it('cancels all scheduled notifications', async () => {
      await cancelAllNotifications();
      expect(cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('scheduleFridayReminders', () => {
    it('schedules two weekly Friday reminders', async () => {
      await scheduleFridayReminders();
      expect(scheduleNotificationAsync).toHaveBeenCalledTimes(2);
      const calls = scheduleNotificationAsync.mock.calls.map(
        (call) => (call[0] as { identifier: string }).identifier
      );
      expect(calls).toContain('friday-kahf');
      expect(calls).toContain('friday-dua');
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
      expect(onMarkPrayed).toHaveBeenCalledWith('dhuhr');
      expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('snooze-dhuhr');
      expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });
});
