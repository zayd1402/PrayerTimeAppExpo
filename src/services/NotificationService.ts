import * as Notifications from 'expo-notifications';

// ─── Notification Config ─────────────────────────────────────
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
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
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

  // Cancel existing
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
      sound: isFajrAlarm ? 'fajr_alarm.wav' : true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
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
  // Friday morning reminder for Surah Al-Kahf
  await Notifications.scheduleNotificationAsync({
    identifier: 'friday-kahf',
    content: {
      title: 'Friday Reminder',
      body: 'Don\'t forget to read Surah Al-Kahf today!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6, // Friday (1 = Sunday in iOS, but Expo uses different)
      hour: 8,
      minute: 0,
    },
  });

  // Friday pre-Maghrib dua reminder
  await Notifications.scheduleNotificationAsync({
    identifier: 'friday-dua',
    content: {
      title: 'Best Dua Time!',
      body: 'The last hour before Maghrib on Friday is the best time for dua.',
      sound: true,
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
  // Monday fasting reminder
  await Notifications.scheduleNotificationAsync({
    identifier: 'monday-fast',
    content: {
      title: 'Monday Fast',
      body: 'Consider fasting today — it is a Sunnah practice.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2, // Monday
      hour: 6,
      minute: 0,
    },
  });

  // Thursday fasting reminder
  await Notifications.scheduleNotificationAsync({
    identifier: 'thursday-fast',
    content: {
      title: 'Thursday Fast',
      body: 'Consider fasting today — deeds are presented to Allah on this day.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 5, // Thursday
      hour: 6,
      minute: 0,
    },
  });

  // Daily hadith notification
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-hadith',
    content: {
      title: 'Hadith of the Day',
      body: 'Open the app to read today\'s hadith and reflect on its meaning.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
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
