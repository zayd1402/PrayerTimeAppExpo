import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, StatusBar, Alert, StyleSheet, Platform, useColorScheme as useRNColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { Ionicons } from '@expo/vector-icons';

// ─── Theme & Components ──────────────────────────────────────
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { SnackbarProvider } from './src/components/Snackbar';
import { BottomNav } from './src/components/BottomNav';
import { NavRail } from './src/components/NavRail';
import { AppDrawer } from './src/components/AppDrawer';
import { TabPager } from './src/components/TabPager';
import { AppBar } from './src/components/AppBar';
import { Button } from './src/components/Button';
import { Screen } from './src/components/Screen';
import { useBreakpoint } from './src/hooks/useBreakpoint';

// ─── Types & Config ──────────────────────────────────────────
import {
  C, PrayerId, PrayerTime, AppSettings, DEFAULT_SETTINGS,
  PRAYER_ICONS, TabId, DrawerItemId,
} from './src/types';
import {
  calculatePrayerTimes, getPrayerTimesObject, getNextPrayer, getTimeUntilNext,
  minutesToTimeString, calculateQiblaDirection, bearingToCompassDirection,
} from './src/services/PrayerService';
import { HijriService } from './src/services/HijriService';
import {
  loadSettings, saveSettings, markPrayer, loadPrayerLog,
} from './src/services/StorageService';
import { getCurrentLocation, DEFAULT_LOCATION } from './src/services/LocationService';
import { schedulePrayerNotification, hasNotificationPermission } from './src/services/NotificationService';
import { getDailyHadith } from './src/data/hadiths';

// ─── Screens ─────────────────────────────────────────────────
import TodayScreen from './src/screens/TodayScreen';
import WorshipScreen from './src/screens/WorshipScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import DuaLibraryScreen from './src/screens/DuaLibraryScreen';
import HadithScreen from './src/screens/HadithScreen';
import FridayScreen from './src/screens/FridayScreen';
import WeeklyScreen from './src/screens/WeeklyScreen';
import QiblaScreen from './src/screens/QiblaScreen';
import ZakatScreen from './src/screens/ZakatScreen';
import JournalScreen from './src/screens/JournalScreen';
import MosquesScreen from './src/screens/MosquesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { Onboarding } from './src/screens/OnboardingScreen';

// ─── Utility ─────────────────────────────────────────────────
function getDateKey(date: Date): string { return date.toISOString().split('T')[0]; }
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

// ─── Drawer screen titles ────────────────────────────────────
const DRAWER_TITLES: Record<DrawerItemId, { title: string; subtitle?: string; variant: 'large' | 'small' }> = {
  hadith:    { title: 'Hadith',         subtitle: '30 authentic hadiths',         variant: 'large' },
  friday:    { title: 'Friday',         subtitle: 'Surah Al-Kahf & khutbah notes', variant: 'large' },
  weekly:    { title: 'Weekly',         subtitle: 'Sunnah revival tracker',       variant: 'large' },
  zakat:     { title: 'Zakat',          subtitle: 'Calculator & charity log',     variant: 'large' },
  journal:   { title: 'Prayer Journal', subtitle: 'Reflect on your prayers',      variant: 'large' },
  mosques:   { title: 'Nearby Mosques',                                    variant: 'large' },
  settings:  { title: 'Settings',                                          variant: 'large' },
};

// ─── Main App (with all providers) ───────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemedApp />
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const systemScheme = useRNColorScheme();
  // We re-read this every render; the actual user preference comes from
  // settings (which we load async). Until then, follow the system.
  const [overrideScheme, setOverrideScheme] = useState<'light' | 'dark' | undefined>(undefined);

  return (
    <ThemeProvider scheme={overrideScheme}>
      <SnackbarProvider>
        <Shell onThemeChange={setOverrideScheme} />
      </SnackbarProvider>
    </ThemeProvider>
  );
}

function Shell({ onThemeChange }: { onThemeChange: (s: 'light' | 'dark') => void }) {
  const { c, scheme } = useTheme();
  const { isTablet } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [drawerScreen, setDrawerScreen] = useState<DrawerItemId | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);
  const [completedPrayers, setCompletedPrayers] = useState<Set<string>>(new Set());
  const [timerDisplay, setTimerDisplay] = useState('');
  const [dailyHadith, setDailyHadith] = useState<{ english: string; source: string } | null>(null);
  const lastScheduledRef = useRef<string>('');
  const themeAppliedRef = useRef(false);

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'android') {
        NavigationBar.NavigationBar.setStyle(scheme === 'dark' ? 'light' : 'dark');
      }

      const saved = await loadSettings();
      setSettings(saved);

      // Apply user theme preference
      if (saved.themePreference === 'dark') onThemeChange('dark');
      else if (saved.themePreference === 'light') onThemeChange('light');
      else onThemeChange('light');
      themeAppliedRef.current = true;

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

      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update prayer times
  useEffect(() => {
    if (loading) return;
    updatePrayerTimes();
  }, [settings.calculationMethod, settings.madhab, location, loading]);

  // Tick every minute
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(updatePrayerTimes, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.calculationMethod, settings.madhab, location, loading]);

  // Timer countdown
  useEffect(() => {
    if (!nextPrayer) return;
    const interval = setInterval(() => {
      const now = minutesFromMidnight();
      const diff = Math.max(0, nextPrayer.minutes - now);
      setTimerDisplay(formatCountdown(diff));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer]);

  const updatePrayerTimes = useCallback(() => {
    const times = getPrayerTimesObject(
      new Date(),
      location.latitude,
      location.longitude,
      settings.calculationMethod,
      settings.madhab,
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
    if (partial.themePreference === 'dark') onThemeChange('dark');
    else if (partial.themePreference === 'light') onThemeChange('light');
  };

  // Build prayer times object for TodayScreen
  const prayerTimesObj = prayerTimes.length > 0 ? {
    fajr:    new Date(new Date().setHours(Math.floor(prayerTimes[0].minutes / 60), prayerTimes[0].minutes % 60, 0)),
    sunrise: new Date(new Date().setHours(Math.floor(prayerTimes[1].minutes / 60), prayerTimes[1].minutes % 60, 0)),
    dhuhr:   new Date(new Date().setHours(Math.floor(prayerTimes[2].minutes / 60), prayerTimes[2].minutes % 60, 0)),
    asr:     new Date(new Date().setHours(Math.floor(prayerTimes[3].minutes / 60), prayerTimes[3].minutes % 60, 0)),
    maghrib: new Date(new Date().setHours(Math.floor(prayerTimes[4].minutes / 60), prayerTimes[4].minutes % 60, 0)),
    isha:    new Date(new Date().setHours(Math.floor(prayerTimes[5].minutes / 60), prayerTimes[5].minutes % 60, 0)),
  } : {
    fajr: new Date(), sunrise: new Date(), dhuhr: new Date(),
    asr: new Date(), maghrib: new Date(), isha: new Date(),
  };

  const nextPrayerObj = nextPrayer ? {
    id: nextPrayer.id,
    name: nextPrayer.name,
    arabicName: nextPrayer.arabic,
    icon: PRAYER_ICONS[nextPrayer.id as PrayerId]?.icon || 'moon-outline',
  } : null;

  const nextPrayerTime = nextPrayer ? new Date(new Date().setHours(
    Math.floor(nextPrayer.minutes / 60),
    nextPrayer.minutes % 60, 0
  )) : null;

  const hijriDate = HijriService.gregorianToHijri(new Date());
  const hijriDateStr = `${hijriDate.day} ${hijriDate.monthNameArabic} ${hijriDate.year} AH`;

  // ─── Render a tab screen ───────────────────────────────────
  const renderTabScreen = (tab: TabId) => {
    if (loading) return null;
    switch (tab) {
      case 'home':
        return (
          <TodayScreen
            prayerTimes={prayerTimesObj}
            nextPrayer={nextPrayerObj}
            nextPrayerTime={nextPrayerTime}
            completedPrayers={completedPrayers}
            locationName={location.name}
            hijriDate={hijriDateStr}
            timerDisplay={timerDisplay}
            togglePrayer={handleTogglePrayer}
            dailyHadith={dailyHadith}
          />
        );
      case 'worship':  return <WorshipScreen />;
      case 'calendar': return <CalendarScreen />;
      case 'duas':     return <DuaLibraryScreen />;
      case 'qibla':
        return <QiblaScreen coordinate={{ latitude: location.latitude, longitude: location.longitude }} />;
      default: return null;
    }
  };

  // ─── Render a drawer screen ───────────────────────────────
  const renderDrawerScreen = () => {
    if (!drawerScreen) return null;
    const meta = DRAWER_TITLES[drawerScreen];

    const content = (() => {
      switch (drawerScreen) {
        case 'hadith':  return <HadithScreen />;
        case 'friday':  return <FridayScreen />;
        case 'weekly':  return <WeeklyScreen />;
        case 'zakat':   return <ZakatScreen />;
        case 'journal': return <JournalScreen />;
        case 'mosques': return <MosquesScreen coordinate={{ latitude: location.latitude, longitude: location.longitude }} />;
        case 'settings':
          return (
            <SettingsScreen
              settings={{
                method: settings.calculationMethod,
                madhhab: settings.madhab,
                coordinate: { latitude: location.latitude, longitude: location.longitude },
                locationName: location.name,
              }}
              updateSettings={(u) => {
                if (u.method) handleUpdateSettings({ calculationMethod: u.method });
                if (u.madhhab) handleUpdateSettings({ madhab: u.madhhab });
              }}
            />
          );
        default: return null;
      }
    })();

    if (isTablet) {
      // Tablet: drawer screen is a separate full-height pane
      return (
        <View style={{ flex: 1, backgroundColor: c.bgBase }}>
          <AppBar
            title={meta.title}
            subtitle={meta.subtitle}
            variant="large"
            onBack={() => setDrawerScreen(null)}
            backLabel="Back to main"
          />
          {content}
        </View>
      );
    }

    return (
      <Screen
        title={meta.title}
        subtitle={meta.subtitle}
        variant={meta.variant}
        onBack={() => setDrawerScreen(null)}
        backLabel="Back"
      >
        {content}
      </Screen>
    );
  };

  // ─── Onboarding gate ──────────────────────────────────────
  if (loading) {
    return <View style={[styles.loading, { backgroundColor: c.bgBase }]} />;
  }

  if (!settings.onboardingComplete) {
    return (
      <Onboarding
        onComplete={async (updates) => {
          await handleUpdateSettings({ ...updates, onboardingComplete: true });
        }}
      />
    );
  }

  // ─── Main shell ───────────────────────────────────────────
  if (drawerScreen && isTablet) {
    // Tablet: 2-pane (rail + drawer screen)
    return (
      <View style={[styles.root, { backgroundColor: c.bgBase }]}>
        <NavRail
          active={activeTab}
          onChangeTab={(id) => { setActiveTab(id); setDrawerScreen(null); }}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <View style={{ flex: 1 }}>{renderDrawerScreen()}</View>
        <AppDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSelect={(id) => { setDrawerScreen(id); setDrawerOpen(false); setActiveTab('home'); }}
        />
      </View>
    );
  }

  if (drawerScreen) {
    return (
      <View style={[styles.root, { backgroundColor: c.bgBase }]}>
        {renderDrawerScreen()}
        <AppDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSelect={(id) => { setDrawerScreen(id); setDrawerOpen(false); }}
        />
      </View>
    );
  }

  // Normal: tabs + bottom nav (or rail on tablet)
  return (
    <View style={[styles.root, { backgroundColor: c.bgBase }]}>
      {isTablet ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <NavRail
            active={activeTab}
            onChangeTab={setActiveTab}
            onOpenDrawer={() => setDrawerOpen(true)}
          />
          <View style={{ flex: 1 }}>
            <TabPager active={TAB_INDEX[activeTab]} onIndexChange={(i) => setActiveTab(INDEX_TAB[i])}>
              {(['home', 'worship', 'calendar', 'duas', 'qibla'] as TabId[]).map(t => (
                <View key={t} style={{ flex: 1 }}>{renderTabScreen(t)}</View>
              ))}
            </TabPager>
          </View>
        </View>
      ) : (
        <>
          <View style={{ flex: 1 }}>
            <TabPager active={TAB_INDEX[activeTab]} onIndexChange={(i) => setActiveTab(INDEX_TAB[i])}>
              {(['home', 'worship', 'calendar', 'duas', 'qibla'] as TabId[]).map(t => (
                <View key={t} style={{ flex: 1 }}>{renderTabScreen(t)}</View>
              ))}
            </TabPager>
          </View>
          <BottomNav
            active={activeTab}
            onChange={setActiveTab}
            onOpenDrawer={() => setDrawerOpen(true)}
          />
        </>
      )}
      <AppDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={(id) => { setDrawerScreen(id); setDrawerOpen(false); }}
      />
    </View>
  );
}

const TAB_INDEX: Record<TabId, number> = { home: 0, worship: 1, calendar: 2, duas: 3, qibla: 4 };
const INDEX_TAB: TabId[] = ['home', 'worship', 'calendar', 'duas', 'qibla'];

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
