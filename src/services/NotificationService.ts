import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
      buttonTitle: 'Snooze (10 min)',
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
  return result.granted;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

// ─── Prayer Notifications ────────────────────────────────────
export async function schedulePrayerNotification(
  prayerId: string,
  prayerName: string,
  hour: number,
  minute: number,
  isFajrAlarm: boolean = false
): Promise<void> {
  const identifier = `prayer-${prayerId}`;

  await Notifications.cancelScheduledNotificationAsync(identifier);

  const title = isFajrAlarm ? 'Fajr Alarm' : `${prayerName} Prayer Time`;
  const body = isFajrAlarm
    ? 'Time to wake up for Fajr prayer'
    : `It's time for ${prayerName} prayer`;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: isFajrAlarm ? 'fajr_alarm.wav' : 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: PRAYER_CATEGORY,
      data: { prayerId, action: 'time' },
      ...(Platform.OS === 'android' && { channelId: 'prayer-times' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// ─── Friday Reminders ────────────────────────────────────────
export async function scheduleFridayReminders(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: 'friday-kahf',
    content: {
      title: 'Friday Reminder',
      body: 'Don\'t forget to read Surah Al-Kahf today!',
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6,
      hour: 8,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: 'friday-dua',
    content: {
      title: 'Best Dua Time!',
      body: 'The last hour before Maghrib on Friday is the best time for dua.',
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6,
      hour: 16,
      minute: 30,
    },
  });
}

// ─── Weekly Activity Reminders ───────────────────────────────
export async function scheduleWeeklyReminders(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: 'monday-fast',
    content: {
      title: 'Monday Fast',
      body: 'Consider fasting today — it is a Sunnah practice.',
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
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
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
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
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
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
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
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
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
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

// ─── Notification Response Handler ───────────────────────────
export function setupNotificationResponseHandler(
  onMarkPrayed: (prayerId: string) => void,
  onNotificationTap: (data: any) => void,
): Notifications.Subscription {
  const sub = Notifications.addNotificationResponseReceivedListener(response => {
    const { data } = response.notification.request.content;
    const actionId = response.actionIdentifier;

    if (actionId === 'MARK_PRAYED' && data?.prayerId) {
      onMarkPrayed(data.prayerId);
    }
    if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      onNotificationTap(data);
    }
  });
  return sub;
}
