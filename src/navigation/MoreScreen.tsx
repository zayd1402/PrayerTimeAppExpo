// ─── MoreScreen — Grid menu + inline sub-screen rendering ─────
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { iconName } from '../components/Icon';
import { C } from '../types';

import HadithScreen from '../screens/HadithScreen';
import HajjScreen from '../screens/HajjScreen';
import RamadanScreen from '../screens/RamadanScreen';
import HifdhScreen from '../screens/HifdhScreen';
import TazkiyahScreen from '../screens/TazkiyahScreen';
import FridayScreen from '../screens/FridayScreen';
import WeeklyScreen from '../screens/WeeklyScreen';
import QiblaScreen from '../screens/QiblaScreen';
import ZakatScreen from '../screens/ZakatScreen';
import JournalScreen from '../screens/JournalScreen';
import MosquesScreen from '../screens/MosquesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { usePrayerApp } from '../context/PrayerAppContext';

const MORE_MENU = [
  { id: 'hadith',  label: 'Hadith',  icon: 'document-text-outline', color: C.gold },
  { id: 'hajj',    label: 'Hajj',    icon: 'airplane-outline',      color: C.gold },
  { id: 'ramadan', label: 'Ramadan', icon: 'moon-outline',          color: C.gold },
  { id: 'hifdh',   label: 'Hifdh',   icon: 'book-outline',          color: C.primary },
  { id: 'tazkiyah',label: 'Tazkiyah',icon: 'leaf-outline',          color: C.primary },
  { id: 'friday',  label: 'Friday',  icon: 'star-outline',         color: C.primaryLight },
  { id: 'weekly',  label: 'Weekly',  icon: 'calendar-clear-outline', color: C.gold },
  { id: 'qibla',   label: 'Qibla',   icon: 'compass-outline',      color: C.primary },
  { id: 'zakat',   label: 'Zakat',   icon: 'wallet-outline',       color: C.gold },
  { id: 'journal', label: 'Journal', icon: 'create-outline',       color: C.textSecondary },
  { id: 'mosques', label: 'Mosques', icon: 'location-outline',     color: C.gold },
  { id: 'settings',label: 'Settings',icon: 'settings-outline',     color: C.textSecondary },
];

type MoreItemId = typeof MORE_MENU[number]['id'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 14;
const GRID_GAP = 10;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

export default function MoreScreen() {
  const [activeScreen, setActiveScreen] = useState<MoreItemId | null>(null);
  const ctx = usePrayerApp();
  const activeLocation = ctx.location;

  if (!activeLocation) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <View style={styles.moreHeader}>
          <Text style={styles.moreTitle}>Location needed</Text>
          <Text style={styles.moreLabel}>Choose a manual city or enable device location in Settings.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (activeScreen && activeLocation) {
    const handleBack = () => setActiveScreen(null);
    const subScreen = (() => {
      switch (activeScreen) {
        case 'hadith':  return <HadithScreen />;
        case 'hajj':    return <HajjScreen />;
        case 'ramadan': return <RamadanScreen />;
        case 'hifdh':   return <HifdhScreen />;
        case 'tazkiyah':return <TazkiyahScreen />;
        case 'friday':  return <FridayScreen />;
        case 'weekly':  return <WeeklyScreen />;
        case 'qibla':   return <QiblaScreen coordinate={{ latitude: activeLocation.latitude, longitude: activeLocation.longitude }} />;
        case 'zakat':   return <ZakatScreen />;
        case 'journal': return <JournalScreen />;
        case 'mosques': return <MosquesScreen coordinate={{ latitude: activeLocation.latitude, longitude: activeLocation.longitude }} />;
        case 'settings':return <SettingsScreen settings={{
          ...ctx.settings,
          location: activeLocation.latitude ? {
            latitude: activeLocation.latitude,
            longitude: activeLocation.longitude,
            name: activeLocation.name,
          } : null,
        }} updateSettings={(u) => {
          ctx.handleUpdateSettings(u);
        }} />;
        default: return null;
      }
    })();

    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#FFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        {subScreen}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
        <View style={styles.moreHeader}>
          <Text style={styles.moreTitle}>More</Text>
        </View>
        <View style={styles.moreGrid}>
          {MORE_MENU.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.moreCard}
              onPress={() => setActiveScreen(item.id)}
            >
              <View style={[styles.moreIconWrap, { backgroundColor: item.color + '12' }]}>
                <Ionicons name={iconName(item.icon)} size={24} color={item.color} />
              </View>
              <Text style={styles.moreLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  screenPadding: { paddingBottom: 100 },
  moreHeader: { padding: 18, backgroundColor: C.heroBg },
  moreTitle: { fontSize: 26, fontFamily: 'BodoniModa_700Bold', color: C.goldPale },
  moreGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 10 },
  moreCard: {
    width: GRID_CARD_WIDTH, backgroundColor: C.bgSurface, borderRadius: 18,
    padding: 16, alignItems: 'center',
  },
  moreIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  moreLabel: { fontSize: 12, fontFamily: 'Jost_600SemiBold', color: C.textPrimary, textAlign: 'center' },
  scrollView: { flex: 1 },
  backButton: {
    position: 'absolute', zIndex: 10,
    top: 18,
    left: 18, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(58,44,26,0.55)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  backText: { color: '#FFF', fontSize: 14, fontFamily: 'Jost_600SemiBold' },
});
