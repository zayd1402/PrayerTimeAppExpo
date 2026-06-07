import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import { HijriService } from '../services/HijriService';
import { mmkv } from '../services/StorageService';
import {
  getRamadanState, getTodayJuz, calculateKhatmPlan, getNightVirtue
} from '../services/RamadanService';

const { width } = Dimensions.get('window');
const RAMADAN_LOG_KEY = '@prayertime:ramadan_log';
const RAMADAN_TARGET_KEY = '@prayertime:ramadan_targets';

interface RamadanDayLog {
  suhoor: boolean;
  fajrOnTime: boolean;
  taraweehRakahs: number;
  quranPages: number;
  charityGiven: number;
  iftarDuaDone: boolean;
  eveningAdhkar: boolean;
}

interface RamadanTargets {
  targetKhatms: number;
  dailyPages: number;
}

function getLog(): Record<string, RamadanDayLog> {
  const raw = mmkv.getString(RAMADAN_LOG_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveLog(log: Record<string, RamadanDayLog>): void {
  mmkv.set(RAMADAN_LOG_KEY, JSON.stringify(log));
}

function getTargets(): RamadanTargets {
  const raw = mmkv.getString(RAMADAN_TARGET_KEY);
  return raw ? JSON.parse(raw) : { targetKhatms: 1, dailyPages: 20 };
}

export default function RamadanScreen() {
  const [state, setState] = useState(getRamadanState());
  const [todayLog, setTodayLog] = useState<RamadanDayLog>({
    suhoor: false, fajrOnTime: false, taraweehRakahs: 0,
    quranPages: 0, charityGiven: 0, iftarDuaDone: false, eveningAdhkar: false,
  });
  const [targets, setTargets] = useState(getTargets());
  const [khatmTargetInput, setKhatmTargetInput] = useState(String(targets.targetKhatms));
  const [allLogs, setAllLogs] = useState<Record<string, RamadanDayLog>>({});

  const todayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const logs = getLog();
    setAllLogs(logs);
    if (logs[todayKey]) setTodayLog(logs[todayKey]);
    const interval = setInterval(() => setState(getRamadanState()), 60000);
    return () => clearInterval(interval);
  }, []);

  const updateLog = (updates: Partial<RamadanDayLog>) => {
    const next = { ...todayLog, ...updates };
    setTodayLog(next);
    const logs = { ...allLogs, [todayKey]: next };
    saveLog(logs);
    setAllLogs(logs);
  };

  const totalDaysLogged = Object.keys(allLogs).length;
  const completedDays = Object.values(allLogs).filter(
    d => d.suhoor && d.fajrOnTime && d.taraweehRakahs >= 8 && d.iftarDuaDone
  ).length;
  const totalQuran = Object.values(allLogs).reduce((s, d) => s + (d.quranPages || 0), 0);
  const totalCharity = Object.values(allLogs).reduce((s, d) => s + (d.charityGiven || 0), 0);
  const pagesPerDay = state.isRamadan ? calculateKhatmPlan(targets.targetKhatms, Math.max(1, 30 - state.ramadanDay + 1)).pagesPerDay : 20;
  const juzToday = state.isRamadan ? getTodayJuz(state.ramadanDay) : 0;
  const oddNight = state.isLast10Nights && [21, 23, 25, 27, 29].includes(state.ramadanDay);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Ramadan</Text>
        <Text style={styles.subtitle}>
          {state.isRamadan ? `Day ${state.ramadanDay} of ${state.totalDays}` :
           state.isPreRamadan ? `${state.daysUntilRamadan} day(s) until Ramadan` :
           state.isPostRamadan ? 'Shawwal — continue the good deeds' :
           `${state.daysUntilRamadan} days until Ramadan`}
        </Text>
      </View>

      {state.isRamadan && (
        <>
          {/* Daily Tracker Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Tracker</Text>
            <Text style={styles.cardSubtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>

            <TouchableOpacity style={styles.checkRow} onPress={() => updateLog({ suhoor: !todayLog.suhoor })}>
              <Ionicons name={todayLog.suhoor ? 'checkbox' : 'square-outline'} size={20} color={todayLog.suhoor ? C.primary : C.textMuted} />
              <Text style={[styles.checkLabel, todayLog.suhoor && styles.checkLabelDone]}>Suhoor (pre-dawn meal)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkRow} onPress={() => updateLog({ fajrOnTime: !todayLog.fajrOnTime })}>
              <Ionicons name={todayLog.fajrOnTime ? 'checkbox' : 'square-outline'} size={20} color={todayLog.fajrOnTime ? C.primary : C.textMuted} />
              <Text style={[styles.checkLabel, todayLog.fajrOnTime && styles.checkLabelDone]}>Fajr prayed on time</Text>
            </TouchableOpacity>

            <View style={styles.checkRow}>
              <Ionicons name="time-outline" size={20} color={C.gold} />
              <Text style={styles.checkLabel}>Taraweeh rakahs</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => taraweehRakahs > 0 && updateLog({ taraweehRakahs: todayLog.taraweehRakahs - 2 })}>
                  <Ionicons name="remove-circle" size={26} color={C.primary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{todayLog.taraweehRakahs}</Text>
                <TouchableOpacity onPress={() => todayLog.taraweehRakahs < 20 && updateLog({ taraweehRakahs: todayLog.taraweehRakahs + 2 })}>
                  <Ionicons name="add-circle" size={26} color={C.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.checkRow}>
              <Ionicons name="book-outline" size={20} color={C.gold} />
              <Text style={styles.checkLabel}>Quran pages read</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => todayLog.quranPages > 0 && updateLog({ quranPages: todayLog.quranPages - 1 })}>
                  <Ionicons name="remove-circle" size={26} color={C.primary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{todayLog.quranPages}</Text>
                <TouchableOpacity onPress={() => updateLog({ quranPages: todayLog.quranPages + 1 })}>
                  <Ionicons name="add-circle" size={26} color={C.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.checkRow}>
              <Ionicons name="heart-outline" size={20} color={C.gold} />
              <Text style={styles.checkLabel}>Charity given ($)</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => todayLog.charityGiven > 0 && updateLog({ charityGiven: todayLog.charityGiven - 1 })}>
                  <Ionicons name="remove-circle" size={26} color={C.primary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>${todayLog.charityGiven}</Text>
                <TouchableOpacity onPress={() => updateLog({ charityGiven: todayLog.charityGiven + 1 })}>
                  <Ionicons name="add-circle" size={26} color={C.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.checkRow} onPress={() => updateLog({ iftarDuaDone: !todayLog.iftarDuaDone })}>
              <Ionicons name={todayLog.iftarDuaDone ? 'checkbox' : 'square-outline'} size={20} color={todayLog.iftarDuaDone ? C.primary : C.textMuted} />
              <Text style={[styles.checkLabel, todayLog.iftarDuaDone && styles.checkLabelDone]}>Iftar dua recited</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkRow} onPress={() => updateLog({ eveningAdhkar: !todayLog.eveningAdhkar })}>
              <Ionicons name={todayLog.eveningAdhkar ? 'checkbox' : 'square-outline'} size={20} color={todayLog.eveningAdhkar ? C.primary : C.textMuted} />
              <Text style={[styles.checkLabel, todayLog.eveningAdhkar && styles.checkLabelDone]}>Evening adhkar</Text>
            </TouchableOpacity>
          </View>

          {/* Khatm Planner */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Khatm Progress</Text>
            <View style={styles.khatmProgress}>
              <View style={styles.khatmBar}>
                <View style={[styles.khatmFill, { width: `${Math.min((totalQuran / pagesPerDay / 30) * 100, 100)}%` }]} />
              </View>
              <Text style={styles.khatmText}>{Math.round(totalQuran / pagesPerDay)}/{targets.targetKhatms} khatm</Text>
            </View>
            <Text style={styles.khatmSubtext}>{totalQuran} pages read • target {pagesPerDay}/day</Text>
            <View style={styles.khatmInputRow}>
              <Text style={styles.juzLabel}>Target khatm:</Text>
              <TextInput
                style={styles.khatmInput}
                value={khatmTargetInput}
                onChangeText={setKhatmTargetInput}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={C.textMuted}
              />
              <TouchableOpacity
                style={styles.setBtn}
                onPress={() => {
                  const n = parseInt(khatmTargetInput, 10) || 1;
                  setTargets({ targetKhatms: n, dailyPages: pagesPerDay });
                  mmkv.set(RAMADAN_TARGET_KEY, JSON.stringify({ targetKhatms: n, dailyPages: pagesPerDay }));
                }}
              >
                <Text style={styles.setBtnText}>Set</Text>
              </TouchableOpacity>
            </View>
            {juzToday > 0 && (
              <Text style={styles.juzToday}>Today's Juz: <Text style={styles.juzHighlight}>Juz {juzToday}</Text></Text>
            )}
          </View>

          {/* Last 10 Nights Mode */}
          {state.isLast10Nights && (
            <View style={[styles.card, styles.last10Card]}>
              <Ionicons name="moon" size={24} color={C.gold} />
              <Text style={styles.last10Title}>Night {state.currentNight} of the Last 10</Text>
              {oddNight && (
                <Text style={styles.oddNightText}>🌙 Odd night — intensify your worship!</Text>
              )}
              <Text style={styles.virtueText}>{getNightVirtue(state.ramadanDay).label}</Text>
              <View style={styles.itiKafCheck}>
                <TouchableOpacity style={styles.checkRow} onPress={() => {}}>
                  <Ionicons name="square-outline" size={20} color={C.white} />
                  <Text style={[styles.checkLabel, { color: C.white }]}>I'tikaf intention made</Text>
                </TouchableOpacity>
                <Text style={styles.itiKafHint}>Even a few minutes in the masjid counts</Text>
              </View>
            </View>
          )}

          {/* Overall Progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ramadan Progress</Text>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{completedDays}</Text>
                <Text style={styles.statLabel}>complete days</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{totalQuran}</Text>
                <Text style={styles.statLabel}>pages read</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>${totalCharity}</Text>
                <Text style={styles.statLabel}>charity</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(completedDays / 30) * 100}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{completedDays}/30 days completed</Text>
          </View>
        </>
      )}

      {state.isPreRamadan && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pre-Ramadan Preparation</Text>
          {['Make intention to fast (niyyah)', 'Start fasting in Sha\'ban', 'Read Quran daily', 'Give extra charity', 'Forgive others', 'Plan your Ramadan goals'].map((item, i) => (
            <View key={i} style={styles.checkRow}>
              <Ionicons name="ellipse-outline" size={16} color={C.gold} />
              <Text style={styles.checkLabel}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {state.isPostRamadan && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Eid & Shawwal</Text>
          <View style={styles.checkRow}>
            <Ionicons name="gift-outline" size={20} color={C.gold} />
            <Text style={styles.checkLabel}>Eid al-Fitr — takbeerat & celebration</Text>
          </View>
          <View style={styles.checkRow}>
            <Ionicons name="calendar-outline" size={20} color={C.gold} />
            <Text style={styles.checkLabel}>6 days of Shawwal remaining: {state.eidDaysLeft}</Text>
          </View>
          <Text style={styles.postHint}>Whoever fasts Ramadan then follows it with 6 days of Shawwal, it is as if they fasted the entire year. (Muslim)</Text>
        </View>
      )}

      {/* Always show: dua for Ramadan */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ramadan Dua</Text>
        <Text style={styles.duaArabic}>اللَّهُمَّ بَارِكْ لَنَا فِي رَجَبَ وَشَعْبَانَ وَبَلِّغْنَا رَمَضَانَ</Text>
        <Text style={styles.duaText}>Allahumma barik lana fi Rajaba wa Sha'bana wa ballighna Ramadan</Text>
        <Text style={styles.duaMeaning}>"O Allah, bless us in Rajab and Sha'ban, and let us reach Ramadan"</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingBottom: 120 },
  header: { padding: 18, paddingTop: 60, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.goldPale },
  subtitle: { fontSize: 14, color: C.goldLight, fontFamily: 'Jost_400Regular', marginTop: 4 },

  card: {
    backgroundColor: C.surfaceElevated, borderRadius: 18, margin: 18, marginBottom: 10,
    padding: 18,
  },
  cardTitle: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: C.textMuted, marginBottom: 12 },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkLabel: { fontSize: 14, color: C.textSecondary, fontFamily: 'Jost_500Medium', flex: 1 },
  checkLabelDone: { color: C.textMuted, textDecorationLine: 'line-through' },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepperValue: { fontSize: 18, fontFamily: 'Jost_700Bold', color: C.textPrimary, minWidth: 30, textAlign: 'center' },

  khatmProgress: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  khatmBar: { flex: 1, height: 8, backgroundColor: C.border, borderRadius: 4 },
  khatmFill: { height: '100%', backgroundColor: C.gold, borderRadius: 4 },
  khatmText: { fontSize: 14, fontFamily: 'Jost_700Bold', color: C.gold },
  khatmSubtext: { fontSize: 12, color: C.textMuted, marginTop: 4 },
  khatmInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  khatmInput: { backgroundColor: C.bgBase, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 14, color: C.textPrimary, width: 50, textAlign: 'center' },
  setBtn: { backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  setBtnText: { fontSize: 12, fontFamily: 'Jost_700Bold', color: C.white },
  juzToday: { fontSize: 13, color: C.textSecondary, marginTop: 10 },
  juzHighlight: { fontFamily: 'Jost_700Bold', color: C.primary },
  juzLabel: { fontSize: 14, color: C.textSecondary },

  last10Card: { backgroundColor: C.heroBg, borderWidth: 1, borderColor: C.gold },
  last10Title: { fontSize: 18, fontFamily: 'BodoniModa_700Bold', color: C.goldPale, marginTop: 8 },
  oddNightText: { fontSize: 14, color: C.gold, marginTop: 4, fontFamily: 'Jost_700Bold' },
  virtueText: { fontSize: 13, color: C.goldLight, marginTop: 4 },
  itiKafCheck: { marginTop: 12 },
  itiKafHint: { fontSize: 11, color: C.textMuted, marginLeft: 30, marginTop: -4 },

  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: 'Jost_700Bold', color: C.gold },
  statLabel: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  progressBar: { height: 6, backgroundColor: C.border, borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: C.gold, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 6 },

  postHint: { fontSize: 12, color: C.textMuted, fontStyle: 'italic', marginTop: 8, lineHeight: 18 },

  duaArabic: { fontSize: 16, color: C.textPrimary, textAlign: 'right', lineHeight: 28, marginTop: 8 },
  duaText: { fontSize: 13, color: C.textSecondary, marginTop: 4, fontStyle: 'italic' },
  duaMeaning: { fontSize: 12, color: C.textMuted, marginTop: 2 },
});
