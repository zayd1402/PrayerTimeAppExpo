// ─── PrayerAppContext — Global state for the app ──────────────
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { C, PrayerId, PrayerTime, AppSettings, DEFAULT_SETTINGS, PRAYER_ICONS } from '../types';
import {
  getPrayerTimesObject, getNextPrayer
} from '../services/PrayerService';
import { HijriService } from '../services/HijriService';
import {
  loadSettings, saveSettings, markPrayer, loadPrayerLog, mmkv
} from '../services/StorageService';
import { getCurrentLocation, DEFAULT_LOCATION } from '../services/LocationService';
import {
  schedulePrayerNotification,
  setupNotificationChannels,
  setupNotificationCategories,
  scheduleFridayReminders,
  scheduleWeeklyReminders,
  setupNotificationResponseHandler,
} from '../services/NotificationService';
import { getDailyHadith } from '../data/hadiths';
import { initAudio, playAdhan } from '../services/AudioService';

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function minutesFromMidnight(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatCountdown(diffMinutes: number): string {
  if (diffMinutes <= 0) return '0:00';
  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function getHourMinute(minutes: number): { hour: number; minute: number } {
  return {
    hour: Math.floor((minutes % 1440) / 60),
    minute: minutes % 60,
  };
}

export interface PrayerAppState {
  settings: AppSettings;
  prayerTimes: PrayerTime[];
  nextPrayer: PrayerTime | null;
  location: { latitude: number; longitude: number; name: string };
  loading: boolean;
  completedPrayers: Set<string>;
  timerDisplay: string;
  dailyHadith: { english: string; source: string } | null;
  prayersObj: Record<string, Date>;
  nextPrayerObj: { id: string; name: string; arabicName: string; icon: string } | null;
  nextPrayerTime: Date | null;
  hijriDateStr: string;
  handleTogglePrayer: (id: string) => void;
  handleUpdateSettings: (partial: Partial<AppSettings>) => void;
}

const PrayerAppContext = createContext<PrayerAppState | null>(null);

export function PrayerAppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);
  const [completedPrayers, setCompletedPrayers] = useState<Set<string>>(new Set());
  const [timerDisplay, setTimerDisplay] = useState('');
  const [dailyHadith, setDailyHadith] = useState<{ english: string; source: string } | null>(null);
  const lastScheduledRef = useRef<string>('');
  const notifSubRef = useRef<{ remove: () => void } | null>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync(C.bgBase);
        await NavigationBar.setButtonStyleAsync('dark');
      }
      const saved = await loadSettings();
      setSettings(saved);
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
        const newSettings = { ...saved, location: loc };
        setSettings(newSettings);
        await saveSettings(newSettings);
      } else if (saved.location) {
        setLocation(saved.location);
      }
      const hadith = getDailyHadith();
      setDailyHadith({ english: hadith.english, source: hadith.source });

      // Setup notifications
      await setupNotificationChannels();
      await setupNotificationCategories();
      await scheduleFridayReminders().catch(() => {});
      await scheduleWeeklyReminders().catch(() => {});

      // Notification response handler
      notifSubRef.current = setupNotificationResponseHandler(
        (prayerId) => {
          const todayKey = getDateKey(new Date());
          markPrayer(todayKey, prayerId as PrayerId, 'prayed');
          const todayLog = mmkv.getString('@prayertime:prayer_log');
          if (todayLog) {
            const log = JSON.parse(todayLog);
            const todayData = log[todayKey];
            if (todayData) {
              const completed = new Set<string>();
              Object.entries(todayData).forEach(([id, status]) => {
                if (status === 'prayed') completed.add(id);
              });
              setCompletedPrayers(completed);
            }
          }
        },
        (data) => {
          console.log('Notification tapped:', data);
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
    const times = getPrayerTimesObject(
      new Date(), location.latitude, location.longitude,
      settings.calculationMethod, settings.madhab
    );
    setPrayerTimes(times);
    const next = getNextPrayer(times, minutesFromMidnight());
    setNextPrayer(next);

    loadPrayerLog().then(log => {
      const todayKey = getDateKey(new Date());
      const todayLog = log[todayKey];
      if (todayLog) {
        const completed = new Set<string>();
        Object.entries(todayLog).forEach(([id, status]) => {
          if (status === 'prayed') completed.add(id);
        });
        setCompletedPrayers(completed);
      }
    });

    if (settings.notificationsEnabled) {
      const scheduleKey = times.map(p => `${p.id}:${p.minutes}`).join('|');
      if (scheduleKey !== lastScheduledRef.current) {
        lastScheduledRef.current = scheduleKey;
        times.forEach(p => {
          if (p.id === 'sunrise') return;
          const { hour, minute } = getHourMinute(p.minutes);
          schedulePrayerNotification(p.id, p.name, hour, minute, false);
        });
      }
    }
  }, [settings.calculationMethod, settings.madhab, location, loading, settings.notificationsEnabled]);

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
    if (!nextPrayer) return;
    let prevDiff = Infinity;
    const interval = setInterval(() => {
      const now = minutesFromMidnight();
      const diff = Math.max(0, nextPrayer.minutes - now);
      setTimerDisplay(formatCountdown(diff));

      // Detect prayer time arrival — play adhan on transition from positive to 0
      if (prevDiff > 0 && diff === 0 && settings.adhanEnabled) {
        initAudio().then(() => playAdhan(settings.adhanVariant));
      }
      prevDiff = diff;
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer, settings.adhanEnabled, settings.adhanVariant]);

  const handleMarkPrayer = async (id: PrayerId, status: 'prayed' | 'qaza') => {
    const todayKey = getDateKey(new Date());
    await markPrayer(todayKey, id, status);
    setCompletedPrayers(prev => {
      const next = new Set(prev);
      if (status === 'prayed') next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleTogglePrayer = (id: string) => {
    const isCompleted = completedPrayers.has(id);
    handleMarkPrayer(id as PrayerId, isCompleted ? 'qaza' : 'prayed');
  };

  const handleUpdateSettings = async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await saveSettings(updated);
  };

  // Derived data
  const prayersObj = prayerTimes.length > 0 ? {
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

  const hijriDate = HijriService.gregorianToHijri(new Date());
  const hijriDateStr = `${hijriDate.day} ${hijriDate.monthNameArabic} ${hijriDate.year} AH`;

  return (
    <PrayerAppContext.Provider value={{
      settings, prayerTimes, nextPrayer, location, loading,
      completedPrayers, timerDisplay, dailyHadith,
      prayersObj, nextPrayerObj, nextPrayerTime, hijriDateStr,
      handleTogglePrayer, handleUpdateSettings,
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
