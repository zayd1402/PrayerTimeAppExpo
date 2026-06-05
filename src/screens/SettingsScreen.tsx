import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, CalculationMethod, Madhab, AppSettings } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useSnackbar } from '../components/Snackbar';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { hasNotificationPermission, requestNotificationPermission } from '../services/NotificationService';

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

const METHODS: { value: CalculationMethod; label: string; desc: string }[] = [
  { value: 'muslim_world_league',   label: 'Muslim World League',    desc: 'Fajr 18° · Isha 17°' },
  { value: 'isna',                  label: 'ISNA',                   desc: 'Fajr 15° · Isha 15°' },
  { value: 'egyptian',              label: 'Egyptian',               desc: 'Fajr 19.5° · Isha 17.5°' },
  { value: 'umm_al_qura',           label: 'Umm Al-Qura',            desc: 'Fajr 18.5° · Isha 90min' },
  { value: 'karachi',               label: 'Karachi',                desc: 'Fajr 18° · Isha 18°' },
  { value: 'dubai',                 label: 'Dubai',                  desc: 'Fajr 18.5° · Isha 90min' },
  { value: 'qatar',                 label: 'Qatar',                  desc: 'Fajr 18° · Isha 90min' },
  { value: 'kuwait',                label: 'Kuwait',                 desc: 'Fajr 18° · Isha 17.5°' },
  { value: 'moonsighting_committee',label: 'Moonsighting Committee', desc: 'Fajr 18° · Isha 18°' },
  { value: 'singapore',             label: 'Singapore',              desc: 'Fajr 20° · Isha 18°' },
  { value: 'tehran',                label: 'Tehran',                 desc: 'Fajr 17.7° · Isha 14°' },
  { value: 'north_america',         label: 'North America (ISNA)',   desc: 'Fajr 15° · Isha 15°' },
  { value: 'custom',                label: 'Custom',                 desc: 'Use defaults (MWL)' },
];

export default function SettingsScreen({ settings, updateSettings }: SettingsScreenProps) {
  const { c, type, radius } = useTheme();
  const { show } = useSnackbar();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [locationName, setLocationName] = useState(settings.locationName);

  useEffect(() => { setLocationName(settings.locationName); }, [settings.locationName]);

  const toggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    if (val) {
      const ok = await requestNotificationPermission();
      if (!ok) {
        show({ message: 'Notification permission denied', variant: 'error', icon: 'alert-circle' });
        setNotificationsEnabled(false);
      } else {
        show({ message: 'Notifications enabled', variant: 'success', icon: 'checkmark-circle' });
      }
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bgBase }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: c.heroBg, paddingTop: 60 }]}>
        <Text style={[type.headline, { color: c.onHero, fontSize: 22, fontWeight: '700' }]}>Settings</Text>
        <Text style={[type.body, { color: c.onDarkMuted, marginTop: 4 }]}>Preferences & calculation</Text>
      </View>

      {/* Theme */}
      <Text style={[type.caption, { color: c.textMuted, marginHorizontal: 18, marginTop: 18, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }]}>
        Appearance
      </Text>
      <View style={[styles.card, { backgroundColor: c.bgSurface, borderRadius: radius.md, marginHorizontal: 18, marginBottom: 12 }]}>
        <View style={[styles.row, { borderBottomColor: c.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { color: c.textPrimary }]}>Theme</Text>
            <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>Light, dark, or follow system</Text>
          </View>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0, paddingHorizontal: 16, paddingVertical: 12, gap: 8 }]}>
          <Chip label="Light"  selected={theme === 'light'}  onPress={() => setTheme('light')}  icon="sunny-outline" />
          <Chip label="Dark"   selected={theme === 'dark'}   onPress={() => setTheme('dark')}   icon="moon-outline" />
          <Chip label="System" selected={theme === 'system'} onPress={() => setTheme('system')} icon="phone-portrait-outline" />
        </View>
      </View>

      {/* Location */}
      <Text style={[type.caption, { color: c.textMuted, marginHorizontal: 18, marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }]}>
        Location
      </Text>
      <View style={[styles.card, { backgroundColor: c.bgSurface, borderRadius: radius.md, marginHorizontal: 18, marginBottom: 12 }]}>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { color: c.textPrimary }]}>Current Location</Text>
            <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]} numberOfLines={1}>{locationName}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open in maps"
            onPress={() => {
              const lat = settings.coordinate.latitude;
              const lng = settings.coordinate.longitude;
              const url = Platform.select({
                ios: `https://maps.apple.com/?ll=${lat},${lng}`,
                android: `geo:${lat},${lng}?q=${lat},${lng}`,
                default: `https://www.google.com/maps/@${lat},${lng},15z`,
              })!;
              Linking.openURL(url).catch(() => {});
            }}
          >
            <Ionicons name="map-outline" size={20} color={c.emerald} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calculation Method */}
      <Text style={[type.caption, { color: c.textMuted, marginHorizontal: 18, marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }]}>
        Calculation Method
      </Text>
      <View style={[styles.card, { backgroundColor: c.bgSurface, borderRadius: radius.md, marginHorizontal: 18, marginBottom: 12 }]}>
        {METHODS.map((method, i) => (
          <TouchableOpacity
            key={method.value}
            style={[styles.optionRow, { borderBottomWidth: i === METHODS.length - 1 ? 0 : 1, borderBottomColor: c.border }]}
            onPress={() => updateSettings({ method: method.value })}
            accessibilityRole="radio"
            accessibilityState={{ selected: settings.method === method.value }}
            accessibilityLabel={`${method.label}, ${method.desc}${settings.method === method.value ? ', selected' : ''}`}
          >
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { color: c.textPrimary, fontWeight: settings.method === method.value ? '700' : '500' }]}>
                {method.label}
              </Text>
              <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{method.desc}</Text>
            </View>
            {settings.method === method.value && (
              <Ionicons name="checkmark-circle" size={22} color={c.emerald} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Madhhab */}
      <Text style={[type.caption, { color: c.textMuted, marginHorizontal: 18, marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }]}>
        Madhhab (School of Thought)
      </Text>
      <View style={[styles.card, { backgroundColor: c.bgSurface, borderRadius: radius.md, marginHorizontal: 18, marginBottom: 12 }]}>
        {([
          { value: 'shafi',  label: 'Shafi',  desc: 'Standard Asr time' },
          { value: 'hanafi', label: 'Hanafi', desc: 'Later Asr time' },
        ] as const).map((m, i, arr) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.optionRow, { borderBottomWidth: i === arr.length - 1 ? 0 : 1, borderBottomColor: c.border }]}
            onPress={() => updateSettings({ madhhab: m.value })}
            accessibilityRole="radio"
            accessibilityState={{ selected: settings.madhhab === m.value }}
            accessibilityLabel={`${m.label}, ${m.desc}${settings.madhhab === m.value ? ', selected' : ''}`}
          >
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { color: c.textPrimary, fontWeight: settings.madhhab === m.value ? '700' : '500' }]}>
                {m.label}
              </Text>
              <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{m.desc}</Text>
            </View>
            {settings.madhhab === m.value && (
              <Ionicons name="checkmark-circle" size={22} color={c.emerald} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications */}
      <Text style={[type.caption, { color: c.textMuted, marginHorizontal: 18, marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }]}>
        Notifications
      </Text>
      <View style={[styles.card, { backgroundColor: c.bgSurface, borderRadius: radius.md, marginHorizontal: 18, marginBottom: 12 }]}>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { color: c.textPrimary }]}>Prayer alerts</Text>
            <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>Get notified at each prayer time</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ true: c.emerald, false: c.bgMuted }}
            accessibilityLabel="Toggle prayer notifications"
          />
        </View>
      </View>

      {/* About */}
      <Text style={[type.caption, { color: c.textMuted, marginHorizontal: 18, marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }]}>
        About
      </Text>
      <View style={[styles.card, { backgroundColor: c.bgSurface, borderRadius: radius.md, marginHorizontal: 18, marginBottom: 12 }]}>
        {[
          { label: 'Version', value: '1.0.0' },
          { label: 'Made with', value: '❤ for the Ummah' },
          { label: 'Open source', value: 'MIT License' },
        ].map((row, i, arr) => (
          <View
            key={row.label}
            style={[styles.row, { borderBottomWidth: i === arr.length - 1 ? 0 : 1, borderBottomColor: c.border }]}
          >
            <Text style={[type.body, { color: c.textPrimary, flex: 1 }]}>{row.label}</Text>
            <Text style={[type.body, { color: c.textMuted }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ padding: 40, alignItems: 'center' }}>
        <Text style={[type.caption, { color: c.textMuted }]}>PrayerTimeApp © 2024</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 18 },
  card: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
});
