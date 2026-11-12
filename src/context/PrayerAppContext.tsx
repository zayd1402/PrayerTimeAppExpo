// ─── PrayerAppContext — Global state for the app ──────────────
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { getLocalDateKey } from '../utils/date';
import { logger } from '../utils/logger';
import * as NavigationBar from 'expo-navigation-bar';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { PrayerId, PrayerLogEntry, PrayerTime, AppSettings, AppLocation, DEFAULT_SETTINGS, PRAYER_ICONS, PRAYER_IDS, PrayerNotificationId } from '../types';
import {
  getPrayerTimesObject, getNextPrayer, getTimeUntilNext
} from '../services/PrayerService';
import { HijriService } from '../services/HijriService';
import {
  loadSettings, saveSettings, markPrayer, clearPrayer, markMissedPrayers,
} from '../services/StorageService';
import { getCurrentLocation } from '../services/LocationService';
import {
  schedulePrayerNotification,
  setupNotificationChannels,
  setupNotificationCategories,
  scheduleFridayReminders,
  scheduleWeeklyReminders,
  scheduleSunnahReminders,
  setupNotificationResponseHandler,
  cancelAllNotifications,
} from '../services/NotificationService';
import { getDailyHadith } from '../data/hadiths';
import { initAudio, playAdhan } from '../services/AudioService';

type PrayerStatus = PrayerLogEntry['status'];
type DayStatuses = Partial<Record<PrayerId, PrayerStatus>>;

function getDateKey(date: Date): string {
  return getLocalDateKey(date);
}

function minutesFromMidnight(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getHourMinute(minutes: number): { hour: number; minute: number } {
  return {
    hour: Math.floor((minutes % 1440) / 60),
    minute: minutes % 60,
  };
}

function getScheduleKey(settings: AppSettings, times: PrayerTime[]): string {
  return [
    times.map(p => `${p.id}:${p.minutes}`).join('|'),
    ...PRAYER_IDS.filter(id => id !== 'sunrise').map(id => `${id}:${settings.prayerNotifications[id as PrayerNotificationId] ? 1 : 0}`),
    settings.fajrAlarmEnabled ? `fajr-alarm:${settings.fajrAlarmMinutes}` : 'fajr-alarm:0',
  ].join(';');
}

async function scheduleEnabledNotifications(
  settings: AppSettings,
  times: PrayerTime[],
  lastScheduledRef: { current: string }
) {
  const scheduleKey = getScheduleKey(settings, times);
  if (scheduleKey === lastScheduledRef.current) return;
  lastScheduledRef.current = scheduleKey;

  await cancelAllNotifications();

  for (const prayer of times) {
    if (prayer.id === 'sunrise') continue;
    if (!settings.prayerNotifications[prayer.id as PrayerNotificationId]) continue;
    const { hour, minute } = getHourMinute(prayer.minutes);
    await schedulePrayerNotification(prayer.id as PrayerNotificationId, prayer.name, hour, minute, false);
  }

  if (settings.fajrAlarmEnabled) {
    const fajr = times.find(p => p.id === 'fajr');
    if (fajr) {
      const alarmMinutes = (fajr.minutes - settings.fajrAlarmMinutes + 1440) % 1440;
      const { hour, minute } = getHourMinute(alarmMinutes);
      await schedulePrayerNotification('fajr', 'Fajr', hour, minute, true);
    }
  }
}

export interface PrayerAppState {
  settings: AppSettings;
  prayerTimes: PrayerTime[];
  nextPrayer: PrayerTime | null;
  location: AppLocation | null;
  loading: boolean;
  error: string | null;
  /** Prayers done today, on time or as qaza. */
  completedPrayers: Set<string>;
  /** Today's logged status per prayer. Unlogged prayers are absent. */
  prayerStatuses: DayStatuses;
  timerDisplay: string;
  dailyHadith: { english: string; source: string } | null;
  prayersObj: Record<string, Date>;
  nextPrayerObj: { id: string; name: string; arabicName: string; icon: string } | null;
  nextPrayerTime: Date | null;
  hijriDateStr: string;
  /** Unlogged or missed → prayed on time; prayed or qaza → cleared. */
  handleTogglePrayer: (id: string) => void;
  /** Sets today's status for a prayer, or clears it with null. */
  handleMarkPrayer: (id: PrayerId, status: PrayerStatus | null) => void;
  handleUpdateSettings: (partial: Partial<AppSettings>) => void;
}

const PrayerAppContext = createContext<PrayerAppState | null>(null);

// ─── Background Fetch ────────────────────────────────────────
const BACKGROUND_FETCH_TASK = 'prayertime-daily-refresh';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const saved = await loadSettings();
    const now = new Date();
    if (!saved.location) return BackgroundFetch.BackgroundFetchResult.NoData;

    const times = getPrayerTimesObject(
      now, saved.location.latitude, saved.location.longitude,
      saved.calculationMethod, saved.madhab,
    );
    const prayerTimesArray = Object.values(times);

    if (saved.notificationsEnabled) {
      await cancelAllNotifications();
      for (const pt of prayerTimesArray) {
        const notifId = `prayer-${pt.id}` as PrayerNotificationId;
        await schedulePrayerNotification(notifId, pt.name, Math.floor(pt.minutes / 60), pt.minutes % 60);
      }
      if (saved.fajrAlarmEnabled) {
        const fajrIdx = times.findIndex(pt => pt.id === 'fajr');
        if (fajrIdx >= 0) {
          const fajr = times[fajrIdx];
          const fajrMinute = Math.max(0, fajr.minutes - saved.fajrAlarmMinutes);
          await schedulePrayerNotification('fajr-alarm' as PrayerNotificationId, 'Fajr', Math.floor(fajrMinute / 60), fajrMinute % 60, true);
        }
      }
      await scheduleFridayReminders();
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export function PrayerAppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [location, setLocation] = useState<AppLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prayerStatuses, setPrayerStatuses] = useState<DayStatuses>({});
  const [timerDisplay, setTimerDisplay] = useState('');
  const [dailyHadith, setDailyHadith] = useState<{ english: string; source: string } | null>(null);
  const lastScheduledRef = useRef<string>('');
  const notifSubRef = useRef<{ remove: () => void } | null>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'android') {
        NavigationBar.setStyle('light');
      }
      const saved = await loadSettings();
      setSettings(saved);
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
        setError(null);
        const newSettings = { ...saved, location: loc };
        setSettings(newSettings);
        await saveSettings(newSettings);
      } else if (saved.location) {
        setLocation(saved.location);
        setError(null);
      } else {
        setLocation(null);
        setError('Location access is needed for accurate prayer times. Please choose a manual city in Settings.');
      }
      const hadith = getDailyHadith();
      setDailyHadith({ english: hadith.english, source: hadith.source });

      await setupNotificationChannels();
      await setupNotificationCategories();
      if (saved.notificationsEnabled) {
        await scheduleFridayReminders().catch((err) => logger.warn('Notification operation failed:', err));
        await scheduleWeeklyReminders().catch((err) => logger.warn('Notification operation failed:', err));
        await scheduleSunnahReminders().catch((err) => logger.warn('Notification operation failed:', err));
      } else {
        await cancelAllNotifications().catch((err) => logger.warn('Notification operation failed:', err));
      }

      // Register daily background fetch
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 24 * 60, // 24 hours
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch {
        // Background fetch may not be available on all devices
      }

      // Notification response handler
      notifSubRef.current = setupNotificationResponseHandler(
        (prayerId) => {
          const todayKey = getDateKey(new Date());
          markPrayer(todayKey, prayerId as PrayerId, 'prayed').then(log => {
            setPrayerStatuses({ ...(log[todayKey] || {}) });
          });
        },
        (data) => {
          logger.log('Notification tapped:', data);
        },
      );

      setLoading(false);
    };
    init();
    return () => {
      notifSubRef.current?.remove();
    };
  }, []);

  const updatePrayerTimes = useCallback(() => {
    if (!location) {
      setPrayerTimes([]);
      setNextPrayer(null);
      setTimerDisplay('');
      if (settings.notificationsEnabled) {
        lastScheduledRef.current = '';
        cancelAllNotifications().catch((err) => logger.warn('Notification operation failed:', err));
      } else {
        lastScheduledRef.current = '';
        cancelAllNotifications().catch((err) => logger.warn('Notification operation failed:', err));
      }
      return;
    }

    const times = getPrayerTimesObject(
      new Date(), location.latitude, location.longitude,
      settings.calculationMethod, settings.madhab
    );
    setPrayerTimes(times);
    const next = getNextPrayer(times, minutesFromMidnight());
    setNextPrayer(next);

    // Log any prayer whose time has passed without an entry as missed,
    // then load today's statuses (also resets them when the day rolls over).
    const todayMinutes: Partial<Record<PrayerId, number>> = {};
    times.forEach(p => { todayMinutes[p.id as PrayerId] = p.minutes; });
    const now = new Date();
    markMissedPrayers(now, todayMinutes).then(log => {
      setPrayerStatuses({ ...(log[getDateKey(now)] || {}) });
    }).catch((err) => logger.warn('Prayer log update failed:', err));

    if (settings.notificationsEnabled) {
      scheduleEnabledNotifications(settings, times, lastScheduledRef).catch((err) => logger.warn('Notification operation failed:', err));
    } else {
      lastScheduledRef.current = '';
      cancelAllNotifications().catch((err) => logger.warn('Notification operation failed:', err));
    }
  }, [settings.calculationMethod, settings.madhab, location, settings.notificationsEnabled, settings.prayerNotifications, settings.fajrAlarmEnabled, settings.fajrAlarmMinutes]);

  useEffect(() => {
    if (loading) return;
    updatePrayerTimes();
  }, [settings.calculationMethod, settings.madhab, location, loading]);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(updatePrayerTimes, 60000);
    return () => clearInterval(interval);
  }, [settings.calculationMethod, settings.madhab, location, loading]);

  // AppState listener — refresh prayer times when returning to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        updatePrayerTimes();
      }
    });
    return () => sub.remove();
  }, [settings.calculationMethod, settings.madhab, location]);

  // Timer countdown + adhan trigger
  useEffect(() => {
    if (!nextPrayer) {
      setTimerDisplay('');
      return;
    }
    if (!settings.liveCountdownEnabled) {
      setTimerDisplay('');
      return;
    }

    let prevDiff = Infinity;
    const interval = setInterval(() => {
      const now = minutesFromMidnight();
      const diff = getTimeUntilNext(nextPrayer, now);
      setTimerDisplay(diff);

      // Detect prayer time arrival — play adhan on transition from positive to 0
      if (prevDiff > 0 && diff === '0m' && settings.adhanEnabled) {
        initAudio().then(() => playAdhan(settings.adhanVariant));
      }
      prevDiff = diff === '0m' ? 0 : Infinity;
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer, settings.liveCountdownEnabled, settings.adhanEnabled, settings.adhanVariant]);

  const handleMarkPrayer = async (id: PrayerId, status: PrayerStatus | null) => {
    const todayKey = getDateKey(new Date());
    setPrayerStatuses(prev => {
      const next = { ...prev };
      if (status) next[id] = status;
      else delete next[id];
      return next;
    });
    if (status) await markPrayer(todayKey, id, status);
    else await clearPrayer(todayKey, id);
  };

  const handleTogglePrayer = (id: string) => {
    const status = prayerStatuses[id as PrayerId];
    const isDone = status === 'prayed' || status === 'qaza';
    handleMarkPrayer(id as PrayerId, isDone ? null : 'prayed');
  };

  const completedPrayers = new Set<string>(
    Object.entries(prayerStatuses)
      .filter(([, status]) => status === 'prayed' || status === 'qaza')
      .map(([id]) => id)
  );

  const handleUpdateSettings = async (partial: Partial<AppSettings>) => {
    const updated = {
      ...settings,
      ...partial,
      prayerNotifications: {
        ...settings.prayerNotifications,
        ...(partial.prayerNotifications || {}),
      },
    };
    setSettings(updated);
    await saveSettings(updated);
  };

  // Derived data
  const prayersObj: Record<string, Date> = prayerTimes.length > 0 ? {
    fajr: new Date(new Date().setHours(Math.floor(prayerTimes[0].minutes / 60), prayerTimes[0].minutes % 60, 0)),
    sunrise: new Date(new Date().setHours(Math.floor(prayerTimes[1].minutes / 60), prayerTimes[1].minutes % 60, 0)),
    dhuhr: new Date(new Date().setHours(Math.floor(prayerTimes[2].minutes / 60), prayerTimes[2].minutes % 60, 0)),
    asr: new Date(new Date().setHours(Math.floor(prayerTimes[3].minutes / 60), prayerTimes[3].minutes % 60, 0)),
    maghrib: new Date(new Date().setHours(Math.floor(prayerTimes[4].minutes / 60), prayerTimes[4].minutes % 60, 0)),
    isha: new Date(new Date().setHours(Math.floor(prayerTimes[5].minutes / 60), prayerTimes[5].minutes % 60, 0)),
  } : { fajr: new Date(), sunrise: new Date(), dhuhr: new Date(), asr: new Date(), maghrib: new Date(), isha: new Date() };

  const nextPrayerObj = nextPrayer ? {
    id: nextPrayer.id, name: nextPrayer.name, arabicName: nextPrayer.arabic,
    icon: PRAYER_ICONS[nextPrayer.id as PrayerId]?.icon || 'moon-outline',
  } : null;

  const nextPrayerTime = nextPrayer ? new Date(new Date().setHours(
    Math.floor(nextPrayer.minutes / 60), nextPrayer.minutes % 60, 0
  )) : null;

  if (nextPrayer && nextPrayerTime && nextPrayer.minutes <= minutesFromMidnight()) {
    nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
  }

  const hijriDate = HijriService.gregorianToHijri(new Date());
  const hijriDateStr = `${hijriDate.day} ${hijriDate.monthNameArabic} ${hijriDate.year} AH`;

  return (
    <PrayerAppContext.Provider value={{
      settings, prayerTimes, nextPrayer, location, loading, error,
      completedPrayers, prayerStatuses, timerDisplay, dailyHadith,
      prayersObj, nextPrayerObj, nextPrayerTime, hijriDateStr,
      handleTogglePrayer, handleMarkPrayer, handleUpdateSettings,
    }}>
      {children}
    </PrayerAppContext.Provider>
  );
}

export function usePrayerApp(): PrayerAppState {
  const ctx = useContext(PrayerAppContext);
  if (!ctx) throw new Error('usePrayerApp must be used within PrayerAppProvider');
  return ctx;
}
