import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../components/Card';
import { C, AppSettings } from '../types';
import { requestNotificationPermission } from '../services/NotificationService';

const METHOD_LABELS: Record<string, string> = {
  muslim_world_league: 'Islamic Society (MWL)',
  isna: 'ISNA',
  egyptian: 'Egyptian',
  umm_al_qura: 'Umm Al-Qura',
  karachi: 'Karachi (University)',
};

export function SettingsScreen({
  settings,
  onUpdate,
  onResetData,
}: {
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => void;
  onResetData: () => void;
}) {
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
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
      </Card>

      <Text style={styles.settingsSectionTitle}>CALCULATION</Text>
      <Card>
        <TouchableOpacity
          style={[styles.srow, styles.srowBorder]}
          onPress={() => {
            const methods = Object.keys(METHOD_LABELS);
            const current = methods.indexOf(settings.calculationMethod);
            Alert.alert(
              'Calculation Method',
              'Select your preferred calculation method',
              methods.map((m, i) => ({
                text: i === current ? `✓ ${METHOD_LABELS[m]}` : METHOD_LABELS[m],
                onPress: () => onUpdate({ calculationMethod: m as any }),
              }))
            );
          }}
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
          onPress={() => {
            Alert.alert('Madhab', 'Select your school of jurisprudence', [
              { text: 'Shafi ✓', onPress: () => onUpdate({ madhab: 'shafi' }) },
              { text: 'Hanafi', onPress: () => onUpdate({ madhab: 'hanafi' }) },
            ]);
          }}
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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  screenPadding: { paddingHorizontal: 20, paddingBottom: 16 },
  settingsHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 24, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, padding: 18, marginTop: 8, marginBottom: 4, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 22 }, android: { elevation: 5 } }) },
  settingsEyebrow: { fontSize: 11, fontWeight: '900', color: C.gold, letterSpacing: 1, textTransform: 'uppercase' },
  settingsTitle: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 29, fontWeight: '900', color: C.navy, marginTop: 4 },
  settingsSubtitle: { maxWidth: 230, fontSize: 13, lineHeight: 18, fontWeight: '600', color: C.textSecondary, marginTop: 5 },
  settingsHeroIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8E9', borderWidth: 1, borderColor: 'rgba(184,132,32,0.18)' },
  settingsSectionTitle: { fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, paddingVertical: 12 },
  srow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 18 },
  srowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  srowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  srowIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  srowLabel: { fontSize: 15, fontWeight: '500', color: C.textPrimary },
  srowSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  srowValue: { fontSize: 13, color: C.textMuted, marginRight: 8, fontWeight: '700' },
  brandMark: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
});
