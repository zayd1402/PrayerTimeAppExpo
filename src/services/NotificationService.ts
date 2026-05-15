import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PrayerId } from '../types';

// ─── Configure ───────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Request Permissions ──────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Schedule Prayer Notification ─────────────────────────────
// Trigger at exact prayer time (minutes from midnight)
export async function schedulePrayerNotification(
  prayerId: PrayerId,
  prayerName: string,
  hour: number,   // 0-23
  minute: number, // 0-59
  isFajrAlarm: boolean = false
): Promise<string | null> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  try {
    // Cancel existing notification for this prayer
    await cancelPrayerNotification(prayerId);

    const identifier = `prayer-${prayerId}`;

    const trigger: Notifications.NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };

    const title = isFajrAlarm ? '🌙 Fajr Alarm' : '🕌 Prayer Time';
    const body = isFajrAlarm
      ? `It's time for Fajr. Start your day with barakah.`
      : `It's time for ${prayerName}. May Allah accept your prayer.`;

    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { prayerId, isFajrAlarm },
      },
      trigger,
    });

    return id;
  } catch {
    return null;
  }
}

export async function cancelPrayerNotification(prayerId: PrayerId): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`prayer-${prayerId}`);
  } catch {
    // ignore
  }
}

export async function cancelAllPrayerNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith('prayer-')) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

// ─── Fajr Alarm (special — fires at 5AM and after countdown) ──
export async function scheduleFajrAlarm(hour: number, minute: number): Promise<string | null> {
  return schedulePrayerNotification('fajr', 'Fajr', hour, minute, true);
}

// ─── Check Permission ─────────────────────────────────────────
export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ─── Get Scheduled Notifications ─────────────────────────────
export async function getScheduledPrayers(): Promise<string[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter(n => n.identifier.startsWith('prayer-')).map(n => n.identifier.replace('prayer-', ''));
}