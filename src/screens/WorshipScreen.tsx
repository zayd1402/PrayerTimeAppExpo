import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, Dimensions, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useSnackbar } from '../components/Snackbar';
import { BottomSheet, SheetAction } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import {
  loadFastingLog, toggleFast, loadQuranLog, addQuranLog,
  loadDhikrHistory, addDhikrSession, getTodayDhikrCount,
  getWeeklyQuranStats
} from '../services/StorageService';

const { width } = Dimensions.get('window');

type WorshipTab = 'prayers' | 'dhikr' | 'fasting' | 'quran';

const TABS: { id: WorshipTab; label: string; icon: string }[] = [
  { id: 'prayers', label: 'Prayers', icon: 'hand-left-outline' },
  { id: 'dhikr', label: 'Dhikr', icon: 'rose-outline' },
  { id: 'fasting', label: 'Fasting', icon: 'water-outline' },
  { id: 'quran', label: 'Quran', icon: 'book-outline' },
];

const SUNNAH_TRACKER = [
  { id: 'fajr-sunnah', name: 'Fajr Sunnah', rakah: 2, time: 'before' },
  { id: 'dhuhr-sunnah', name: 'Dhuhr Sunnah', rakah: 4, time: 'before' },
  { id: 'dhuhr-nafl', name: 'Dhuhr Nafl', rakah: 2, time: 'after' },
  { id: 'asr-sunnah', name: 'Asr Sunnah', rakah: 4, time: 'before' },
  { id: 'maghrib-sunnah', name: 'Maghrib Sunnah', rakah: 2, time: 'after' },
  { id: 'isha-sunnah', name: 'Isha Sunnah', rakah: 2, time: 'before' },
  { id: 'witr', name: 'Witr', rakah: 3, time: 'after' },
  { id: 'tahajjud', name: 'Tahajjud', rakah: 2, time: 'night' },
  { id: 'duha', name: 'Duha Prayer', rakah: 2, time: 'morning' },
  { id: 'taraweeh', name: 'Taraweeh', rakah: 8, time: 'ramadan' },
];

const FASTING_TYPES = [
  { id: 'monday', label: 'Monday Fast', type: 'monday' as const, icon: 'today-outline', desc: 'Sunnah fasting on Monday' },
  { id: 'thursday', label: 'Thursday Fast', type: 'thursday' as const, icon: 'today-outline', desc: 'Sunnah fasting on Thursday' },
  { id: 'white_days', label: 'White Days', type: 'white_days' as const, icon: 'moon-outline', desc: '13th, 14th, 15th of Hijri month' },
  { id: 'ashura', label: 'Ashura (10 Muharram)', type: 'ashura' as const, icon: 'flame-outline', desc: '10th of Muharram' },
  { id: 'arafah', label: 'Arafah (9 Dhul Hijjah)', type: 'arafah' as const, icon: 'flame-outline', desc: '9th of Dhul Hijjah' },
  { id: 'makeup', label: 'Make-up Fast', type: 'makeup' as const, icon: 'refresh-outline', desc: 'Missed Ramadan fasts' },
];

function TabBar({ active, onChange }: { active: WorshipTab; onChange: (t: WorshipTab) => void }) {
  const { c, type, radius } = useTheme();
  return (
    <View
      style={[tabStyles.container, { backgroundColor: c.bgSurface, borderRadius: radius.lg, margin: 18, marginBottom: 12, padding: 4 }]}
      accessibilityRole="tablist"
    >
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[tabStyles.tab, isActive && { backgroundColor: c.emerald, borderRadius: 12 }]}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons name={tab.icon as any} size={18} color={isActive ? '#FFF' : c.textSecondary} />
            <Text style={[type.label, { color: isActive ? '#FFF' : c.textSecondary, marginTop: 3, fontWeight: isActive ? '700' : '500' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
});

function DhikrRing({ target, current, label, color, onPress }: { target: number; current: number; label: string; color: string; onPress: () => void }) {
  const { c, type, radius } = useTheme();
  const progress = Math.min(current / target, 1);
  return (
    <TouchableOpacity
      style={{ alignItems: 'center', marginHorizontal: 8 }}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${current} of ${target}`}
    >
      <View
        style={[
          { width: 80, height: 80, borderRadius: 40, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
          { borderColor: progress >= 1 ? color : c.bgMuted },
        ]}
      >
        <Text style={[type.title, { color: progress >= 1 ? color : c.textPrimary, fontSize: 22, fontWeight: '700' }]}>{current}</Text>
        <Text style={[type.caption, { color: c.textMuted }]}>/{target}</Text>
      </View>
      <Text style={[type.label, { color: c.textSecondary, fontWeight: '600' }]}>{label}</Text>
      {progress >= 1 && (
        <View style={[{ position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: color }]}>
          <Ionicons name="checkmark" size={10} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

function WeeklyChart({ data, label, color }: { data: number[]; label: string; color: string }) {
  const { c, type, radius } = useTheme();
  const max = Math.max(...data, 1);
  const days = ['S','M','T','W','T','F','S'];
  return (
    <View
      style={[chartStyles.container, { backgroundColor: c.bgSurface, borderRadius: radius.lg, padding: 16, marginHorizontal: 18, marginBottom: 12 }]}
      accessibilityLabel={`${label}: max ${max}`}
    >
      <Text style={[type.label, { color: c.textPrimary, fontWeight: '700', marginBottom: 12 }]}>{label}</Text>
      <View style={chartStyles.bars}>
        {data.map((v, i) => (
          <View key={i} style={chartStyles.barWrap}>
            <View style={[chartStyles.barTrack, { backgroundColor: c.bgMuted }]}>
              <View style={[chartStyles.bar, { height: `${(v / max) * 100}%`, backgroundColor: color }]} />
            </View>
            <Text style={[type.caption, { color: c.textMuted, marginTop: 6, fontSize: 10 }]}>{days[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {},
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80 },
  barWrap: { alignItems: 'center', flex: 1 },
  barTrack: { width: 8, height: 60, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: 8, borderRadius: 4 },
});

export default function WorshipScreen() {
  const { c, type, radius } = useTheme();
  const { show } = useSnackbar();
  const [activeTab, setActiveTab] = useState<WorshipTab>('prayers');
  const [completedSunnah, setCompletedSunnah] = useState<Set<string>>(new Set());
  const [dhikr, setDhikr] = useState({ subhanallah: 0, alhamdulillah: 0, allahuakbar: 0 });
  const [fastingLog, setFastingLog] = useState<Record<string, any>>({});
  const [quranLog, setQuranLog] = useState<Record<string, any>>({});
  const [quranInput, setQuranInput] = useState('');
  const [weeklyQuran, setWeeklyQuran] = useState<number[]>([0,0,0,0,0,0,0]);
  const [refreshing, setRefreshing] = useState(false);
  const [resetSheet, setResetSheet] = useState(false);
  const todayKey = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    const [fl, ql, wc] = await Promise.all([
      loadFastingLog(), loadQuranLog(), getWeeklyQuranStats(),
    ]);
    setFastingLog(fl);
    setQuranLog(ql);
    setWeeklyQuran(wc);
    const todayDhikr = await getTodayDhikrCount();
    setDhikr(todayDhikr);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Prayer Tab
  const toggleSunnah = (id: string) => {
    setCompletedSunnah(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Dhikr Tab
  const total = dhikr.subhanallah + dhikr.alhamdulillah + dhikr.allahuakbar;
  const increment = async (type: 'subhanallah' | 'alhamdulillah' | 'allahuakbar') => {
    setDhikr(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };
  const saveSession = async () => {
    if (total === 0) return;
    await addDhikrSession({
      id: Date.now().toString(),
      date: todayKey,
      subhanallah: dhikr.subhanallah,
      alhamdulillah: dhikr.alhamdulillah,
      allahuakbar: dhikr.allahuakbar,
    });
    show({ message: `Recorded ${total} dhikr`, variant: 'success', icon: 'checkmark-circle' });
  };

  // Fasting Tab
  const isFastToday = (type: string) => fastingLog[todayKey]?.type === type;
  const toggleFastType = async (type: any) => {
    const log = await toggleFast(todayKey, type);
    setFastingLog(log);
    const ft = FASTING_TYPES.find(f => f.type === type);
    show({ message: ft ? `${ft.label} ${isFastToday(type) ? 'unmarked' : 'marked'}` : 'Updated', icon: 'water-outline' });
  };

  // Quran Tab
  const todayPages = quranLog[todayKey]?.pagesRead || 0;
  const addPages = async () => {
    const pages = parseInt(quranInput, 10);
    if (isNaN(pages) || pages <= 0) return;
    const entry = { date: todayKey, pagesRead: todayPages + pages };
    const log = await addQuranLog(entry);
    setQuranLog(log);
    setQuranInput('');
    const wc = await getWeeklyQuranStats();
    setWeeklyQuran(wc);
    show({ message: `Added ${pages} pages`, variant: 'success', icon: 'book' });
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bgBase }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} colors={[c.emerald]} />}
      >
        <View style={[styles.header, { backgroundColor: c.heroBg, paddingTop: 60 }]}>
          <Text style={[type.headline, { color: c.onHero, fontSize: 22, fontWeight: '700' }]}>Worship Tracker</Text>
          <Text style={[type.body, { color: c.onDarkMuted, marginTop: 4 }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        <TabBar active={activeTab} onChange={setActiveTab} />

        {activeTab === 'prayers' && (
          <>
            <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 18, marginBottom: 10 }]}>
              Sunnah & Optional Prayers
            </Text>
            <View style={[styles.sunnahGrid]}>
              {SUNNAH_TRACKER.map(item => {
                const completed = completedSunnah.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.sunnahCard,
                      {
                        backgroundColor: completed ? c.emeraldPale : c.bgSurface,
                        borderRadius: radius.lg,
                        width: (width - 56) / 2,
                      },
                    ]}
                    onPress={() => toggleSunnah(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: completed }}
                    accessibilityLabel={`${item.name}, ${item.rakah} rakah, ${item.time}${completed ? ', completed' : ''}`}
                  >
                    <View style={[
                      styles.sunnahIconWrap,
                      { backgroundColor: completed ? c.emerald : c.bgMuted, borderRadius: 10 },
                    ]}>
                      {completed ? (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      ) : (
                        <Text style={[type.label, { color: c.textSecondary, fontWeight: '700' }]}>{item.rakah}</Text>
                      )}
                    </View>
                    <Text style={[type.label, { color: completed ? c.emerald : c.textPrimary, fontWeight: '600' }]}>{item.name}</Text>
                    <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{item.time} • {item.rakah} rakah</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {activeTab === 'dhikr' && (
          <>
            <View style={[styles.dhikrHeader, { paddingHorizontal: 18 }]}>
              <Text style={[type.display, { color: c.emerald, fontSize: 56, fontWeight: '700' }]}>{total}</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setResetSheet(true)} accessibilityRole="button" accessibilityLabel="Reset dhikr">
                  <Text style={[type.label, { color: c.textMuted, fontWeight: '600' }]}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveSession} accessibilityRole="button" accessibilityLabel="Save dhikr session">
                  <Text style={[type.label, { color: c.emerald, fontWeight: '600' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[type.body, { color: c.textMuted, paddingHorizontal: 18, marginBottom: 16 }]}>total dhikr today</Text>

            <View style={[styles.dhikrRings]}>
              <DhikrRing target={33} current={dhikr.subhanallah} label="SubhanAllah" color={c.blue} onPress={() => increment('subhanallah')} />
              <DhikrRing target={33} current={dhikr.alhamdulillah} label="Alhamdulillah" color={c.emerald} onPress={() => increment('alhamdulillah')} />
              <DhikrRing target={34} current={dhikr.allahuakbar} label="Allahu Akbar" color={c.gold} onPress={() => increment('allahuakbar')} />
            </View>

            <WeeklyChart data={[dhikr.subhanallah, dhikr.alhamdulillah, dhikr.allahuakbar, 0, 0, 0, 0]} label="Today's Breakdown" color={c.emerald} />
          </>
        )}

        {activeTab === 'fasting' && (
          <>
            <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 18, marginBottom: 10 }]}>
              Today's Fast
            </Text>
            <View style={[styles.fastGrid]}>
              {FASTING_TYPES.map(ft => {
                const active = isFastToday(ft.type);
                return (
                  <TouchableOpacity
                    key={ft.id}
                    style={[
                      styles.fastCard,
                      {
                        backgroundColor: active ? c.emeraldPale : c.bgSurface,
                        borderColor: active ? c.emerald : 'transparent',
                        borderRadius: radius.lg,
                      },
                    ]}
                    onPress={() => toggleFastType(ft.type)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={`${ft.label}: ${ft.desc}${active ? ', marked' : ''}`}
                  >
                    <Ionicons name={ft.icon as any} size={24} color={active ? c.emerald : c.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={[type.body, { color: active ? c.emerald : c.textPrimary, fontWeight: '600' }]}>{ft.label}</Text>
                      <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{ft.desc}</Text>
                    </View>
                    {active && (
                      <View style={[styles.fastCheck, { backgroundColor: c.emerald }]}>
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.ramadanCard, { backgroundColor: c.goldPale, borderRadius: radius.lg, margin: 18, marginTop: 24 }]}>
              <Ionicons name="moon" size={28} color={c.gold} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[type.body, { color: c.gold, fontWeight: '700' }]}>Ramadan Countdown</Text>
                <Text style={[type.caption, { color: c.textSecondary, marginTop: 2 }]}>Coming soon — track your Ramadan progress</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'quran' && (
          <>
            <View style={[styles.quranSummary, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, padding: 20, marginTop: 8 }]}>
              <View style={styles.quranStat}>
                <Text style={[type.display, { color: c.gold, fontSize: 32, fontWeight: '700' }]}>{todayPages}</Text>
                <Text style={[type.caption, { color: c.textMuted, marginTop: 4 }]}>Pages Today</Text>
              </View>
              <View style={[styles.quranDivider, { backgroundColor: c.border }]} />
              <View style={styles.quranStat}>
                <Text style={[type.display, { color: c.gold, fontSize: 32, fontWeight: '700' }]}>{weeklyQuran.reduce((a,b)=>a+b,0)}</Text>
                <Text style={[type.caption, { color: c.textMuted, marginTop: 4 }]}>This Week</Text>
              </View>
            </View>

            <WeeklyChart data={weeklyQuran} label="Weekly Reading" color={c.gold} />

            <View style={[styles.quranInputWrap, { marginHorizontal: 18, marginTop: 16 }]}>
              <TextInput
                style={[styles.quranInput, { backgroundColor: c.bgSurface, borderRadius: 14, color: c.textPrimary }]}
                placeholder="Pages read..."
                placeholderTextColor={c.textMuted}
                keyboardType="number-pad"
                value={quranInput}
                onChangeText={setQuranInput}
                accessibilityLabel="Pages read input"
              />
              <TouchableOpacity
                style={[styles.quranAddBtn, { backgroundColor: c.gold, borderRadius: 14 }]}
                onPress={addPages}
                accessibilityRole="button"
                accessibilityLabel="Add pages"
              >
                <Ionicons name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Reset dhikr confirmation */}
      <BottomSheet
        visible={resetSheet}
        onClose={() => setResetSheet(false)}
        title="Reset Dhikr"
        subtitle="This will clear all counters for today."
      >
        <SheetAction
          label="Reset counters"
          icon="refresh"
          variant="destructive"
          description="Clears subhanallah, alhamdulillah, allahuakbar"
          onPress={() => { setDhikr({ subhanallah: 0, alhamdulillah: 0, allahuakbar: 0 }); setResetSheet(false); show({ message: 'Dhikr counters reset' }); }}
        />
        <SheetAction
          label="Cancel"
          icon="close"
          onPress={() => setResetSheet(false)}
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  header: { padding: 18 },
  sunnahGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 10 },
  sunnahCard: { padding: 14 },
  sunnahIconWrap: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  dhikrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  dhikrRings: { flexDirection: 'row', justifyContent: 'center', marginVertical: 12 },
  fastGrid: { paddingHorizontal: 18, gap: 10 },
  fastCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderWidth: 1.5 },
  fastCheck: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  ramadanCard: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  quranSummary: { flexDirection: 'row' },
  quranStat: { flex: 1, alignItems: 'center' },
  quranDivider: { width: 1, marginHorizontal: 12 },
  quranInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quranInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  quranAddBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
});
