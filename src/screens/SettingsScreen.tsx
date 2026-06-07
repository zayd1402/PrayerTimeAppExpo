import React, { useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { C, CalculationMethod, Madhab, AppSettings } from '../types';
import { getCurrentLocation } from '../services/LocationService';

interface SettingsScreenProps {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const METHODS: { value: CalculationMethod; label: string }[] = [
  { value: 'muslim_world_league', label: 'Muslim World League' },
  { value: 'egyptian', label: 'Egyptian' },
  { value: 'karachi', label: 'Karachi' },
  { value: 'umm_al_qura', label: 'Umm Al-Qura' },
  { value: 'dubai', label: 'Dubai' },
  { value: 'qatar', label: 'Qatar' },
  { value: 'kuwait', label: 'Kuwait' },
  { value: 'moonsighting_committee', label: 'Moonsighting Committee' },
  { value: 'singapore', label: 'Singapore' },
  { value: 'tehran', label: 'Tehran' },
  { value: 'north_america', label: 'North America' },
  { value: 'custom', label: 'Custom' },
];

const FAJR_ALARM_OPTIONS = [5, 10, 15, 20, 30];

export default function SettingsScreen({ settings, updateSettings }: SettingsScreenProps) {
  const handleLocationDetect = useCallback(async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      updateSettings({ location: loc });
      Alert.alert('Location Updated', `Set to ${loc.name}`);
    } else {
      Alert.alert('Location Failed', 'Could not detect location. Please try again or enter manually.');
    }
  }, [updateSettings]);

  const handleRateApp = useCallback(async () => {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Auto-detect location</Text>
              <Text style={styles.rowSubtitle}>{settings.location?.name || 'Not set'}</Text>
            </View>
            <Switch
              value={!!settings.location}
              onValueChange={() => {
                if (settings.location) {
                  updateSettings({ location: null });
                } else {
                  handleLocationDetect();
                }
              }}
              trackColor={{ true: C.primary }}
            />
          </View>

          <TouchableOpacity style={styles.row} onPress={handleLocationDetect}>
            <Text style={styles.rowLabel}>📍 Use Current Location</Text>
            <Text style={styles.rowValue}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prayer Time Calculations</Text>
        <View style={styles.card}>
          {METHODS.map(method => (
            <TouchableOpacity
              key={method.value}
              style={styles.optionRow}
              onPress={() => updateSettings({ calculationMethod: method.value })}
            >
              <Text style={styles.optionLabel}>{method.label}</Text>
              {settings.calculationMethod === method.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Madhhab (School of Thought)</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => updateSettings({ madhab: 'shafi' })}
          >
            <View>
              <Text style={styles.optionLabel}>Shafi</Text>
              <Text style={styles.optionSubtitle}>Standard Asr time</Text>
            </View>
            {settings.madhab === 'shafi' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => updateSettings({ madhab: 'hanafi' })}
          >
            <View>
              <Text style={styles.optionLabel}>Hanafi</Text>
              <Text style={styles.optionSubtitle}>Later Asr time</Text>
            </View>
            {settings.madhab === 'hanafi' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Prayer time alerts</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={v => updateSettings({ notificationsEnabled: v })}
              trackColor={{ true: C.primary }}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Fajr alarm</Text>
            <Switch
              value={settings.fajrAlarmEnabled}
              onValueChange={v => updateSettings({ fajrAlarmEnabled: v })}
              trackColor={{ true: C.primary }}
            />
          </View>

          {settings.fajrAlarmEnabled && (
            <View style={styles.subRow}>
              <Text style={styles.rowLabel}>Minutes before Fajr</Text>
              <View style={styles.pillRow}>
                {FAJR_ALARM_OPTIONS.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.pill, settings.fajrAlarmMinutes === m && styles.pillActive]}
                    onPress={() => updateSettings({ fajrAlarmMinutes: m })}
                  >
                    <Text style={[styles.pillText, settings.fajrAlarmMinutes === m && styles.pillTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Iqama countdown</Text>
            <Switch
              value={settings.iqamaCountdownEnabled}
              onValueChange={v => updateSettings({ iqamaCountdownEnabled: v })}
              trackColor={{ true: C.primary }}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://prayertime.app/privacy')}>
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Text style={styles.rowValue}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={handleRateApp}>
            <Text style={styles.rowLabel}>Rate App</Text>
            <Text style={styles.rowValue}>⭐⭐⭐⭐⭐</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>PrayerTimeApp © 2024</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bgSurface,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    padding: 18,
    paddingTop: 60,
    backgroundColor: C.heroBg,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Jost_700Bold',
    color: C.white,
  },
  section: {
    padding: 18,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Jost_600SemiBold',
    color: C.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: C.bgSurface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowLabel: {
    fontSize: 16,
    color: C.textPrimary,
  },
  rowSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
    color: C.textMuted,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  optionLabel: {
    fontSize: 16,
    color: C.textPrimary,
  },
  optionSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: C.primary,
    fontFamily: 'Jost_700Bold',
  },
  manualLocation: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  locationButton: {
    backgroundColor: C.goldPale,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  locationButtonText: {
    fontSize: 15,
    color: C.textPrimary,
    fontFamily: 'Jost_600SemiBold',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bgBase,
  },
  pillRow: { flexDirection: 'row', gap: 6 },
  pill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: C.bgSurface,
  },
  pillActive: { backgroundColor: C.primary },
  pillText: { fontSize: 12, fontFamily: 'Jost_600SemiBold', color: C.textSecondary },
  pillTextActive: { color: C.white },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: C.textMuted,
  },
});