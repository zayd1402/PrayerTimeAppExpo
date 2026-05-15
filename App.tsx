import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as NavigationBar from 'expo-navigation-bar';

import TodayScreen from './src/screens/TodayScreen';
import MosquesScreen from './src/screens/MosquesScreen';
import QiblaScreen from './src/screens/QiblaScreen';
import WorshipScreen from './src/screens/WorshipScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Prayer calculation methods
type CalculationMethod = 
  | 'muslimWorldLeague' | 'egyptian' | 'karachi' 
  | 'ummAlQura' | 'dubai' | 'qatar' | 'kuwait'
  | 'moonsightingCommittee' | 'singapore' | 'tehran'
  | 'northAmerica' | 'custom';

type Madhhab = 'shafi' | 'hanafi';

interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Settings {
  method: CalculationMethod;
  madhhab: Madhhab;
  coordinate: Coordinate;
  locationName: string;
}

interface Prayer {
  id: string;
  name: string;
  arabicName: string;
  icon: string;
}

const PRAYERS: Prayer[] = [
  { id: 'fajr', name: 'Fajr', arabicName: 'الفجر', icon: '🌅' },
  { id: 'sunrise', name: 'Sunrise', arabicName: 'الشروق', icon: '☀️' },
  { id: 'dhuhr', name: 'Dhuhr', arabicName: 'الظهر', icon: '🕌' },
  { id: 'asr', name: 'Asr', arabicName: 'العصر', icon: '🌤️' },
  { id: 'maghrib', name: 'Maghrib', arabicName: 'المغرب', icon: '🌅' },
  { id: 'isha', name: 'Isha', arabicName: 'العشاء', icon: '🌙' },
];

const METHOD_PARAMS: Record<string, { fajr: number; isha: number; ishaInterval?: number; maghribAngle?: number }> = {
  muslimWorldLeague: { fajr: 18, isha: 17 },
  egyptian: { fajr: 19.5, isha: 17.5 },
  karachi: { fajr: 18, isha: 18 },
  ummAlQura: { fajr: 18.5, isha: 90 }, // 90 = ishaInterval
  dubai: { fajr: 18.2, isha: 18.2 },
  qatar: { fajr: 18, isha: 90 },
  kuwait: { fajr: 18, isha: 17.5 },
  moonsightingCommittee: { fajr: 18, isha: 18 },
  singapore: { fajr: 18, isha: 18 },
  tehran: { fajr: 17.7, isha: 14 },
  northAmerica: { fajr: 15, isha: 15 },
  custom: { fajr: 18, isha: 18 },
};

const DEFAULT_SETTINGS: Settings = {
  method: 'muslimWorldLeague',
  madhhab: 'shafi',
  coordinate: { latitude: -33.8688, longitude: 151.2093 }, // Sydney default
  locationName: 'Sydney',
};

function calculatePrayerTimes(date: Date, settings: Settings): PrayerTimes {
  const { latitude, longitude } = settings.coordinate;
  const params = METHOD_PARAMS[settings.method] || METHOD_PARAMS.muslimWorldLeague;
  
  // Simplified prayer time calculation using Adhan algorithm
  const times = computeAdhanTimes(date, latitude, longitude, params, settings.madhhab);
  return times;
}

function computeAdhanTimes(
  date: Date,
  latitude: number,
  longitude: number,
  params: { fajr: number; isha: number; ishaInterval?: number; maghribAngle?: number },
  madhhab: Madhhab
): PrayerTimes {
  const dayOfYear = getDayOfYear(date);
  const jDate = julianDate(date);
  
  // Sun's position
  const sunDeclination = 23.45 * Math.sin(toRadians((360 / 365) * (dayOfYear - 81)));
  const eqTime = 9.87 * Math.sin(toRadians(2 * ((360 / 365) * (dayOfYear - 81)))) 
    - 7.53 * Math.cos(toRadians((360 / 365) * (dayOfYear - 81))) 
    - 1.5 * Math.sin(toRadians((360 / 365) * (dayOfYear - 81)));
  
  const latRad = toRadians(latitude);
  
  // Calculate times
  const fajrAngle = params.fajr;
  const ishaAngle = params.isha === 90 ? 18 : params.isha;
  
  // Time calculations helper
  const calcTime = (angle: number, divisor: number): number => {
    const decl = toRadians(sunDeclination);
    const arc = (1 / Math.cos(latRad - decl * Math.sin(latRad) / Math.cos(latRad)) + Math.tan(Math.abs(latRad - decl))) / 2;
    return (1 / 15) * arc * divisor;
  };
  
  const zuhr = 12 - (longitude / 15) + eqTime / 60;
  
  const fajr = zuhr - calcTime(fajrAngle, -1);
  const maghrib = zuhr + calcTime(params.maghribAngle || 4, 1);
  
  let isha: number;
  if (params.isha === 90) {
    // Isha interval from maghrib
    isha = maghrib + 90 / 60; // 90 minutes after maghrib
  } else {
    isha = zuhr + calcTime(ishaAngle, 1);
  }
  
  // Asr calculation
  const asrFactor = madhhab === 'hanafi' ? 2 : 1;
  const asr = zuhr + calcTime(Math.atan(1 / (1 + asrFactor)), 1);
  
  // Convert decimal hours to Date
  const toDate = (decimal: number): Date => {
    const hours = Math.floor(decimal);
    const minutes = Math.floor((decimal - hours) * 60);
    const secs = Math.floor(((decimal - hours) * 60 - minutes) * 60);
    const result = new Date(date);
    result.setHours(hours, minutes, secs, 0);
    return result;
  };
  
  return {
    fajr: toDate(fajr),
    sunrise: toDate(zuhr - calcTime(96, -1)),
    dhuhr: toDate(zuhr),
    asr: toDate(asr),
    maghrib: toDate(maghrib),
    isha: toDate(isha),
  };
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function getNextPrayer(prayerTimes: PrayerTimes): Prayer | null {
  const now = new Date();
  const entries = [
    { prayer: PRAYERS[0], time: prayerTimes.fajr },
    { prayer: PRAYERS[1], time: prayerTimes.sunrise },
    { prayer: PRAYERS[2], time: prayerTimes.dhuhr },
    { prayer: PRAYERS[3], time: prayerTimes.asr },
    { prayer: PRAYERS[4], time: prayerTimes.maghrib },
    { prayer: PRAYERS[5], time: prayerTimes.isha },
  ].filter(e => e.prayer.id !== 'sunrise'); // Sunrise is not a prayer
  
  for (const entry of entries) {
    if (entry.time > now) {
      return entry.prayer;
    }
  }
  return null;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatTimer(date: Date): string {
  const now = new Date();
  const diff = Math.max(0, date.getTime() - now.getTime());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

type TabName = 'today' | 'mosques' | 'qibla' | 'worship' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('today');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<Prayer | null>(null);
  const [nextPrayerTime, setNextPrayerTime] = useState<Date | null>(null);
  const [completedPrayers, setCompletedPrayers] = useState<Set<string>>(new Set());
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('Loading...');
  const [hijriDate, setHijriDate] = useState('');

  useEffect(() => {
    (async () => {
      // Set navigation bar color
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync('#014836');
        await NavigationBar.setButtonStyleAsync('light');
      }
    })();
  }, []);

  useEffect(() => {
    loadLocationAndTimes();
  }, []);

  useEffect(() => {
    if (nextPrayerTime) {
      const timer = setInterval(() => {
        setTimerDisplay(formatTimer(nextPrayerTime!));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [nextPrayerTime]);

  async function loadLocationAndTimes() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Permission denied');
        useDefaultLocation();
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      setSettings(prev => ({
        ...prev,
        coordinate: { latitude, longitude },
        locationName: 'Current Location',
      }));

      const times = calculatePrayerTimes(new Date(), { ...settings, coordinate: { latitude, longitude }, locationName: 'Current Location' });
      setPrayerTimes(times);
      
      const next = getNextPrayer(times);
      setNextPrayer(next);
      
      if (next) {
        const nextTime = (times as any)[next.id];
        setNextPrayerTime(nextTime);
      }

      // Get location name
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        setLocationName(address.subregion || address.region || 'Current Location');
      }
      
      // Calculate Hijri date
      setHijriDate(calculateHijriDate(new Date()));

    } catch (error) {
      console.error('Location error:', error);
      useDefaultLocation();
    } finally {
      setLoading(false);
    }
  }

  function useDefaultLocation() {
    const times = calculatePrayerTimes(new Date(), DEFAULT_SETTINGS);
    setPrayerTimes(times);
    const next = getNextPrayer(times);
    setNextPrayer(next);
    if (next) {
      const nextTime = (times as any)[next.id];
      setNextPrayerTime(nextTime);
    }
  }

  function togglePrayer(prayerId: string) {
    setCompletedPrayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(prayerId)) {
        newSet.delete(prayerId);
      } else {
        newSet.add(prayerId);
      }
      return newSet;
    });
  }

  function updateSettings(updates: Partial<Settings>) {
    setSettings(prev => ({ ...prev, ...updates }));
    const times = calculatePrayerTimes(new Date(), { ...settings, ...updates });
    setPrayerTimes(times);
    const next = getNextPrayer(times);
    setNextPrayer(next);
    if (next) {
      const nextTime = (times as any)[next.id];
      setNextPrayerTime(nextTime);
    }
  }

  function calculateHijriDate(date: Date): string {
    // Simplified Hijri calculation
    const julianDay = Math.floor(date.getTime() / 86400000 + 2440587.5);
    const hijriStart = 1948439.5; // Julian day of 1 Muharram 1400
    const daysSinceHijri = julianDay - hijriStart;
    const hijriYear = Math.floor(daysSinceHijri / 354.36667) + 1400;
    const daysInYear = daysSinceHijri % 354.36667;
    const hijriMonth = Math.floor(daysInYear / 29.5);
    const hijriDay = Math.floor(daysInYear % 29.5) + 1;
    
    const months = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'];
    
    return `${hijriDay} ${months[Math.min(hijriMonth, 11)]} ${hijriYear}`;
  }

  const tabs: { id: TabName; label: string; icon: string }[] = [
    { id: 'today', label: 'Today', icon: '🕌' },
    { id: 'mosques', label: 'Mosques', icon: '📍' },
    { id: 'qibla', label: 'Qibla', icon: '🧭' },
    { id: 'worship', label: 'Worship', icon: '📖' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#014836" />
        <Text style={styles.loadingText}>Loading prayer times...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'today' && prayerTimes && (
          <TodayScreen
            prayerTimes={prayerTimes}
            nextPrayer={nextPrayer}
            nextPrayerTime={nextPrayerTime}
            completedPrayers={completedPrayers}
            locationName={locationName}
            hijriDate={hijriDate}
            timerDisplay={timerDisplay}
            togglePrayer={togglePrayer}
          />
        )}
        {activeTab === 'mosques' && (
          <MosquesScreen coordinate={settings.coordinate} />
        )}
        {activeTab === 'qibla' && (
          <QiblaScreen coordinate={settings.coordinate} />
        )}
        {activeTab === 'worship' && (
          <WorshipScreen />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            updateSettings={updateSettings}
          />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  tabContent: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#014836',
    paddingVertical: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabItemActive: {
    // Active state
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});