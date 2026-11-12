import { jest } from '@jest/globals';

const scheduleNotificationAsync = jest.fn();
const cancelScheduledNotificationAsync = jest.fn();
const cancelAllScheduledNotificationsAsync = jest.fn();
const setNotificationChannelAsync = jest.fn();
const setNotificationCategoryAsync = jest.fn();
const addNotificationResponseReceivedListener = jest.fn((_cb: unknown) => ({ remove: jest.fn() }));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync,
  setNotificationCategoryAsync,
  addNotificationResponseReceivedListener,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  AndroidImportance: { HIGH: 'high', DEFAULT: 'default' },
  AndroidNotificationPriority: { HIGH: 'high' },
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
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
  setupNotificationResponseHandler,
} from '../NotificationService';

beforeEach(() => {
  jest.clearAllMocks();
});

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

  describe('setupNotificationResponseHandler', () => {
    const respond = (date: number, actionIdentifier = 'MARK_PRAYED') => {
      const listener = addNotificationResponseReceivedListener.mock.calls[0][0] as (r: unknown) => void;
      listener({
        actionIdentifier,
        notification: { date, request: { content: { data: { prayerId: 'isha' } } } },
      });
    };

    it('passes the delivery time, not the time the action was tapped', () => {
      const onMarkPrayed = jest.fn();
      setupNotificationResponseHandler(onMarkPrayed, jest.fn());
      const delivered = new Date(2026, 10, 11, 19, 45).getTime();
      respond(delivered);
      expect(onMarkPrayed).toHaveBeenCalledWith('isha', new Date(delivered));
    });

    it('falls back to now when the delivery time is missing', () => {
      const onMarkPrayed = jest.fn();
      setupNotificationResponseHandler(onMarkPrayed, jest.fn());
      const before = Date.now();
      respond(Number.NaN);
      const deliveredAt = onMarkPrayed.mock.calls[0][1] as Date;
      expect(deliveredAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('does not mark a prayer on a plain tap', () => {
      const onMarkPrayed = jest.fn();
      const onTap = jest.fn();
      setupNotificationResponseHandler(onMarkPrayed, onTap);
      respond(Date.now(), 'expo.modules.notifications.actions.DEFAULT');
      expect(onMarkPrayed).not.toHaveBeenCalled();
      expect(onTap).toHaveBeenCalled();
    });
  });
});
