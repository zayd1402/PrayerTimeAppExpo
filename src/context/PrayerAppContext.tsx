// ─── PrayerAppContext — Global state for the app ──────────────
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { getLocalDateKey } from '../utils/date';
import { logger } from '../utils/logger';
import * as NavigationBar from 'expo-navigation-bar';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { PrayerId, PrayerLogEntry, PrayerTime, AppSettings, AppLocation, DEFAULT_SETTINGS, PRAYER_ICONS } from '../types';
import {
  getPrayerTimesObject, getNextPrayer, getTimeUntilNext
} from '../services/PrayerService';
import { HijriService } from '../services/HijriService';
import {
  loadSettings, saveSettings, markPrayer, clearPrayer, markMissedPrayers, loadPrayerLog,
} from '../services/StorageService';
import { getCurrentLocation } from '../services/LocationService';
import {
  setupNotificationChannels,
  setupNotificationCategories,
  cancelPrayerNotifications,
} from '../services/NotificationService';
import {
  getAlertPlanKey,
  handleNotificationResponseOnce,
  schedulePrayerAlerts,
  syncReminderNotifications,
} from '../services/PrayerScheduler';
import { getDailyHadith } from '../data/hadiths';
import { initAudio, playAdhan, setAdhanVolume } from '../services/AudioService';

type PrayerStatus = PrayerLogEntry['status'];
type DayStatuses = Partial<Record<PrayerId, PrayerStatus>>;

function getDateKey(date: Date): string {
  return getLocalDateKey(date);
}

function minutesFromMidnight(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
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
    if (!saved.location || !saved.notificationsEnabled) return BackgroundFetch.BackgroundFetchResult.NoData;
    // Same planner as the app, so the per-prayer switches and Fajr alarm are respected.
    await schedulePrayerAlerts(saved);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Notification actions while the app is closed (Android) ──
const NOTIFICATION_RESPONSE_TASK = 'prayertime-notification-response';

TaskManager.defineTask<Notifications.NotificationTaskPayload>(NOTIFICATION_RESPONSE_TASK, async ({ data }) => {
  if (data && 'actionIdentifier' in data) {
    await handleNotificationResponseOnce(data);
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

  const refreshTodayStatuses = useCallback(async (markedDateKey?: string) => {
    const todayKey = getDateKey(new Date());
    if (markedDateKey && markedDateKey !== todayKey) return;
    const log = await loadPrayerLog();
    setPrayerStatuses({ ...(log[todayKey] || {}) });
  }, []);

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'android') {
        NavigationBar.setStyle('light');
      }
      const saved = await loadSettings();
      setSettings(saved);
      // A city the user picked by hand stays put; only device locations refresh on launch.
      const loc = saved.location?.source === 'manual-city' ? null : await getCurrentLocation();
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

      // Prayer times only need the location. Show them now, so a slow or failing
      // audio or notification setup below can never leave Today empty.
      setLoading(false);

      await setAdhanVolume(saved.adhanVolume ?? 1).catch(() => {});
      try {
        await setupNotificationChannels();
        await setupNotificationCategories();
      } catch (err) {
        logger.warn('Notification setup failed:', err);
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

      // Notification actions. Each response is applied once, whichever path sees it first.
      notifSubRef.current = Notifications.addNotificationResponseReceivedListener(response => {
        handleNotificationResponseOnce(response, refreshTodayStatuses)
          .catch((err) => logger.warn('Notification action failed:', err));
      });
      try {
        await Notifications.registerTaskAsync(NOTIFICATION_RESPONSE_TASK);
      } catch {
        // Not supported on every platform; the launch check below covers the rest.
      }
      // An action tapped while the app was closed is delivered on the next launch.
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        if (last) await handleNotificationResponseOnce(last, refreshTodayStatuses);
      } catch (err) {
        logger.warn('Notification action failed:', err);
      }
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
      lastScheduledRef.current = '';
      cancelPrayerNotifications().catch((err) => logger.warn('Notification operation failed:', err));
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

    // Re-plan the queued alerts when settings change or a new day starts.
    const planSettings = { ...settings, location };
    const planKey = getAlertPlanKey(planSettings, now);
    if (planKey !== lastScheduledRef.current) {
      lastScheduledRef.current = planKey;
      const job = settings.notificationsEnabled
        ? schedulePrayerAlerts(planSettings, now)
        : cancelPrayerNotifications();
      job.catch((err) => {
        lastScheduledRef.current = '';
        logger.warn('Notification operation failed:', err);
      });
    }
  }, [settings, location]);

  useEffect(() => {
    if (loading) return;
    updatePrayerTimes();
  }, [updatePrayerTimes, loading]);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(updatePrayerTimes, 60000);
    return () => clearInterval(interval);
  }, [updatePrayerTimes, loading]);

  // Fixed reminders follow the master notifications switch.
  useEffect(() => {
    if (loading) return;
    syncReminderNotifications(settings.notificationsEnabled)
      .catch((err) => logger.warn('Notification operation failed:', err));
  }, [settings.notificationsEnabled, loading]);

  // AppState listener — refresh prayer times when returning to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        updatePrayerTimes();
      }
    });
    return () => sub.remove();
  }, [updatePrayerTimes]);

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
    // A city picked in Settings must move the prayer times straight away, not on the next launch.
    if (partial.location) setLocation(partial.location);
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
