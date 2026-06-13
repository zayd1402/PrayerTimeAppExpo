import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import { usePrayerApp } from '../context/PrayerAppContext';
import QiblaScreen from './QiblaScreen';
import MosquesScreen from './MosquesScreen';
import SettingsScreen from './SettingsScreen';

export default function QiblaMosquesScreen() {
  const { location, settings, handleUpdateSettings } = usePrayerApp();
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <TouchableOpacity style={styles.backButton} onPress={() => setShowSettings(false)}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <SettingsScreen settings={settings} updateSettings={handleUpdateSettings} />
      </SafeAreaView>
    );
  }

  if (!location) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Qibla & Mosques</Text>
            <Text style={styles.subtitle}>Choose a manual city or enable device location to calculate direction and nearby mosques.</Text>
          </View>
        </View>

        <View style={styles.emptyCard}>
          <Ionicons name="location-outline" size={34} color={C.gold} />
          <Text style={styles.emptyTitle}>Location needed</Text>
          <Text style={styles.emptyText}>Prayer times, Qibla direction, and mosque distance require a selected city.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setShowSettings(true)}>
            <Ionicons name="settings-outline" size={18} color={C.white} />
            <Text style={styles.primaryButtonText}>Choose Manual City</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const coordinate = { latitude: location.latitude, longitude: location.longitude };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Qibla & Mosques</Text>
            <Text style={styles.subtitle}>{location.name}</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Ionicons name="settings-outline" size={20} color={C.goldPale} />
          </TouchableOpacity>
        </View>

        <QiblaScreen coordinate={coordinate} compact />

        <View style={styles.sectionHeader}>
          <Ionicons name="business-outline" size={18} color={C.gold} />
          <Text style={styles.sectionTitle}>Local Mosques</Text>
        </View>

        <MosquesScreen coordinate={coordinate} embedded />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  scrollView: { flex: 1 },
  content: { paddingBottom: 120 },
  screen: { flex: 1, backgroundColor: C.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: C.heroBg,
  },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.goldPale },
  subtitle: { fontSize: 13, color: C.goldLight, fontFamily: 'Jost_400Regular', marginTop: 4, maxWidth: 260 },
  settingsButton: { width: 42, height: 42, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
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
  emptyCard: {
    backgroundColor: C.surfaceElevated,
    borderRadius: 22,
    padding: 24,
    margin: 18,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginTop: 12 },
  emptyText: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 18,
  },
  primaryButtonText: { color: C.white, fontSize: 14, fontFamily: 'Jost_700Bold' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary },
});
