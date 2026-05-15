import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';

// ─── Types & Config ──────────────────────────────────────────
import { C, NAV_TABS, PrayerId, PrayerTime, AppSettings, DEFAULT_SETTINGS } from './src/types';
import {
  getPrayerTimesObject, getNextPrayer, getCurrentMinutesForCoordinates
} from './src/services/PrayerService';
import {
  loadSettings, saveSettings, markPrayer, clearAllData
} from './src/services/StorageService';
import { getCurrentLocation, DEFAULT_LOCATION } from './src/services/LocationService';
import {
  schedulePrayerNotification, scheduleFajrAlarm, cancelAllPrayerNotifications
} from './src/services/NotificationService';
import { HomeScreen } from './src/screens/HomeScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { QiblaScreen } from './src/screens/QiblaScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { getDateKey, getHourMinute } from './src/utils/date';

// ─── Main App ────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [currentMinutes, setCurrentMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prayerLogVersion, setPrayerLogVersion] = useState(0);
  const notificationScheduleKey = useRef<string | null>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      // Set Android nav bar
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync(C.bgBase);
        await NavigationBar.setButtonStyleAsync('dark');
      }

      // Load settings
      const saved = await loadSettings();
      setSettings(saved);

      // Get location
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
        const newSettings = { ...saved, location: loc };
        setSettings(newSettings);
        await saveSettings(newSettings);
      } else if (saved.location) {
        setLocation(saved.location);
      }

      setLoading(false);
    };
    init();
  }, []);

  const updatePrayerTimes = useCallback(() => {
    const times = getPrayerTimesObject(
      new Date(),
      location.latitude,
      location.longitude,
      settings.calculationMethod,
      settings.madhab
    );
    setPrayerTimes(times);
    const locationMinutes = getCurrentMinutesForCoordinates(location.latitude, location.longitude);
    setCurrentMinutes(locationMinutes);
    const next = getNextPrayer(times, locationMinutes);
    setNextPrayer(next);

    // Schedule notifications if enabled
    if (settings.notificationsEnabled) {
      const scheduleKey = times
        .filter(p => p.id !== 'sunrise')
        .map(p => `${p.id}:${p.minutes}`)
        .join('|') + `|fajrAlarm:${settings.fajrAlarmEnabled}:${settings.fajrAlarmMinutes}`;

      if (notificationScheduleKey.current === scheduleKey) return;
      notificationScheduleKey.current = scheduleKey;

      times.forEach(p => {
        if (p.id === 'sunrise') return;
        const scheduledMinutes = p.id === 'fajr' && settings.fajrAlarmEnabled
          ? p.minutes - settings.fajrAlarmMinutes
          : p.minutes;
        const { hour, minute } = getHourMinute(scheduledMinutes);
        if (p.id === 'fajr' && settings.fajrAlarmEnabled) {
          scheduleFajrAlarm(hour, minute);
        } else {
          schedulePrayerNotification(p.id, p.name, hour, minute, false);
        }
      });
    } else if (notificationScheduleKey.current) {
      notificationScheduleKey.current = null;
      cancelAllPrayerNotifications();
    }
  }, [settings, location]);

  // Update prayer times when settings or location changes
  useEffect(() => {
    if (loading) return;
    updatePrayerTimes();
  }, [loading, updatePrayerTimes]);

  // Tick every minute
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(updatePrayerTimes, 60000);
    return () => clearInterval(interval);
  }, [loading, updatePrayerTimes]);

  const handleMarkPrayer = useCallback(async (prayerId: PrayerId, status: 'prayed' | 'qaza') => {
    const todayKey = getDateKey(new Date());
    await markPrayer(todayKey, prayerId, status);
    setPrayerLogVersion(version => version + 1);
  }, []);

  const handleSettingsUpdate = useCallback(async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await saveSettings(updated);
  }, [settings]);

  const handleResetData = useCallback(() => {
    Alert.alert(
      'Reset Local Data',
      'This clears saved settings and prayer tracking from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await cancelAllPrayerNotifications();
            const resetTimes = getPrayerTimesObject(
              new Date(),
              DEFAULT_LOCATION.latitude,
              DEFAULT_LOCATION.longitude,
              DEFAULT_SETTINGS.calculationMethod,
              DEFAULT_SETTINGS.madhab
            );
            const resetMinutes = getCurrentMinutesForCoordinates(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
            setSettings(DEFAULT_SETTINGS);
            setLocation(DEFAULT_LOCATION);
            setPrayerTimes(resetTimes);
            setCurrentMinutes(resetMinutes);
            setNextPrayer(getNextPrayer(resetTimes, resetMinutes));
            setPrayerLogVersion(version => version + 1);
            notificationScheduleKey.current = null;
          },
        },
      ]
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bgBase} />
        <View style={{ height: 47 }} />
        <View style={[styles.screen, styles.centered]}>
          <Ionicons name="moon-outline" size={48} color={C.gold} />
          <Text style={styles.loadingText}>Nur Minimal</Text>
          <Text style={styles.loadingSubText}>Loading...</Text>
        </View>
        <View style={styles.tabBar} />
      </View>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':      return <HomeScreen prayerTimes={prayerTimes} nextPrayer={nextPrayer} settings={settings} location={location} prayerLogVersion={prayerLogVersion} currentMinutes={currentMinutes} onMarkPrayer={handleMarkPrayer} />;
      case 'calendar':  return <CalendarScreen settings={settings} location={location} />;
      case 'qibla':     return <QiblaScreen location={location} />;
      case 'settings':  return <SettingsScreen settings={settings} onUpdate={handleSettingsUpdate} onResetData={handleResetData} />;
      default:          return <HomeScreen prayerTimes={prayerTimes} nextPrayer={nextPrayer} settings={settings} location={location} prayerLogVersion={prayerLogVersion} currentMinutes={currentMinutes} onMarkPrayer={handleMarkPrayer} />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bgBase} />
      <View style={{ height: 47, backgroundColor: C.bgBase }} />
      <View style={styles.screenWrapper}>{renderScreen()}</View>
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          {NAV_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.72}
              >
                <Ionicons
                  name={(isActive ? tab.iconActive : tab.icon) as any}
                  size={21}
                  color={isActive ? C.navy : C.textMuted}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgBase },
  screenWrapper: { flex: 1 },
  screen: { flex: 1, backgroundColor: C.bgBase },
  centered: { alignItems: 'center', justifyContent: 'center' },

  // Loading
  loadingText: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 24, fontWeight: '600', color: C.navy, marginTop: 16 },
  loadingSubText: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 14, color: C.textMuted, marginTop: 4 },

  // Tab Bar
  tabBarWrap: { backgroundColor: C.bgBase, paddingHorizontal: 16, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 18 : 12 },
  tabBar: { flexDirection: 'row', minHeight: 64, backgroundColor: 'rgba(255,253,249,0.94)', borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 6, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 18 }, android: { elevation: 8 } }) },
  tabItem: { flex: 1, minHeight: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabItemActive: { backgroundColor: C.goldPale },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted },
  tabLabelActive: { color: C.navy },
});
