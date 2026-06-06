// ─── MoreScreen — Grid menu + inline sub-screen rendering ─────
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';

import HadithScreen from '../screens/HadithScreen';
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
  { id: 'friday',  label: 'Friday',  icon: 'star-outline',         color: C.primaryLight },
  { id: 'weekly',  label: 'Weekly',  icon: 'calendar-clear-outline', color: C.gold },
  { id: 'qibla',   label: 'Qibla',   icon: 'compass-outline',      color: C.primary },
  { id: 'zakat',   label: 'Zakat',   icon: 'wallet-outline',       color: C.gold },
  { id: 'journal', label: 'Journal', icon: 'create-outline',       color: C.textSecondary },
  { id: 'mosques', label: 'Mosques', icon: 'location-outline',     color: C.gold },
  { id: 'settings',label: 'Settings',icon: 'settings-outline',     color: C.textSecondary },
];

type MoreItemId = typeof MORE_MENU[number]['id'];

export default function MoreScreen() {
  const [activeScreen, setActiveScreen] = useState<MoreItemId | null>(null);
  const ctx = usePrayerApp();

  if (activeScreen) {
    const handleBack = () => setActiveScreen(null);
    const subScreen = (() => {
      switch (activeScreen) {
        case 'hadith':  return <HadithScreen />;
        case 'friday':  return <FridayScreen />;
        case 'weekly':  return <WeeklyScreen />;
        case 'qibla':   return <QiblaScreen coordinate={{ latitude: ctx.location.latitude, longitude: ctx.location.longitude }} />;
        case 'zakat':   return <ZakatScreen />;
        case 'journal': return <JournalScreen />;
        case 'mosques': return <MosquesScreen coordinate={{ latitude: ctx.location.latitude, longitude: ctx.location.longitude }} />;
        case 'settings':return <SettingsScreen settings={{
          method: ctx.settings.calculationMethod,
          madhhab: ctx.settings.madhab === 'hanafi' ? 'hanafi' : 'shafi',
          coordinate: { latitude: ctx.location.latitude, longitude: ctx.location.longitude },
          locationName: ctx.location.name,
        }} updateSettings={(u) => {
          if (u.method) ctx.handleUpdateSettings({ calculationMethod: u.method });
          if (u.madhhab) ctx.handleUpdateSettings({ madhab: u.madhhab });
        }} />;
        default: return null;
      }
    })();

    return (
      <View style={styles.screen}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#FFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        {subScreen}
      </View>
    );
  }

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
            onPress={() => setActiveScreen(item.id)}
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
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  screenPadding: { paddingBottom: 100 },
  moreHeader: { padding: 18, paddingTop: 60, backgroundColor: C.heroBg },
  moreTitle: { fontSize: 26, fontFamily: 'BodoniModa_700Bold', color: C.textPrimary },
  moreGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 10 },
  moreCard: {
    width: '30%', backgroundColor: C.bgSurface, borderRadius: 18,
    padding: 16, alignItems: 'center',
  },
  moreIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  moreLabel: { fontSize: 12, fontFamily: 'Jost_600SemiBold', color: C.textPrimary, textAlign: 'center' },
  backButton: {
    position: 'absolute', zIndex: 10,
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 18, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(58,44,26,0.55)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  backText: { color: '#FFF', fontSize: 14, fontFamily: 'Jost_600SemiBold' },
});
