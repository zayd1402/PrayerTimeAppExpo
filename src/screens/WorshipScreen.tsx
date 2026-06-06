import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import {
  loadFastingLog, toggleFast, loadQuranLog, addQuranLog,
  loadDhikrHistory, addDhikrSession, getTodayDhikrCount,
  getWeeklyQuranStats
} from '../services/StorageService';

const { width } = Dimensions.get('window');

// ─── Tab Types ───────────────────────────────────────────────
type WorshipTab = 'prayers' | 'dhikr' | 'fasting' | 'quran';

const TABS: { id: WorshipTab; label: string; icon: string }[] = [
  { id: 'prayers', label: 'Prayers', icon: 'hand-left-outline' },
  { id: 'dhikr', label: 'Dhikr', icon: 'rose-outline' },
  { id: 'fasting', label: 'Fasting', icon: 'water-outline' },
  { id: 'quran', label: 'Quran', icon: 'book-outline' },
];

// ─── Sunna Prayers ───────────────────────────────────────────
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

// ─── Fasting Types ───────────────────────────────────────────
const FASTING_TYPES = [
  { id: 'monday', label: 'Monday Fast', type: 'monday' as const, icon: 'today-outline', desc: 'Sunnah fasting on Monday' },
  { id: 'thursday', label: 'Thursday Fast', type: 'thursday' as const, icon: 'today-outline', desc: 'Sunnah fasting on Thursday' },
  { id: 'white_days', label: 'White Days', type: 'white_days' as const, icon: 'moon-outline', desc: '13th, 14th, 15th of Hijri month' },
  { id: 'ashura', label: 'Ashura (10 Muharram)', type: 'ashura' as const, icon: 'flame-outline', desc: '10th of Muharram' },
  { id: 'arafah', label: 'Arafah (9 Dhul Hijjah)', type: 'arafah' as const, icon: 'flame-outline', desc: '9th of Dhul Hijjah' },
  { id: 'makeup', label: 'Make-up Fast', type: 'makeup' as const, icon: 'refresh-outline', desc: 'Missed Ramadan fasts' },
];

// ─── Helper Components ───────────────────────────────────────
function TabBar({ active, onChange }: { active: WorshipTab; onChange: (t: WorshipTab) => void }) {
  return (
    <View style={tabStyles.container}>
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[tabStyles.tab, isActive && tabStyles.tabActive]}
            onPress={() => onChange(tab.id)}
          >
            <Ionicons name={tab.icon as any} size={18} color={isActive ? '#FFF' : C.textSecondary} />
            <Text style={[tabStyles.tabLabel, isActive && tabStyles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: C.bgSurface, borderRadius: 16, margin: 18, marginBottom: 12, padding: 4},
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: C.coral },
  tabLabel: { fontSize: 11, color: C.textSecondary, marginTop: 3, fontFamily: 'Jost_500Medium' },
  tabLabelActive: { color: '#FFF', fontFamily: 'Jost_700Bold' }});

// ─── Dhikr Ring ──────────────────────────────────────────────
function DhikrRing({ target, current, label, color, onPress }: { target: number; current: number; label: string; color: string; onPress: () => void }) {
  const progress = Math.min(current / target, 1);
  return (
    <TouchableOpacity style={dhikrStyles.ringWrap} onPress={onPress} activeOpacity={0.8}>
      <View style={[dhikrStyles.ring, { borderColor: progress >= 1 ? color : '#EEE' }]}>
        <Text style={[dhikrStyles.count, { color: progress >= 1 ? color : C.textPrimary }]}>{current}</Text>
        <Text style={dhikrStyles.target}>/{target}</Text>
      </View>
      <Text style={dhikrStyles.label}>{label}</Text>
      {progress >= 1 && (
        <View style={[dhikrStyles.completedBadge, { backgroundColor: color }]}>
          <Ionicons name="checkmark" size={10} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const dhikrStyles = StyleSheet.create({
  ringWrap: { alignItems: 'center', marginHorizontal: 8 },
  ring: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  count: { fontSize: 22, fontFamily: 'Jost_700Bold' },
  target: { fontSize: 12, color: C.textMuted },
  label: { fontSize: 12, color: C.textSecondary, fontFamily: 'Jost_600SemiBold' },
  completedBadge: { position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }});

// ─── Weekly Chart ────────────────────────────────────────────
function WeeklyChart({ data, label, color }: { data: number[]; label: string; color: string }) {
  const max = Math.max(...data, 1);
  const days = ['S','M','T','W','T','F','S'];
  return (
    <View style={chartStyles.container}>
      <Text style={chartStyles.title}>{label}</Text>
      <View style={chartStyles.bars}>
        {data.map((v, i) => (
          <View key={i} style={chartStyles.barWrap}>
            <View style={chartStyles.barTrack}>
              <View style={[chartStyles.bar, { height: `${(v / max) * 100}%`, backgroundColor: color }]} />
            </View>
            <Text style={chartStyles.dayLabel}>{days[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { backgroundColor: C.bgSurface, borderRadius: 18, padding: 16, marginHorizontal: 18, marginBottom: 12 },
  title: { fontSize: 14, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginBottom: 12 },
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80 },
  barWrap: { alignItems: 'center', flex: 1 },
  barTrack: { width: 8, height: 60, backgroundColor: C.border, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: 8, borderRadius: 4 },
  dayLabel: { fontSize: 10, color: C.textMuted, marginTop: 6 }});

// ─── Main Screen ─────────────────────────────────────────────
export default function WorshipScreen() {
  const [activeTab, setActiveTab] = useState<WorshipTab>('prayers');
  const [completedSunnah, setCompletedSunnah] = useState<Set<string>>(new Set());
  const [dhikr, setDhikr] = useState({ subhanallah: 0, alhamdulillah: 0, allahuakbar: 0 });
  const [fastingLog, setFastingLog] = useState<Record<string, any>>({});
  const [quranLog, setQuranLog] = useState<Record<string, any>>({});
  const [quranInput, setQuranInput] = useState('');
  const [weeklyQuran, setWeeklyQuran] = useState<number[]>([0,0,0,0,0,0,0]);
  const todayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [fl, ql, wc] = await Promise.all([
      loadFastingLog(),
      loadQuranLog(),
      getWeeklyQuranStats()
    ]);
    setFastingLog(fl);
    setQuranLog(ql);
    setWeeklyQuran(wc);

    const todayDhikr = await getTodayDhikrCount();
    setDhikr(todayDhikr);
  };

  // ─── Prayer Tab ────────────────────────────────────────────
  function PrayerTab() {
    const toggleSunnah = (id: string) => {
      setCompletedSunnah(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    };

    return (
      <>
        <Text style={styles.sectionTitle}>Sunnah & Optional Prayers</Text>
        <View style={styles.sunnahGrid}>
          {SUNNAH_TRACKER.map(item => {
            const completed = completedSunnah.has(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.sunnahCard, completed && styles.sunnahCardCompleted]}
                onPress={() => toggleSunnah(item.id)}
              >
                <View style={[styles.sunnahIconWrap, completed && styles.sunnahIconWrapDone]}>
                  {completed ? (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  ) : (
                    <Text style={styles.sunnahRakahText}>{item.rakah}</Text>
                  )}
                </View>
                <Text style={[styles.sunnahName, completed && styles.sunnahNameDone]}>{item.name}</Text>
                <Text style={styles.sunnahTime}>{item.time} • {item.rakah} rakah</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </>
    );
  }

  // ─── Dhikr Tab ─────────────────────────────────────────────
  function DhikrTab() {
    const total = dhikr.subhanallah + dhikr.alhamdulillah + dhikr.allahuakbar;

    const increment = async (type: 'subhanallah' | 'alhamdulillah' | 'allahuakbar') => {
      setDhikr(prev => {
        const next = { ...prev, [type]: prev[type] + 1 };
        return next;
      });
    };

    const reset = () => {
      Alert.alert('Reset Dhikr', 'Clear all counters?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => setDhikr({ subhanallah: 0, alhamdulillah: 0, allahuakbar: 0 }) }
      ]);
    };

    const saveSession = async () => {
      if (total === 0) return;
      await addDhikrSession({
        id: Date.now().toString(),
        date: todayKey,
        subhanallah: dhikr.subhanallah,
        alhamdulillah: dhikr.alhamdulillah,
        allahuakbar: dhikr.allahuakbar});
      Alert.alert('Session Saved', `Recorded ${total} dhikr today`);
    };

    return (
      <>
        <View style={styles.dhikrHeader}>
          <Text style={styles.dhikrTotal}>{total}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={reset}><Text style={styles.dhikrAction}>Reset</Text></TouchableOpacity>
            <TouchableOpacity onPress={saveSession}><Text style={[styles.dhikrAction, { color: C.coral }]}>Save</Text></TouchableOpacity>
          </View>
        </View>
        <Text style={styles.dhikrSubtitle}>total dhikr today</Text>

        <View style={styles.dhikrRings}>
          <DhikrRing target={33} current={dhikr.subhanallah} label="SubhanAllah" color={C.gold} onPress={() => increment('subhanallah')} />
          <DhikrRing target={33} current={dhikr.alhamdulillah} label="Alhamdulillah" color={C.coral} onPress={() => increment('alhamdulillah')} />
          <DhikrRing target={34} current={dhikr.allahuakbar} label="Allahu Akbar" color={C.gold} onPress={() => increment('allahuakbar')} />
        </View>

        <WeeklyChart data={[dhikr.subhanallah, dhikr.alhamdulillah, dhikr.allahuakbar, 0, 0, 0, 0]} label="Today's Breakdown" color={C.coral} />
      </>
    );
  }

  // ─── Fasting Tab ───────────────────────────────────────────
  function FastingTab() {
    const isFastToday = (type: string) => fastingLog[todayKey]?.type === type;

    const toggle = async (type: any) => {
      const log = await toggleFast(todayKey, type);
      setFastingLog(log);
    };

    return (
      <>
        <Text style={styles.sectionTitle}>Today's Fast</Text>
        <View style={styles.fastGrid}>
          {FASTING_TYPES.map(ft => {
            const active = isFastToday(ft.type);
            return (
              <TouchableOpacity
                key={ft.id}
                style={[styles.fastCard, active && styles.fastCardActive]}
                onPress={() => toggle(ft.type)}
              >
                <Ionicons name={ft.icon as any} size={24} color={active ? C.coral : C.textMuted} />
                <Text style={[styles.fastLabel, active && styles.fastLabelActive]}>{ft.label}</Text>
                <Text style={styles.fastDesc}>{ft.desc}</Text>
                {active && <View style={styles.fastCheck}><Ionicons name="checkmark" size={12} color="#FFF" /></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ramadan countdown placeholder */}
        <View style={styles.ramadanCard}>
          <Ionicons name="moon" size={28} color={C.gold} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.ramadanTitle}>Ramadan Countdown</Text>
            <Text style={styles.ramadanText}>Coming soon — track your Ramadan progress</Text>
          </View>
        </View>
      </>
    );
  }

  // ─── Quran Tab ─────────────────────────────────────────────
  function QuranTab() {
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
    };

    return (
      <>
        <View style={styles.quranSummary}>
          <View style={styles.quranStat}>
            <Text style={styles.quranStatValue}>{todayPages}</Text>
            <Text style={styles.quranStatLabel}>Pages Today</Text>
          </View>
          <View style={styles.quranDivider} />
          <View style={styles.quranStat}>
            <Text style={styles.quranStatValue}>{weeklyQuran.reduce((a,b)=>a+b,0)}</Text>
            <Text style={styles.quranStatLabel}>This Week</Text>
          </View>
        </View>

        <WeeklyChart data={weeklyQuran} label="Weekly Reading" color={C.gold} />

        <View style={styles.quranInputWrap}>
          <TextInput
            style={styles.quranInput}
            placeholder="Pages read..."
            keyboardType="number-pad"
            value={quranInput}
            onChangeText={setQuranInput}
            placeholderTextColor={C.textMuted}
          />
          <TouchableOpacity style={styles.quranAddBtn} onPress={addPages}>
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Worship Tracker</Text>
        <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'prayers' && <PrayerTab />}
      {activeTab === 'dhikr' && <DhikrTab />}
      {activeTab === 'fasting' && <FastingTab />}
      {activeTab === 'quran' && <QuranTab />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingBottom: 120 },
  header: { padding: 18, paddingTop: 60, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.textPrimary },
  subtitle: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginHorizontal: 18, marginTop: 18, marginBottom: 10 },

  // Sunnah
  sunnahGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 10 },
  sunnahCard: {
    width: (width - 56) / 2,
    backgroundColor: C.surfaceElevated, borderRadius: 16, padding: 14,
    ...C.shadow.sm,
  },
  sunnahCardCompleted: { backgroundColor: C.primaryLight },
  sunnahIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F5F0', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  sunnahIconWrapDone: { backgroundColor: C.coral },
  sunnahRakahText: { fontSize: 13, fontFamily: 'Jost_700Bold', color: C.textSecondary },
  sunnahName: { fontSize: 14, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  sunnahNameDone: { color: C.coral },
  sunnahTime: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  // Dhikr
  dhikrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 18, marginTop: 8 },
  dhikrTotal: { fontSize: 56, fontFamily: 'BodoniModa_700Bold', color: C.coral },
  dhikrAction: { fontSize: 14, color: C.textMuted, fontFamily: 'Jost_600SemiBold' },
  dhikrSubtitle: { fontSize: 14, color: C.textMuted, paddingHorizontal: 18, marginBottom: 16 },
  dhikrRings: { flexDirection: 'row', justifyContent: 'center', marginVertical: 12 },

  // Fasting
  fastGrid: { paddingHorizontal: 18, gap: 10 },
  fastCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceElevated,
    borderRadius: 16, padding: 16, gap: 14,
    borderWidth: 1.5, borderColor: 'transparent',
    ...C.shadow.sm,
  },
  fastCardActive: { borderColor: C.coral, backgroundColor: C.primaryLight },
  fastLabel: { fontSize: 15, fontFamily: 'Jost_600SemiBold', color: C.textPrimary, flex: 1 },
  fastLabelActive: { color: C.coral },
  fastDesc: { fontSize: 12, color: C.textMuted, position: 'absolute', left: 54, bottom: 12 },
  fastCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.coral, justifyContent: 'center', alignItems: 'center' },
  ramadanCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.goldPale,
    borderRadius: 18, padding: 18, margin: 18, marginTop: 24,
    ...C.shadow.md,
  },
  ramadanTitle: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.gold },
  ramadanText: { fontSize: 13, color: C.textSecondary, marginTop: 2 },

  // Quran
  quranSummary: {
    flexDirection: 'row', backgroundColor: C.surfaceElevated, borderRadius: 18,
    marginHorizontal: 18, padding: 20, marginTop: 8,
    ...C.shadow.md,
  },
  quranStat: { flex: 1, alignItems: 'center' },
  quranStatValue: { fontSize: 32, fontFamily: 'Jost_700Bold', color: C.gold },
  quranStatLabel: { fontSize: 12, color: C.textMuted, marginTop: 4 },
  quranDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 12 },
  quranInputWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginTop: 16, gap: 10 },
  quranInput: { flex: 1, backgroundColor: C.bgSurface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.textPrimary },
  quranAddBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center' }});
