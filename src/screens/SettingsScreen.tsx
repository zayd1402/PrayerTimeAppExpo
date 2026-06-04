import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { C, CalculationMethod, Madhab } from '../types';

interface Settings {
  method: CalculationMethod;
  madhhab: Madhab;
  coordinate: { latitude: number; longitude: number };
  locationName: string;
}

interface SettingsScreenProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
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

export default function SettingsScreen({ settings, updateSettings }: SettingsScreenProps) {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [autoLocation, setAutoLocation] = React.useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Auto-detect location</Text>
              <Text style={styles.rowSubtitle}>{settings.locationName}</Text>
            </View>
            <Switch
              value={autoLocation}
              onValueChange={setAutoLocation}
              trackColor={{ true: C.emerald }}
            />
          </View>
          
          {!autoLocation && (
            <View style={styles.manualLocation}>
              <TouchableOpacity style={styles.locationButton}>
                <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.locationButton}>
                <Text style={styles.locationButtonText}>🔍 Enter Manually</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Calculation Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calculation Method</Text>
        
        <View style={styles.card}>
          {METHODS.map(method => (
            <TouchableOpacity
              key={method.value}
              style={styles.optionRow}
              onPress={() => updateSettings({ method: method.value })}
            >
              <Text style={styles.optionLabel}>{method.label}</Text>
              {settings.method === method.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Madhhab Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Madhhab (School of Thought)</Text>
        
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => updateSettings({ madhhab: 'shafi' })}
          >
            <View>
              <Text style={styles.optionLabel}>Shafi</Text>
              <Text style={styles.optionSubtitle}>Standard Asr time</Text>
            </View>
            {settings.madhhab === 'shafi' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => updateSettings({ madhhab: 'hanafi' })}
          >
            <View>
              <Text style={styles.optionLabel}>Hanafi</Text>
              <Text style={styles.optionSubtitle}>Later Asr time</Text>
            </View>
            {settings.madhhab === 'hanafi' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Prayer alerts</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: C.emerald }}
            />
          </View>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Pre-azan reminder</Text>
            <Text style={styles.rowValue}>15 min before</Text>
          </View>
          
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Custom azan sound</Text>
            <Text style={styles.rowValue}>▶ Default</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Text style={styles.rowValue}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.row}>
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
    backgroundColor: '#F5F5F0',
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
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    padding: 18,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
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
    color: C.emerald,
    fontWeight: 'bold',
  },
  manualLocation: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  locationButton: {
    backgroundColor: '#E8F5F0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  locationButtonText: {
    fontSize: 15,
    color: C.heroBg,
    fontWeight: '600',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: C.textMuted,
  },
});