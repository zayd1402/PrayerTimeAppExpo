import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import { C, CalculationMethod, Madhab, AppSettings, PRAYER_IDS, PrayerNotificationId } from '../types';
import { useTranslation } from '../i18n';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { getCurrentLocation } from '../services/LocationService';
import { initAudio, playAdhan, stopAdhan, getAdhanAttribution, setAdhanVolume } from '../services/AudioService';
import { requestNotificationPermission } from '../services/NotificationService';
import { MANUAL_CITIES } from '../data/manualCities';

interface SettingsScreenProps {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void | Promise<void>;
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
const VOLUME_OPTIONS = [0.5, 0.75, 1];
const NOTIFICATION_PRAYERS = PRAYER_IDS.filter(id => id !== 'sunrise') as PrayerNotificationId[];

export default function SettingsScreen({ settings, updateSettings }: SettingsScreenProps) {
  const { t } = useTranslation();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const [manualSearch, setManualSearch] = useState('');

  const filteredCities = useMemo(() => {
    const normalized = manualSearch.trim().toLowerCase();
    if (!normalized) return MANUAL_CITIES;
    return MANUAL_CITIES.filter(city => city.name.toLowerCase().includes(normalized));
  }, [manualSearch]);

  const handleLocationDetect = useCallback(async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      await updateSettings({ location: loc });
      Alert.alert(t('settings.locationUpdated'), t('settings.locationSetTo', { name: loc.name }));
    } else {
      Alert.alert(t('settings.locationFailed'), t('settings.couldNotDetect'));
    }
  }, [updateSettings]);

  const handleNotificationsEnabled = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(t('settings.notificationsOff'), t('settings.notificationsOffMessage'));
        return;
      }
    }
    await updateSettings({ notificationsEnabled: enabled });
  };

  const handleRateApp = useCallback(async () => {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  }, []);

  const attribution = getAdhanAttribution();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.location')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="locate-outline" size={18} color={settings.location ? C.primary : C.textMuted} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('settings.deviceLocation')}</Text>
              <Text style={styles.rowSubtitle}>{settings.location?.source === 'device' ? settings.location.name : t('settings.notActive')}</Text>
            </View>
            <Switch
              value={settings.location?.source === 'device'}
              onValueChange={() => {
                if (settings.location?.source === 'device') {
                  updateSettings({ location: null });
                } else {
                  handleLocationDetect();
                }
              }}
              trackColor={{ true: C.primary }}
            />
          </View>

          <TouchableOpacity style={styles.row} onPress={handleLocationDetect}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="navigate-outline" size={18} color={C.primary} />
            </View>
            <Text style={styles.rowLabel}>{t('settings.useCurrentLocation')}</Text>
            <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
          </TouchableOpacity>

          <View style={styles.manualSearchWrap}>
            <Ionicons name="search" size={16} color={C.textMuted} />
            <TextInput
              style={styles.manualSearchInput}
              placeholder={t('settings.searchManualCity')}
              placeholderTextColor={C.textMuted}
              value={manualSearch}
              onChangeText={setManualSearch}
            />
          </View>

          {filteredCities.map(city => {
            const selected = settings.location?.name === city.name && settings.location?.source === 'manual-city';
            return (
              <TouchableOpacity
                key={city.name}
                style={[styles.manualCityRow, selected && styles.manualCityRowSelected]}
                onPress={() => updateSettings({ location: city })}
              >
                <View>
                  <Text style={[styles.manualCityName, selected && styles.manualCityNameSelected]}>{city.name}</Text>
                  <Text style={styles.manualCityMeta}>{city.timezone}</Text>
                </View>
                {selected && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.calculation')}</Text>
        <View style={styles.card}>
          {METHODS.map(method => (
            <TouchableOpacity
              key={method.value}
              style={styles.optionRow}
              onPress={() => updateSettings({ calculationMethod: method.value })}
            >
              <Text style={styles.optionLabel}>{method.label}</Text>
              {settings.calculationMethod === method.value && (
                <Ionicons name="checkmark-circle" size={20} color={C.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.madhhab')}</Text>
        <View style={styles.card}>
          {(['shafi', 'hanafi'] as Madhab[]).map(madhab => (
            <TouchableOpacity
              key={madhab}
              style={styles.optionRow}
              onPress={() => updateSettings({ madhab })}
            >
              <View>
                <Text style={styles.optionLabel}>{madhab === 'shafi' ? t('settings.shafi') : t('settings.hanafi')}</Text>
                <Text style={styles.optionSubtitle}>{madhab === 'shafi' ? t('settings.shafiSubtitle') : t('settings.hanafiSubtitle')}</Text>
              </View>
              {settings.madhab === madhab && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="notifications-outline" size={18} color={settings.notificationsEnabled ? C.primary : C.textMuted} />
            </View>
            <Text style={styles.rowLabel}>{t('settings.prayerAlerts')}</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleNotificationsEnabled}
              trackColor={{ true: C.primary }}
            />
          </View>

          {NOTIFICATION_PRAYERS.map(prayerId => (
            <View key={prayerId} style={styles.row}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="time-outline" size={18} color={settings.prayerNotifications[prayerId] ? C.primary : C.textMuted} />
              </View>
              <Text style={[styles.rowLabel, { textTransform: 'capitalize' }]}>{t(`prayer.${prayerId}`)}</Text>
              <Switch
                disabled={!settings.notificationsEnabled}
                value={settings.prayerNotifications[prayerId]}
                onValueChange={v => updateSettings({
                  prayerNotifications: { ...settings.prayerNotifications, [prayerId]: v },
                })}
                trackColor={{ true: C.primary }}
              />
            </View>
          ))}

          <View style={styles.row}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="alarm-outline" size={18} color={settings.fajrAlarmEnabled ? C.primary : C.textMuted} />
            </View>
            <Text style={styles.rowLabel}>{t('settings.fajrAlarm')}</Text>
            <Switch
              value={settings.fajrAlarmEnabled}
              onValueChange={v => updateSettings({ fajrAlarmEnabled: v })}
              trackColor={{ true: C.primary }}
            />
          </View>

          {settings.fajrAlarmEnabled && (
            <View style={styles.subRow}>
              <Text style={styles.rowLabel}>{t('settings.minutesBefore')}</Text>
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
            <View style={styles.rowIconWrap}>
              <Ionicons name="timer-outline" size={18} color={settings.liveCountdownEnabled ? C.primary : C.textMuted} />
            </View>
            <Text style={styles.rowLabel}>{t('settings.liveCountdown')}</Text>
            <Switch
              value={settings.liveCountdownEnabled}
              onValueChange={v => updateSettings({ liveCountdownEnabled: v })}
              trackColor={{ true: C.primary }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="time-outline" size={18} color={settings.iqamaCountdownEnabled ? C.primary : C.textMuted} />
            </View>
            <Text style={styles.rowLabel}>{t('settings.iqamaCountdown')}</Text>
            <Switch
              value={settings.iqamaCountdownEnabled}
              onValueChange={v => updateSettings({ iqamaCountdownEnabled: v })}
              trackColor={{ true: C.primary }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="volume-medium-outline" size={18} color={settings.adhanEnabled ? C.primary : C.textMuted} />
            </View>
            <Text style={styles.rowLabel}>{t('settings.adhanAudio')}</Text>
            <Switch
              value={settings.adhanEnabled}
              onValueChange={v => updateSettings({ adhanEnabled: v })}
              trackColor={{ true: C.primary }}
            />
          </View>

          {settings.adhanEnabled && (
            <View style={styles.subRow}>
              <Text style={styles.rowLabel}>{t('settings.adhanVolume')}</Text>
              <View style={styles.pillRow}>
                {VOLUME_OPTIONS.map(volume => (
                  <TouchableOpacity
                    key={volume}
                    style={[styles.pill, settings.adhanVolume === volume && styles.pillActive]}
                    onPress={async () => {
                      await setAdhanVolume(volume);
                      await updateSettings({ adhanVolume: volume });
                    }}
                  >
                    <Text style={[styles.pillText, settings.adhanVolume === volume && styles.pillTextActive]}>
                      {Math.round(volume * 100)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.previewBtn}
                onPress={async () => {
                  await initAudio();
                  await playAdhan(settings.adhanVariant);
                  setTimeout(() => stopAdhan(), 4000);
                }}
              >
                <Ionicons name="play" size={14} color={C.white} />
                <Text style={styles.previewBtnText}>{t('settings.adhanPreview')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.attribution}>
            <Ionicons name="information-circle-outline" size={16} color={C.textMuted} />
            <Text style={styles.attributionText}>
              {t('settings.adhanAttribution', { title: attribution.title, author: attribution.author, source: attribution.source, license: attribution.license })} 
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.theme')}</Text>
        <View style={styles.card}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map(option => (
            <TouchableOpacity
              key={option}
              style={styles.optionRow}
              onPress={() => setThemeMode(option)}
            >
              <Text style={styles.optionLabel}>{t(`settings.theme${option.charAt(0).toUpperCase() + option.slice(1)}`)}</Text>
              {themeMode === option && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.version')}</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://prayertime.app/privacy')}>
            <Text style={styles.rowLabel}>{t('settings.privacy')}</Text>
            <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={handleRateApp}>
            <Text style={styles.rowLabel}>{t('settings.rateApp')}</Text>
            <Ionicons name="star-outline" size={16} color={C.gold} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('settings.footer')}</Text>
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
    backgroundColor: C.heroBg,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Jost_700Bold',
    color: C.white,
  },
  subtitle: {
    fontSize: 13,
    color: C.goldLight,
    fontFamily: 'Jost_400Regular',
    marginTop: 4,
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
  rowIconWrap: { width: 28, justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1, marginLeft: 8 },
  rowLabel: {
    fontSize: 15,
    color: C.textPrimary,
    fontFamily: 'Jost_500Medium',
    flex: 1,
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
    fontSize: 15,
    color: C.textPrimary,
    fontFamily: 'Jost_500Medium',
  },
  optionSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  manualSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.bgBase,
  },
  manualSearchInput: { flex: 1, fontSize: 14, color: C.textPrimary },
  manualCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  manualCityRowSelected: { backgroundColor: C.goldPale },
  manualCityName: { fontSize: 14, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  manualCityNameSelected: { color: C.primary },
  manualCityMeta: { fontSize: 12, color: C.textMuted, marginTop: 2 },
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
  pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.borderStrong,
  },
  pillActive: { backgroundColor: C.primary, borderColor: C.primary },
  pillText: { fontSize: 12, fontFamily: 'Jost_600SemiBold', color: C.textSecondary },
  pillTextActive: { color: C.white },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  previewBtnText: { fontSize: 12, fontFamily: 'Jost_700Bold', color: C.white },
  attribution: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    backgroundColor: C.bgBase,
  },
  attributionText: { flex: 1, fontSize: 12, color: C.textMuted, lineHeight: 18 },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: C.textMuted,
  },
});
