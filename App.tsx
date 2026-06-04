import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, StatusBar, Alert, RefreshControl, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';

// ─── Types & Config ──────────────────────────────────────────
import { C, PrayerId, PrayerTime, AppSettings, DEFAULT_SETTINGS, PRAYER_ICONS } from './src/types';
import {
  calculatePrayerTimes, getPrayerTimesObject, getNextPrayer, getTimeUntilNext,
  minutesToTimeString, calculateQiblaDirection, bearingToCompassDirection
} from './src/services/PrayerService';
import { gregorianToHijri, HijriService } from './src/services/HijriService';
import {
  loadSettings, saveSettings, markPrayer, loadPrayerLog,
  getStreak, getTotalPrayers, getOnTimeRate, getHeatmapData
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

// ─── Utility ─────────────────────────────────────────────────
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

// ─── Navigation Tabs ─────────────────────────────────────────
const NAV_TABS = [
  { id: 'home',      label: 'Home',      icon: 'home-outline',      iconActive: 'home' },
  { id: 'worship',   label: 'Worship',   icon: 'heart-outline',     iconActive: 'heart' },
  { id: 'calendar',  label: 'Calendar',  icon: 'calendar-outline',  iconActive: 'calendar' },
  { id: 'duas',      label: 'Duas',      icon: 'book-outline',      iconActive: 'book' },
  { id: 'more',      label: 'More',      icon: 'grid-outline',      iconActive: 'grid' },
] as const;

type TabId = typeof NAV_TABS[number]['id'];

const MORE_MENU = [
  { id: 'hadith', label: 'Hadith', icon: 'document-text-outline', color: C.gold },
  { id: 'friday', label: 'Friday', icon: 'star-outline', color: C.purple },
  { id: 'weekly', label: 'Weekly', icon: 'calendar-clear-outline', color: C.teal },
  { id: 'qibla', label: 'Qibla', icon: 'compass-outline', color: C.emerald },
  { id: 'zakat', label: 'Zakat', icon: 'wallet-outline', color: C.green },
  { id: 'journal', label: 'Journal', icon: 'create-outline', color: C.blue },
  { id: 'mosques', label: 'Mosques', icon: 'location-outline', color: C.teal },
  { id: 'settings', label: 'Settings', icon: 'settings-outline', color: C.textSecondary },
];

// ─── Main App ────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [moreScreen, setMoreScreen] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);
  const [completedPrayers, setCompletedPrayers] = useState<Set<string>>(new Set());
  const [timerDisplay, setTimerDisplay] = useState('');
  const [dailyHadith, setDailyHadith] = useState<{ english: string; source: string } | null>(null);
  const lastScheduledRef = useRef<string>(''); // Guard against redundant notification scheduling

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

      // Load daily hadith
      const hadith = getDailyHadith();
      setDailyHadith({ english: hadith.english, source: hadith.source });

      setLoading(false);
    };
    init();
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
      settings.madhab
    );
    setPrayerTimes(times);
    const next = getNextPrayer(times, minutesFromMidnight());
    setNextPrayer(next);

    // Load completed prayers
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

    // Schedule notifications — only when times actually change
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
    handleMarkPrayer(id as PrayerId, isCompleted ? 'missed' : 'prayed');
  };

  const handleUpdateSettings = async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await saveSettings(updated);
  };

  // Build prayer times object for TodayScreen
  const prayerTimesObj = prayerTimes.length > 0 ? {
    fajr: new Date(new Date().setHours(Math.floor(prayerTimes[0].minutes / 60), prayerTimes[0].minutes % 60, 0)),
    sunrise: new Date(new Date().setHours(Math.floor(prayerTimes[1].minutes / 60), prayerTimes[1].minutes % 60, 0)),
    dhuhr: new Date(new Date().setHours(Math.floor(prayerTimes[2].minutes / 60), prayerTimes[2].minutes % 60, 0)),
    asr: new Date(new Date().setHours(Math.floor(prayerTimes[3].minutes / 60), prayerTimes[3].minutes % 60, 0)),
    maghrib: new Date(new Date().setHours(Math.floor(prayerTimes[4].minutes / 60), prayerTimes[4].minutes % 60, 0)),
    isha: new Date(new Date().setHours(Math.floor(prayerTimes[5].minutes / 60), prayerTimes[5].minutes % 60, 0)),
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

  // ─── Render Screen ─────────────────────────────────────────
  const renderScreen = () => {
    if (moreScreen) {
      switch (moreScreen) {
        case 'hadith': return <HadithScreen />;
        case 'friday': return <FridayScreen />;
        case 'weekly': return <WeeklyScreen />;
        case 'qibla': return <QiblaScreen coordinate={{ latitude: location.latitude, longitude: location.longitude }} />;
        case 'zakat': return <ZakatScreen />;
        case 'journal': return <JournalScreen />;
        case 'mosques': return <MosquesScreen coordinate={{ latitude: location.latitude, longitude: location.longitude }} />;
        case 'settings': return <SettingsScreen settings={{
          method: settings.calculationMethod,
          madhhab: settings.madhab === 'hanafi' ? 'hanafi' : 'shafi',
          coordinate: { latitude: location.latitude, longitude: location.longitude },
          locationName: location.name,
        }} updateSettings={(u) => {
          if (u.method) handleUpdateSettings({ calculationMethod: u.method });
          if (u.madhhab) handleUpdateSettings({ madhab: u.madhhab });
        }} />;
        default: return null;
      }
    }

    switch (activeTab) {
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
      case 'worship':
        return <WorshipScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'duas':
        return <DuaLibraryScreen />;
      case 'more':
        return (
          <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
            <View style={styles.moreHeader}>
              <Text style={styles.moreTitle}>More</Text>
            </View>
            <View style={styles.moreGrid}>
              {MORE_MENU.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.moreCard}
                  onPress={() => setMoreScreen(item.id)}
                >
                  <View style={[styles.moreIconWrap, { backgroundColor: item.color + '12' }]}>
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <Text style={styles.moreLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bgBase} />

      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation */}
      {!moreScreen && (
        <View style={styles.navBar}>
          {NAV_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.navItem}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={(isActive ? tab.iconActive : tab.icon) as any}
                  size={22}
                  color={isActive ? C.emerald : C.textMuted}
                />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.navIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* More Screen Back Button */}
      {moreScreen && (
        <TouchableOpacity style={styles.backButton} onPress={() => setMoreScreen(null)}>
          <Ionicons name="arrow-back" size={20} color="#FFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  screenContainer: { flex: 1 },
  screen: { flex: 1, backgroundColor: C.bgBase },
  screenPadding: { paddingBottom: 100 },

  // More screen
  moreHeader: { padding: 18, paddingTop: 60, backgroundColor: C.heroBg },
  moreTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  moreGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 10 },
  moreCard: {
    width: '30%',
    backgroundColor: C.bgSurface,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  moreIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  moreLabel: { fontSize: 12, fontWeight: '600', color: C.textPrimary, textAlign: 'center' },

  // Navigation
  navBar: {
    flexDirection: 'row',
    backgroundColor: C.bgSurface,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 6, position: 'relative' },
  navLabel: { fontSize: 10, color: C.textMuted, marginTop: 3, fontWeight: '500' },
  navLabelActive: { color: C.emerald, fontWeight: '700' },
  navIndicator: { position: 'absolute', top: -8, width: 4, height: 4, borderRadius: 2, backgroundColor: C.emerald },

  // Back button
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
