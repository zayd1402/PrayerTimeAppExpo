// ─── PrayerScheduler — plans and schedules time-based alerts ───
import type * as Notifications from 'expo-notifications';
import { AppSettings, PrayerId, PrayerNotificationId } from '../types';
import { calculatePrayerTimes } from './PrayerService';
import {
  cancelPrayerNotifications,
  cancelReminderNotifications,
  processNotificationResponse,
  scheduleFridayDuaReminder,
  schedulePrayerNotification,
  scheduleReminderNotifications,
} from './NotificationService';
import { markPrayer, storage } from './StorageService';
import { getLocalDateKey, getPrayerDateKey } from '../utils/date';

/**
 * Days of alerts to keep queued. iOS allows 64 pending notifications:
 * 5 days × (5 prayers + Fajr alarm + Friday dua) + 6 reminders stays well under it.
 */
export const SCHEDULE_DAYS = 5;

const NOTIFIABLE: PrayerNotificationId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_NAMES: Record<PrayerNotificationId, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

export interface PlannedAlert {
  kind: 'prayer' | 'fajr-alarm' | 'friday-dua';
  prayerId: PrayerNotificationId;
  at: Date;
  /** The local day the prayer belongs to (Isha after midnight stays on its own day). */
  dateKey: string;
}

/** Pure: every alert due in the next `days` days, in time order. */
export function planPrayerAlerts(
  settings: AppSettings,
  now: Date = new Date(),
  days: number = SCHEDULE_DAYS,
): PlannedAlert[] {
  const location = settings.location;
  if (!settings.notificationsEnabled || !location) return [];

  const alerts: PlannedAlert[] = [];
  for (let offset = 0; offset < days; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dateKey = getLocalDateKey(day);
    const times = calculatePrayerTimes(
      day, location.latitude, location.longitude,
      settings.calculationMethod, settings.madhab,
    );
    const at = (id: PrayerId, minutesOffset = 0) => {
      let minutes = times[id];
      // Isha can fall after midnight in high-latitude summers.
      if (id === 'isha' && minutes < times.maghrib) minutes += 1440;
      return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes + minutesOffset);
    };

    for (const id of NOTIFIABLE) {
      if (settings.prayerNotifications[id]) {
        alerts.push({ kind: 'prayer', prayerId: id, at: at(id), dateKey });
      }
    }
    if (settings.fajrAlarmEnabled) {
      alerts.push({ kind: 'fajr-alarm', prayerId: 'fajr', at: at('fajr', -settings.fajrAlarmMinutes), dateKey });
    }
    if (day.getDay() === 5) {
      alerts.push({ kind: 'friday-dua', prayerId: 'maghrib', at: at('maghrib', -60), dateKey });
    }
  }

  return alerts
    .filter(alert => alert.at.getTime() > now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

/**
 * Changes whenever the alert plan would change: settings that feed it, and the
 * day (so the queue is topped up as days pass).
 */
export function getAlertPlanKey(settings: AppSettings, now: Date = new Date()): string {
  const loc = settings.location;
  return JSON.stringify([
    getLocalDateKey(now),
    settings.notificationsEnabled,
    loc ? [loc.latitude.toFixed(3), loc.longitude.toFixed(3)] : null,
    settings.calculationMethod,
    settings.madhab,
    settings.prayerNotifications,
    settings.fajrAlarmEnabled ? settings.fajrAlarmMinutes : null,
  ]);
}

/** Replaces all queued prayer-time alerts with a fresh plan. */
export async function schedulePrayerAlerts(settings: AppSettings, now: Date = new Date()): Promise<number> {
  await cancelPrayerNotifications();
  const plan = planPrayerAlerts(settings, now);
  for (const alert of plan) {
    if (alert.kind === 'friday-dua') {
      await scheduleFridayDuaReminder(alert.at, alert.dateKey);
    } else {
      await schedulePrayerNotification(
        alert.prayerId, PRAYER_NAMES[alert.prayerId], alert.at, alert.dateKey,
        alert.kind === 'fajr-alarm',
      );
    }
  }
  return plan.length;
}

/** Turns the fixed reminders (Friday, fasting, hadith, adhkar) on or off. */
export async function syncReminderNotifications(enabled: boolean): Promise<void> {
  if (enabled) await scheduleReminderNotifications();
  else await cancelReminderNotifications();
}

// ─── Notification actions ────────────────────────────────────
const HANDLED_RESPONSES_KEY = '@prayertime:handled_notification_responses';
const MAX_HANDLED = 30;

function responseKey(response: Notifications.NotificationResponse): string {
  const { notification, actionIdentifier } = response;
  return `${notification.request.identifier}|${actionIdentifier}|${notification.date}`;
}

/**
 * Applies a notification action once, writing straight to storage so it works
 * without the UI: from the background task, or on the next launch when the app
 * was closed. The same response arriving twice is ignored.
 * Calls `onMarked` with the day that was marked.
 */
export async function handleNotificationResponseOnce(
  response: Notifications.NotificationResponse,
  onMarked?: (dateKey: string) => void,
): Promise<void> {
  const key = responseKey(response);
  let handled: string[] = [];
  try {
    handled = JSON.parse(storage.getString(HANDLED_RESPONSES_KEY) ?? '[]');
  } catch {
    handled = [];
  }
  if (handled.includes(key)) return;
  storage.set(HANDLED_RESPONSES_KEY, JSON.stringify([...handled, key].slice(-MAX_HANDLED)));

  const marks: Promise<void>[] = [];
  processNotificationResponse(response, (prayerId, deliveredAt, data) => {
    const dateKey = typeof data?.dateKey === 'string' ? data.dateKey : getPrayerDateKey(prayerId, deliveredAt);
    marks.push(markPrayer(dateKey, prayerId as PrayerId, 'prayed').then(() => onMarked?.(dateKey)));
  });
  await Promise.all(marks);
}
