import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PrayerNotificationId } from '../types';

// ─── Notification Channels (Android) ─────────────────────────
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'Prayer Times',
      description: 'Prayer time reminders and Fajr alarm',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 100, 300],
      lightColor: '#C27A2D',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      description: 'Hadith, fasting, and worship reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      sound: 'default',
    });
  }
}

// ─── Notification Categories (Action Buttons) ────────────────
const PRAYER_CATEGORY = 'prayer-action';
export const SNOOZE_MINUTES = 10;

export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(PRAYER_CATEGORY, [
    {
      identifier: 'MARK_PRAYED',
      buttonTitle: 'Mark as Prayed',
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: 'SNOOZE_10',
      buttonTitle: `Snooze (${SNOOZE_MINUTES} min)`,
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}

// ─── Notification Handler Config ─────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function hasNotificationPermission(): Promise<boolean> {
  const result = await Notifications.getPermissionsAsync();
  const permissions = result as { granted?: boolean; status?: string; ios?: { status?: number } };
  return permissions.granted === true ||
    permissions.status === 'granted' ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const result = await Notifications.requestPermissionsAsync();
  const permissions = result as { granted?: boolean; status?: string; ios?: { status?: number } };
  return permissions.granted === true ||
    permissions.status === 'granted' ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

// ─── Prayer Notifications ────────────────────────────────────
/** Identifier prefixes for alerts tied to calculated prayer times. */
export const PRAYER_ALERT_PREFIXES = ['prayer-', 'fajr-alarm', 'friday-dua'] as const;

/** Fixed-schedule reminders that don't depend on prayer times. */
export const REMINDER_IDS = [
  'friday-kahf', 'monday-fast', 'thursday-fast', 'daily-hadith',
  'morning-adhkar-daily', 'evening-adhkar-daily',
] as const;

/**
 * Schedules a one-off alert for a prayer on a specific day. Prayer times
 * shift every day, so each day gets its own alert instead of a repeating one.
 */
export async function schedulePrayerNotification(
  prayerId: PrayerNotificationId,
  prayerName: string,
  at: Date,
  dateKey: string,
  isFajrAlarm: boolean = false,
): Promise<void> {
  const identifier = isFajrAlarm ? `fajr-alarm-${dateKey}` : `prayer-${prayerId}-${dateKey}`;

  const title = isFajrAlarm ? 'Fajr Alarm' : `${prayerName} Prayer Time`;
  const body = isFajrAlarm
    ? 'Time to wake up for Fajr prayer'
    : `It's time for ${prayerName} prayer`;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: PRAYER_CATEGORY,
      data: { prayerId, dateKey, action: isFajrAlarm ? 'alarm' : 'time' },
          },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      ...(Platform.OS === 'android' && { channelId: 'prayer-times' }),
      date: at,
    },
  });
}

/** Friday reminder for the last hour before Maghrib, on a given Friday. */
export async function scheduleFridayDuaReminder(at: Date, dateKey: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `friday-dua-${dateKey}`,
    content: {
      title: 'Best Dua Time!',
      body: 'The last hour before Maghrib on Friday is the best time for dua.',
      sound: true,
          },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      date: at,
    },
  });
}

/** Cancels prayer-time alerts only, leaving snoozes and other reminders in place. */
export async function cancelPrayerNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .map(n => n.identifier)
      .filter(id => PRAYER_ALERT_PREFIXES.some(prefix => id.startsWith(prefix)))
      .map(id => Notifications.cancelScheduledNotificationAsync(id)),
  );
}

export async function cancelReminderNotifications(): Promise<void> {
  await Promise.all(REMINDER_IDS.map(id => Notifications.cancelScheduledNotificationAsync(id)));
}

// ─── Friday Reminders ────────────────────────────────────────
export async function scheduleFridayReminders(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: 'friday-kahf',
    content: {
      title: 'Friday Reminder',
      body: 'Don\'t forget to read Surah Al-Kahf today!',
      sound: true,
          },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      weekday: 6,
      hour: 8,
      minute: 0,
    },
  });
}

/** Schedules every fixed reminder. Same identifiers replace earlier copies. */
export async function scheduleReminderNotifications(): Promise<void> {
  await scheduleFridayReminders();
  await scheduleWeeklyReminders();
  await scheduleSunnahReminders();
}

// ─── Weekly Activity Reminders ───────────────────────────────
export async function scheduleWeeklyReminders(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: 'monday-fast',
    content: {
      title: 'Monday Fast',
      body: 'Consider fasting today — it is a Sunnah practice.',
      sound: true,
          },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      weekday: 2,
      hour: 6,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: 'thursday-fast',
    content: {
      title: 'Thursday Fast',
      body: 'Consider fasting today — deeds are presented to Allah on this day.',
      sound: true,
          },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      weekday: 5,
      hour: 6,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-hadith',
    content: {
      title: 'Hadith of the Day',
      body: 'Open the app to read today\'s hadith and reflect on its meaning.',
      sound: true,
          },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      hour: 9,
      minute: 0,
    },
  });
}

// ─── Schedule Sunnah Reminder ───────────────────────────────
export async function scheduleSunnahReminders(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: 'morning-adhkar-daily',
    content: {
      title: 'Morning Adhkar',
      body: 'Start your day with the morning remembrances.',
      sound: true,
          },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      hour: 8,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: 'evening-adhkar-daily',
    content: {
      title: 'Evening Adhkar',
      body: 'Take a moment for the evening remembrances before the night falls.',
      sound: true,
          },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      hour: 17,
      minute: 0,
    },
  });
}

// ─── Cancel All Notifications ────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Cancel Specific Notification ────────────────────────────
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

// ─── Snooze ──────────────────────────────────────────────────
/**
 * Re-delivers a prayer notification after `minutes`. The snoozed copy keeps
 * the prayer category, so it can be marked as prayed or snoozed again.
 * Each prayer has a single snooze slot: snoozing again replaces the pending one.
 */
export async function snoozePrayerNotification(
  content: Pick<Notifications.NotificationContent, 'title' | 'body' | 'data'>,
  minutes: number = SNOOZE_MINUTES,
): Promise<string> {
  const data = (content.data ?? {}) as Record<string, unknown>;
  const prayerId = typeof data.prayerId === 'string' ? data.prayerId : 'unknown';
  const identifier = `snooze-${prayerId}`;

  await Notifications.cancelScheduledNotificationAsync(identifier);
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: content.title ?? 'Prayer Reminder',
      body: content.body ?? '',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: PRAYER_CATEGORY,
      data: { ...data, snoozed: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      ...(Platform.OS === 'android' && { channelId: 'prayer-times' }),
      seconds: Math.max(1, Math.round(minutes * 60)),
      repeats: false,
    },
  });
}

// ─── Notification Response Handler ───────────────────────────
export type MarkPrayedCallback = (
  prayerId: string,
  deliveredAt: Date,
  data: Record<string, unknown> | undefined,
) => void;

/**
 * Applies a notification action. Shared by the foreground listener, the
 * Android background task, and the launch-time check for a missed response.
 */
export function processNotificationResponse(
  response: Notifications.NotificationResponse,
  onMarkPrayed: MarkPrayedCallback,
  onNotificationTap: (data: Record<string, unknown> | undefined) => void = () => {},
): void {
  const { request } = response.notification;
  const data = request.content.data as Record<string, unknown> | undefined;
  const actionId = response.actionIdentifier;

  if (actionId === 'MARK_PRAYED' && typeof data?.prayerId === 'string') {
    // Use the time the notification was delivered, not when it was acted on,
    // so a prayer marked after midnight is logged under its own day.
    const deliveredMs = response.notification.date;
    const deliveredAt = Number.isFinite(deliveredMs) && deliveredMs > 0 ? new Date(deliveredMs) : new Date();
    onMarkPrayed(data.prayerId, deliveredAt, data);
    // A pending snooze for a prayer that is now done would be noise.
    Notifications.cancelScheduledNotificationAsync(`snooze-${data.prayerId}`).catch(() => {});
    Notifications.dismissNotificationAsync(request.identifier).catch(() => {});
  }
  if (actionId === 'SNOOZE_10') {
    snoozePrayerNotification(request.content).catch(() => {});
    Notifications.dismissNotificationAsync(request.identifier).catch(() => {});
  }
  if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    onNotificationTap(data);
  }
}

export function setupNotificationResponseHandler(
  onMarkPrayed: MarkPrayedCallback,
  onNotificationTap: (data: Record<string, unknown> | undefined) => void,
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(response => {
    processNotificationResponse(response, onMarkPrayed, onNotificationTap);
  });
}
