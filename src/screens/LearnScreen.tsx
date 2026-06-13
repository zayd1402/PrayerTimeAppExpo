import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { iconName } from '../components/Icon';
import { C } from '../types';
import { usePrayerApp } from '../context/PrayerAppContext';
import RamadanScreen from './RamadanScreen';
import DuaLibraryScreen from './DuaLibraryScreen';
import HadithScreen from './HadithScreen';
import FridayScreen from './FridayScreen';
import WeeklyScreen from './WeeklyScreen';
import SettingsScreen from './SettingsScreen';

type LearnSection = 'ramadan' | 'duas' | 'hadith' | 'friday' | 'weekly' | 'settings';

const LEARN_ITEMS: { id: LearnSection; title: string; description: string; icon: string; color: string }[] = [
  { id: 'ramadan', title: 'Ramadan', description: 'Tracker, khatm plan, last 10 nights, and Ramadan dua.', icon: 'moon-outline', color: C.gold },
  { id: 'duas', title: 'Dua Library', description: 'Searchable supplications for daily moments.', icon: 'book-outline', color: C.primary },
  { id: 'hadith', title: 'Hadith', description: 'Daily hadith, categories, favorites, and sharing.', icon: 'document-text-outline', color: C.gold },
  { id: 'friday', title: 'Friday', description: 'Jumu\'ah checklist, Al-Kahf progress, and dua times.', icon: 'star-outline', color: C.primaryLight },
  { id: 'weekly', title: 'Weekly Sunnah', description: 'Simple weekly practices and fasting reminders.', icon: 'calendar-clear-outline', color: C.gold },
];

export default function LearnScreen() {
  const { settings, handleUpdateSettings } = usePrayerApp();
  const [activeSection, setActiveSection] = useState<LearnSection | null>(null);

  if (activeSection) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveSection(null)}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
          <Text style={styles.backButtonText}>Learn</Text>
        </TouchableOpacity>
        {activeSection === 'ramadan' && <RamadanScreen />}
        {activeSection === 'duas' && <DuaLibraryScreen />}
        {activeSection === 'hadith' && <HadithScreen />}
        {activeSection === 'friday' && <FridayScreen />}
        {activeSection === 'weekly' && <WeeklyScreen />}
        {activeSection === 'settings' && <SettingsScreen settings={settings} updateSettings={handleUpdateSettings} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Learn</Text>
          <Text style={styles.subtitle}>Daily guidance, Ramadan tools, and practical Sunnah reminders.</Text>
        </View>

      <View style={styles.featuredCard}>
        <Ionicons name="moon-outline" size={24} color={C.goldPale} />
        <View style={styles.featuredText}>
          <Text style={styles.featuredTitle}>Ramadan is part of the MVP</Text>
          <Text style={styles.featuredDesc}>Track the month, plan khatm, and keep Ramadan visible from Today, Worship, Calendar, and Learn.</Text>
        </View>
        <TouchableOpacity style={styles.featuredButton} onPress={() => setActiveSection('ramadan')}>
          <Text style={styles.featuredButtonText}>Open</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {LEARN_ITEMS.map(item => (
          <TouchableOpacity key={item.id} style={styles.card} onPress={() => setActiveSection(item.id)}>
            <View style={[styles.iconWrap, { backgroundColor: item.color + '18' }]}>
              <Ionicons name={iconName(item.icon)} size={24} color={item.color} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.settingsCard} onPress={() => setActiveSection('settings')}>
        <Ionicons name="settings-outline" size={24} color={C.primary} />
        <View style={styles.settingsText}>
          <Text style={styles.cardTitle}>Settings</Text>
          <Text style={styles.cardDesc}>Manual city, prayer calculation, notifications, live countdown, and adhan audio.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  scrollView: { flex: 1 },
  content: { paddingBottom: 120 },
  screen: { flex: 1, backgroundColor: C.bgBase },
  header: { padding: 18, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.goldPale },
  subtitle: { fontSize: 14, color: C.goldLight, fontFamily: 'Jost_400Regular', marginTop: 4 },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.goldPale,
    borderRadius: 20,
    margin: 18,
    marginBottom: 16,
    padding: 16,
    gap: 12,
  },
  featuredText: { flex: 1 },
  featuredTitle: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.gold },
  featuredDesc: { fontSize: 12, color: C.textSecondary, lineHeight: 18, marginTop: 2 },
  featuredButton: { backgroundColor: C.heroBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  featuredButtonText: { color: C.goldPale, fontSize: 12, fontFamily: 'Jost_700Bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 12 },
  card: {
    width: '47%',
    minHeight: 132,
    backgroundColor: C.surfaceElevated,
    borderRadius: 18,
    padding: 16,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  cardDesc: { fontSize: 12, color: C.textMuted, lineHeight: 17, marginTop: 4 },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSurface,
    borderRadius: 18,
    marginHorizontal: 18,
    marginTop: 14,
    padding: 16,
    gap: 14,
  },
  settingsText: { flex: 1 },
  backButton: {
    position: 'absolute',
    zIndex: 10,
    top: 18,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(58,44,26,0.72)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: { color: C.white, fontSize: 14, fontFamily: 'Jost_600SemiBold' },
});
