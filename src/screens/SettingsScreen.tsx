import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../components/Card';
import { OptionActionSheet } from '../components/OptionActionSheet';
import { C, AppSettings, CalculationMethod, Madhab } from '../types';
import { requestDeviceCalendarPermission } from '../services/CalendarIntegrationService';
import { requestNotificationPermission } from '../services/NotificationService';

const METHOD_LABELS: Record<string, string> = {
  muslim_world_league: 'Islamic Society (MWL)',
  isna: 'ISNA',
  egyptian: 'Egyptian',
  umm_al_qura: 'Umm Al-Qura',
  karachi: 'Karachi (University)',
};

const METHOD_OPTIONS: { label: string; value: CalculationMethod; description: string }[] = [
  { label: 'Muslim World League', value: 'muslim_world_league', description: 'Balanced default for many regions.' },
  { label: 'ISNA', value: 'isna', description: 'Common in North America.' },
  { label: 'Egyptian', value: 'egyptian', description: 'Egyptian General Authority.' },
  { label: 'Umm Al-Qura', value: 'umm_al_qura', description: 'Commonly used in Saudi Arabia.' },
  { label: 'Karachi', value: 'karachi', description: 'University of Islamic Sciences.' },
];

const MADHAB_OPTIONS: { label: string; value: Madhab; description: string }[] = [
  { label: 'Shafi', value: 'shafi', description: 'Standard Asr shadow calculation.' },
  { label: 'Hanafi', value: 'hanafi', description: 'Later Asr calculation used by Hanafi schools.' },
];

const FAJR_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export function SettingsScreen({
  settings,
  onUpdate,
  onResetData,
  bottomInset = 0,
}: {
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => void;
  onResetData: () => void;
  bottomInset?: number;
}) {
  const [optionSheet, setOptionSheet] = useState<'method' | 'madhab' | null>(null);

  const handleToggle = async (key: keyof AppSettings, value: boolean) => {
    if (key === 'notificationsEnabled' && value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Enable notifications in your device settings.');
        return;
      }
    }
    onUpdate({ [key]: value });
  };

  const handleCalendarToggle = async (value: boolean) => {
    if (!value) {
      onUpdate({ calendarIntegrationEnabled: false });
      return;
    }
    const granted = await requestDeviceCalendarPermission();
    if (!granted) {
      Alert.alert('Calendar Access Needed', 'Allow calendar access in device settings to show events beside prayer times.');
      return;
    }
    onUpdate({ calendarIntegrationEnabled: true });
  };

  const handleFajrAlarmToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Enable notifications to use Fajr alarm.');
        return;
      }
    }
    onUpdate({ fajrAlarmEnabled: value });
  };

  const updateFajrAlarmMinutes = (delta: number) => {
    const nextValue = Math.min(60, Math.max(5, settings.fajrAlarmMinutes + delta));
    onUpdate({ fajrAlarmMinutes: nextValue, fajrAlarmEnabled: true });
  };

  return (
    <>
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.screenPadding, { paddingBottom: 108 + bottomInset }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.settingsHero}>
        <View>
          <Text style={styles.settingsEyebrow}>Preferences</Text>
          <Text style={styles.settingsTitle}>Settings</Text>
          <Text style={styles.settingsSubtitle}>Keep calculation, alerts, and local data under control.</Text>
        </View>
        <View style={styles.settingsHeroIcon}>
          <Ionicons name="settings-outline" size={24} color={C.gold} />
        </View>
      </View>

      <Text style={styles.settingsSectionTitle}>LOCATION</Text>
      <Card>
        <View style={styles.srow}>
          <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
            <Ionicons name="location-outline" size={16} color={C.navy} />
          </View>
          <View style={styles.srowLeft}>
            <Text style={styles.srowLabel}>Current Location</Text>
            <Text style={styles.srowSub}>{settings.location?.name || 'Not set'}</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.settingsSectionTitle}>NOTIFICATIONS</Text>
      <Card>
        <View style={styles.srow}>
          <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
            <Ionicons name="notifications-outline" size={16} color={C.navy} />
          </View>
          <Text style={styles.srowLabel}>Prayer Alerts</Text>
          <Text style={styles.srowValue}>{settings.notificationsEnabled ? 'On' : 'Off'}</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={v => handleToggle('notificationsEnabled', v)}
            trackColor={{ false: 'rgba(7,26,53,0.12)', true: C.emeraldPale }}
            thumbColor={settings.notificationsEnabled ? C.emerald : '#fff'}
          />
        </View>
        <View style={[styles.srow, styles.srowBorder]}>
          <View style={[styles.srowIcon, { backgroundColor: C.goldPale }]}>
            <Ionicons name="alarm-outline" size={16} color={C.gold} />
          </View>
          <Text style={styles.srowLabel}>Fajr Auto-Alarm</Text>
          <Text style={styles.srowValue}>{settings.fajrAlarmEnabled ? `${settings.fajrAlarmMinutes}m` : 'Off'}</Text>
          <Switch
            value={settings.fajrAlarmEnabled}
            onValueChange={handleFajrAlarmToggle}
            trackColor={{ false: 'rgba(7,26,53,0.12)', true: C.emeraldPale }}
            thumbColor={settings.fajrAlarmEnabled ? C.emerald : '#fff'}
          />
        </View>
        <View style={[styles.alarmAdjustRow, styles.srowBorder]}>
          <View style={styles.alarmPresetHeader}>
            <Text style={styles.alarmPresetTitle}>Alarm lead time</Text>
            <View style={styles.alarmStepper}>
              <TouchableOpacity style={styles.stepperButton} onPress={() => updateFajrAlarmMinutes(-5)} activeOpacity={0.72}>
                <Ionicons name="remove" size={15} color={C.navy} />
              </TouchableOpacity>
              <Text style={styles.alarmStepperValue}>{settings.fajrAlarmMinutes}m</Text>
              <TouchableOpacity style={styles.stepperButton} onPress={() => updateFajrAlarmMinutes(5)} activeOpacity={0.72}>
                <Ionicons name="add" size={15} color={C.navy} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.presetGrid}>
            {FAJR_PRESETS.map(minutes => (
              <TouchableOpacity
                key={minutes}
                style={[styles.presetChip, settings.fajrAlarmMinutes === minutes && styles.presetChipActive]}
                onPress={() => onUpdate({ fajrAlarmMinutes: minutes, fajrAlarmEnabled: true })}
                activeOpacity={0.72}
              >
                <Text style={[styles.presetChipText, settings.fajrAlarmMinutes === minutes && styles.presetChipTextActive]}>{minutes}m</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      <Text style={styles.settingsSectionTitle}>PLANNER</Text>
      <Card>
        <View style={styles.srow}>
          <View style={[styles.srowIcon, { backgroundColor: C.emeraldPale }]}>
            <Ionicons name="calendar-outline" size={16} color={C.emerald} />
          </View>
          <View style={styles.srowLeftStack}>
            <Text style={styles.srowLabel}>Device Calendar</Text>
            <Text style={styles.srowSub}>Show phone calendar events beside prayers</Text>
          </View>
          <Text style={styles.srowValue}>{settings.calendarIntegrationEnabled ? 'On' : 'Off'}</Text>
          <Switch
            value={settings.calendarIntegrationEnabled}
            onValueChange={handleCalendarToggle}
            trackColor={{ false: 'rgba(7,26,53,0.12)', true: C.emeraldPale }}
            thumbColor={settings.calendarIntegrationEnabled ? C.emerald : '#fff'}
          />
        </View>
      </Card>

      <Text style={styles.settingsSectionTitle}>CALCULATION</Text>
      <Card>
        <TouchableOpacity
          style={[styles.srow, styles.srowBorder]}
          onPress={() => setOptionSheet('method')}
        >
          <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
            <Ionicons name="globe-outline" size={16} color={C.navy} />
          </View>
          <Text style={styles.srowLabel}>Method</Text>
          <Text style={styles.srowValue}>{METHOD_LABELS[settings.calculationMethod]}</Text>
          <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.srow, styles.srowBorder]}
          onPress={() => setOptionSheet('madhab')}
        >
          <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
            <Ionicons name="book-outline" size={16} color={C.navy} />
          </View>
          <Text style={styles.srowLabel}>Madhab</Text>
          <Text style={styles.srowValue}>{settings.madhab === 'shafi' ? 'Shafi' : 'Hanafi'}</Text>
          <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
        </TouchableOpacity>
      </Card>

      <Text style={styles.settingsSectionTitle}>ABOUT</Text>
      <Card>
        <View style={styles.srow}>
          <View style={styles.brandMark}>
            <Ionicons name="moon" size={15} color={C.bgSurface} />
          </View>
          <Text style={styles.srowLabel}>Nur Minimal</Text>
          <Text style={styles.srowValue}>v1.0.0</Text>
        </View>
      </Card>

      <Text style={styles.settingsSectionTitle}>DATA</Text>
      <Card>
        <TouchableOpacity style={styles.srow} onPress={onResetData}>
          <View style={[styles.srowIcon, { backgroundColor: 'rgba(107,114,128,0.1)' }]}>
            <Ionicons name="trash-outline" size={16} color={C.textSecondary} />
          </View>
          <View style={styles.srowLeft}>
            <Text style={styles.srowLabel}>Reset Local Data</Text>
            <Text style={styles.srowSub}>Clear settings and prayer tracking from this device</Text>
          </View>
        </TouchableOpacity>
      </Card>
    </ScrollView>
    <OptionActionSheet<CalculationMethod>
      visible={optionSheet === 'method'}
      title="Calculation Method"
      subtitle="Choose the prayer-time convention used for your region."
      options={METHOD_OPTIONS}
      selectedValue={settings.calculationMethod}
      onClose={() => setOptionSheet(null)}
      onSelect={value => {
        onUpdate({ calculationMethod: value });
        setOptionSheet(null);
      }}
    />
    <OptionActionSheet<Madhab>
      visible={optionSheet === 'madhab'}
      title="Madhab"
      subtitle="This primarily affects the Asr calculation."
      options={MADHAB_OPTIONS}
      selectedValue={settings.madhab}
      onClose={() => setOptionSheet(null)}
      onSelect={value => {
        onUpdate({ madhab: value });
        setOptionSheet(null);
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  screenPadding: { paddingHorizontal: 20, paddingBottom: 128 },
  settingsHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 24, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 8, marginBottom: 2, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 22 }, android: { elevation: 5 } }) },
  settingsEyebrow: { fontSize: 11, fontWeight: '900', color: C.gold, letterSpacing: 1, textTransform: 'uppercase' },
  settingsTitle: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 29, fontWeight: '900', color: C.navy, marginTop: 4 },
  settingsSubtitle: { maxWidth: 230, fontSize: 13, lineHeight: 18, fontWeight: '600', color: C.textSecondary, marginTop: 5 },
  settingsHeroIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8E9', borderWidth: 1, borderColor: 'rgba(184,132,32,0.18)' },
  settingsSectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, paddingTop: 12, paddingBottom: 8 },
  srow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
  srowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  srowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  srowLeftStack: { flex: 1 },
  srowIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  srowLabel: { fontSize: 15, fontWeight: '500', color: C.textPrimary },
  srowSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  srowValue: { fontSize: 13, color: C.textMuted, marginRight: 8, fontWeight: '700' },
  brandMark: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  alarmAdjustRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  alarmPresetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  alarmPresetTitle: { fontSize: 13, fontWeight: '800', color: C.navy },
  alarmStepper: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 18, padding: 4, backgroundColor: 'rgba(7,26,53,0.04)' },
  stepperButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border },
  alarmStepperValue: { minWidth: 38, textAlign: 'center', fontSize: 12, fontWeight: '900', color: C.navy },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  presetChip: { minWidth: 44, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, backgroundColor: 'rgba(7,26,53,0.04)', borderWidth: 1, borderColor: C.border },
  presetChipActive: { backgroundColor: C.emerald, borderColor: C.emerald },
  presetChipText: { fontSize: 12, fontWeight: '800', color: C.textSecondary },
  presetChipTextActive: { color: C.bgSurface },
});
