// Journey: consistency first (a 30-day rate, never a streak), then the ladder from the five
// prayers to the extras, your habits, and the month of prayers kept.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { usePrayerApp } from '../context/PrayerAppContext';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { PrayerId } from '../types';
import { Glyph, GlyphName } from '../design/Glyph';
import { F, useHeatRamp } from '../design/palette';
import { FIVE } from '../design/dayState';
import { DayLog, PrayerLog, firstLoggedKey, monthCells, monthInsight, prayerRates, settledDays } from '../design/habits';
import { MiniRing, PageTitle, SectionLabel, tapHaptic } from '../design/ui';
import { CATEGORY_GLYPH, ConsistencyMeter, Ladder, MilestoneMoment, categoryColors } from '../design/habitsUi';
import {
  ANCHOR_NAMES, LADDER, MIN_METER_DAYS, STEP_OPENS_AT, consistencyNote, habitKept, ladder, milestoneDue, prayerConsistency, reflectionDay,
} from '../design/journey';
import { useHabits } from '../context/HabitsContext';
import HabitSheet, { HabitSheetState } from '../components/HabitSheet';
import ReflectionSheet from '../components/ReflectionSheet';
import { loadPrayerLog, loadReflections } from '../services/StorageService';
import { HijriService } from '../services/HijriService';
import { getLocalDateKey, getLocalDateFromKey } from '../utils/date';
import type { RootStackParamList } from '../navigation/routes';

const NAMES: Record<string, string> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ScaleKey({ showQaza = true }: { showQaza?: boolean }) {
  const C = useTokens();
  const heat = useHeatRamp();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.scaleKey}>
      <View style={styles.ramp}>
        <Text style={styles.keyText}>0</Text>
        {heat.fills.map(c => <View key={c} style={[styles.rampCell, { backgroundColor: c }]} />)}
        <Text style={styles.keyText}>5 prayers</Text>
      </View>
      {showQaza && (
        <View style={styles.ramp}>
          <View style={[styles.qazaDot, { borderColor: C.textMuted }]} />
          <Text style={styles.keyText}>had a qaza</Text>
        </View>
      )}
    </View>
  );
}

function DayDetail({ dateKey, day, nowMinutes, prayerMinutes }: {
  dateKey: string; day: DayLog | undefined; nowMinutes: number; prayerMinutes: Partial<Record<PrayerId, number>>;
}) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const date = getLocalDateFromKey(dateKey);
  const isToday = dateKey === getLocalDateKey();
  return (
    <View style={styles.day}>
      <Text style={styles.dayTitle}>{`${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}${isToday ? ', today' : ''}`}</Text>
      <View style={styles.pills}>
        {FIVE.map(id => {
          const s = day?.[id];
          const started = !isToday || (prayerMinutes[id] ?? 0) <= nowMinutes;
          let icon: GlyphName = 'dash';
          let word = 'Not logged';
          let circle = { backgroundColor: C.bgCard, borderColor: 'transparent', color: C.textMuted };
          if (s === 'prayed') { icon = 'check'; word = 'On time'; circle = { backgroundColor: C.primary, borderColor: C.primary, color: C.onPrimary }; }
          else if (s === 'qaza') { icon = 'redo'; word = 'Qaza'; circle = { backgroundColor: 'transparent', borderColor: C.qaza, color: C.qaza }; }
          else if (s === 'missed') { icon = 'dash'; word = 'Missed'; }
          else if (isToday && !started) { icon = 'clock'; word = 'Later'; }
          else if (isToday) { icon = 'clock'; word = 'Due now'; circle = { backgroundColor: 'transparent', borderColor: C.primary, color: C.primaryDark }; }
          return (
            <View key={id} style={styles.pill} accessible accessibilityLabel={`${NAMES[id]}, ${word}`}>
              <View style={[styles.pillCircle, { backgroundColor: circle.backgroundColor, borderColor: circle.borderColor }]}>
                <Glyph name={icon} size={15} color={circle.color} strokeWidth={2.3} />
              </View>
              <Text style={styles.pillName}>{NAMES[id]}</Text>
              <Text style={styles.pillWord}>{word}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function JourneyScreen() {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const heat = useHeatRamp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const { prayerStatuses, prayerTimes } = usePrayerApp();
  const { habits, log: habitLog, ladderLevel, setLadderLevel, updateHabit } = useHabits();
  const [log, setLog] = useState<PrayerLog>({});
  const [habitSheet, setHabitSheet] = useState<HabitSheetState>(null);
  const [reflectFor, setReflectFor] = useState<string | null>(null);
  const [reflected, setReflected] = useState(false);
  const now = new Date();
  const todayKey = getLocalDateKey(now);
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(todayKey);
  const friday = reflectionDay(now);

  const load = useCallback(() => {
    loadPrayerLog().then(l => setLog(l as PrayerLog)).catch(() => {});
    if (friday) setReflected(!!loadReflections()[friday]);
  }, [friday]);

  useFocusEffect(load);

  // Today's entry comes from live state, so a tick on Today shows here straight away.
  const fullLog: PrayerLog = useMemo(() => ({ ...log, [todayKey]: prayerStatuses as DayLog }), [log, prayerStatuses, todayKey]);
  const consistency = useMemo(() => prayerConsistency(log, now), [log, todayKey]);
  const steps = useMemo(() => ladder(ladderLevel, habits, fullLog, habitLog, now), [ladderLevel, habits, fullLog, habitLog, todayKey]);
  useEffect(() => { if (steps.level > ladderLevel) setLadderLevel(steps.level); }, [steps.level, ladderLevel, setLadderLevel]);
  const milestone = useMemo(() => milestoneDue(habits, habitLog, now), [habits, habitLog, todayKey]);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const prayerMinutes = useMemo(() => {
    const m: Partial<Record<PrayerId, number>> = {};
    prayerTimes.forEach(p => { m[p.id as PrayerId] = p.minutes; });
    return m;
  }, [prayerTimes]);
  // The reflection opens after Jumu'ah, so from Dhuhr on Fridays.
  const reflectionOpen = !!friday && (prayerMinutes.dhuhr === undefined || nowMinutes >= prayerMinutes.dhuhr);

  const inner = width - 32;
  const cellGap = 5;
  const cell = Math.min(46, Math.floor((inner - cellGap * 6) / 7));
  const cells = monthCells(cursor.y, cursor.m, fullLog, now);
  const sinceKey = firstLoggedKey(log) ?? todayKey;
  const rates = prayerRates(settledDays(cursor.y, cursor.m, now, sinceKey), fullLog);
  const insight = monthInsight(rates, NAMES);
  const isCurrentMonth = cursor.y === now.getFullYear() && cursor.m === now.getMonth();
  const hFirst = HijriService.gregorianToHijri(new Date(cursor.y, cursor.m, 1));
  const hLast = HijriService.gregorianToHijri(new Date(cursor.y, cursor.m + 1, 0));
  const hijriSpan = hFirst.monthName === hLast.monthName
    ? `${hFirst.monthName} ${hFirst.year}`
    : `${hFirst.monthName} to ${hLast.monthName} ${hLast.year}`;

  const shiftMonth = (delta: number) => {
    tapHaptic();
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
    const cur = new Date();
    setSelected(d.getFullYear() === cur.getFullYear() && d.getMonth() === cur.getMonth() ? getLocalDateKey(cur) : getLocalDateKey(d));
  };

  const beginStep = (index: number) => {
    const def = LADDER[index];
    if (def.habits.length) setHabitSheet({ mode: 'add', drafts: def.habits, title: def.title });
  };

  const settled = consistency?.days ?? 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageTitle title="Journey" subtitle="Small and steady" />

        {milestone && (
          <MilestoneMoment
            days={milestone.kept}
            title={`Forty days of ${milestone.habit.title.charAt(0).toLowerCase()}${milestone.habit.title.slice(1)}`}
            body={`You kept it on ${milestone.kept} of the last 45 days. May Allah make it easy to continue.`}
            next={steps.rungs.find(r => r.state === 'current') ? `Next step: ${steps.rungs.find(r => r.state === 'current')!.title.toLowerCase()}` : undefined}
            onClose={() => updateHabit(milestone.habit.id, { milestoneSeen: true })}
          />
        )}

        {consistency ? (
          <ConsistencyMeter
            label="Five prayers on time"
            rate={consistency.rate}
            window={consistency.days < 30 ? `Last ${consistency.days} days` : 'Last 30 days'}
            trend={consistency.trend}
            note={consistencyNote(consistency)}
          />
        ) : (
          <View style={styles.emptyMeter}>
            <Text style={styles.emptyTitle}>Your 30-day rate starts after a week</Text>
            <Text style={styles.emptyNote}>
              {settled > 0 ? `${settled} of ${MIN_METER_DAYS} days so far. ` : ''}Tick your prayers on Today. A missed day lowers the rate a little; it never resets to zero.
            </Text>
          </View>
        )}

        {reflectionOpen && (
          <Pressable onPress={() => { tapHaptic(); setReflectFor(friday!); }} style={({ pressed }) => [styles.reflectRow, pressed && { backgroundColor: C.surfacePressed }]} accessibilityRole="button">
            <View style={styles.reflectIcon}><Glyph name="pen" size={18} color={C.gold} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trkTitle}>{reflected ? 'This week, written' : 'Look back on this week'}</Text>
              <Text style={styles.trkSub}>{reflected ? 'Private. Tap to read or change it' : 'Three short questions after Jumu’ah. Private'}</Text>
            </View>
            <Glyph name="right" size={16} color={C.textMuted} />
          </Pressable>
        )}

        <View style={{ gap: 10 }}>
          <SectionLabel>Your ladder</SectionLabel>
          <Ladder rungs={steps.rungs} onBegin={beginStep} />
          <Text style={styles.emptyNote}>Each step opens the next once it holds on {STEP_OPENS_AT} of the last 30 days. A step you reach stays reached.</Text>
        </View>

        <View style={{ gap: 8 }}>
          <View style={styles.mhead}>
            <SectionLabel>Your habits</SectionLabel>
            <Pressable onPress={() => { tapHaptic(); setHabitSheet({ mode: 'add', drafts: [] }); }} style={styles.addBtn} accessibilityRole="button" accessibilityLabel="Add a habit" hitSlop={4}>
              <Glyph name="plus" size={16} color={C.primaryDark} strokeWidth={2.2} />
              <Text style={styles.addText}>Add</Text>
            </Pressable>
          </View>
          {habits.length === 0 ? (
            <Text style={styles.emptyNote}>No habits yet. Start with one small thing after a prayer you already pray.</Text>
          ) : habits.map(h => {
            const k = habitKept(h, habitLog, now);
            const cat = categoryColors(C, h.category);
            return (
              <Pressable key={h.id} onPress={() => setHabitSheet({ mode: 'view', habitId: h.id })} style={({ pressed }) => [styles.trk, pressed && { backgroundColor: C.surfacePressed }]} accessibilityRole="button" accessibilityLabel={`${h.title}, after ${ANCHOR_NAMES[h.anchor]}, kept ${k.kept} of ${k.days} days`}>
                <View style={[styles.disc, { backgroundColor: cat.pale }]}><Glyph name={CATEGORY_GLYPH[h.category]} size={16} color={cat.ink} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trkTitle}>{h.title}</Text>
                  <Text style={styles.trkSub}>After {ANCHOR_NAMES[h.anchor]} · kept {k.kept} of {Math.max(1, k.days)} {Math.max(1, k.days) === 1 ? 'day' : 'days'}</Text>
                </View>
                <MiniRing progress={k.days ? k.kept / k.days : 0} color={cat.fill} size={30} stroke={4} />
              </Pressable>
            );
          })}
          <Pressable onPress={() => navigation.navigate('worship', { tab: 'dhikr' })} style={styles.linkLine} accessibilityRole="button">
            <Text style={styles.linkLineText}>Tasbih counter, Quran pages and fasts</Text>
            <Glyph name="right" size={14} color={C.primaryDark} />
          </Pressable>
        </View>

        <View style={{ gap: 12 }}>
          <View style={styles.mhead}>
            <View>
              <Text style={styles.mTitle}>{MONTHS[cursor.m]} {cursor.y}</Text>
              <Text style={styles.mSub}>{hijriSpan}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable onPress={() => shiftMonth(-1)} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Previous month">
                <Glyph name="left" size={18} color={C.textSecondary} />
              </Pressable>
              <Pressable onPress={() => !isCurrentMonth && shiftMonth(1)} style={[styles.navBtn, isCurrentMonth && { opacity: 0.4 }]} disabled={isCurrentMonth} accessibilityRole="button" accessibilityLabel="Next month">
                <Glyph name="right" size={18} color={C.textSecondary} />
              </Pressable>
            </View>
          </View>

          <View>
            <View style={[styles.calRow, { gap: cellGap }]}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={i} style={[styles.wd, { width: cell }]}>{d}</Text>
              ))}
            </View>
            <View style={[styles.calGrid, { gap: cellGap }]}>
              {cells.map((c, i) => {
                if (!c) return <View key={`e${i}`} style={{ width: cell, height: cell }} />;
                const on = c.key === selected;
                const fill = c.future ? 'transparent' : heat.fills[c.level];
                const ink = c.future ? C.textMuted : heat.inks[c.level];
                return (
                  <Pressable
                    key={c.key}
                    disabled={c.future}
                    onPress={() => { tapHaptic(); setSelected(c.key); }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on, disabled: c.future }}
                    accessibilityLabel={`${c.date} ${MONTHS[cursor.m]}, ${c.future ? 'upcoming' : `${c.level} of 5 prayers${c.qaza ? ', includes a qaza' : ''}`}`}
                    style={[
                      styles.calCell,
                      { width: cell, height: cell, backgroundColor: fill },
                      c.future && { borderWidth: 1, borderColor: C.border },
                      on && { borderWidth: 2, borderColor: C.textPrimary },
                    ]}
                  >
                    <Text style={[styles.calNum, { color: ink }, c.today && { fontFamily: F.semibold }]}>{c.date}</Text>
                    {c.qaza && <View style={[styles.qazaDot, styles.qazaDotCell, { borderColor: ink }]} />}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ScaleKey />
          {selected.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`) && (
            <DayDetail dateKey={selected} day={fullLog[selected]} nowMinutes={nowMinutes} prayerMinutes={prayerMinutes} />
          )}

          {rates[0]?.days >= 3 && (
            <>
              <SectionLabel style={{ marginTop: 4 }}>Each prayer on time this month</SectionLabel>
              <View style={{ gap: 9 }}>
                {rates.map(r => (
                  <View key={r.id} style={styles.barRow} accessible accessibilityLabel={`${NAMES[r.id]} ${r.pct} percent on time`}>
                    <Text style={styles.barName}>{NAMES[r.id]}</Text>
                    <View style={styles.barTrack}><View style={[styles.barFill, { width: `${r.pct}%` }]} /></View>
                    <Text style={styles.barPct}>{r.pct}%</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          {insight && (
            <View style={styles.insight}>
              <Text style={styles.insightText}><Text style={styles.insightLead}>{insight.lead} </Text>{insight.text}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <HabitSheet state={habitSheet} onClose={() => setHabitSheet(null)} />
      <ReflectionSheet dateKey={reflectFor} onClose={() => { setReflectFor(null); load(); }} />
    </SafeAreaView>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 16 },
  mhead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mTitle: { fontFamily: F.semibold, fontSize: 17, color: C.textPrimary },
  mSub: { fontFamily: F.body, fontSize: 12.5, color: C.textMuted, marginTop: 1 },
  navBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgSurface, alignItems: 'center', justifyContent: 'center' },
  calRow: { flexDirection: 'row', marginBottom: 6 },
  wd: { textAlign: 'center', fontFamily: F.body, fontSize: 11.5, color: C.textMuted },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  calNum: { fontFamily: F.medium, fontSize: 13, fontVariant: ['tabular-nums'] },
  qazaDot: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.4 },
  qazaDotCell: { position: 'absolute', top: 4, right: 4 },
  scaleKey: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  ramp: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rampCell: { width: 13, height: 13, borderRadius: 3 },
  keyText: { fontFamily: F.body, fontSize: 12, color: C.textMuted, marginHorizontal: 2 },
  day: { backgroundColor: C.bgSurface, borderRadius: 16, padding: 12, gap: 10 },
  dayTitle: { fontFamily: F.semibold, fontSize: 14, color: C.textPrimary, paddingLeft: 2 },
  pills: { flexDirection: 'row' },
  pill: { flex: 1, alignItems: 'center', gap: 2 },
  pillCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1.6, marginBottom: 3 },
  pillName: { fontFamily: F.medium, fontSize: 12, color: C.textSecondary },
  pillWord: { fontFamily: F.body, fontSize: 11, color: C.textMuted },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barName: { width: 64, fontFamily: F.body, fontSize: 13.5, color: C.textSecondary },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.bgCard, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: C.primary },
  barPct: { width: 40, textAlign: 'right', fontFamily: F.medium, fontSize: 13, color: C.textSecondary, fontVariant: ['tabular-nums'] },
  insight: { backgroundColor: C.goldPale, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14 },
  insightText: { fontFamily: F.body, fontSize: 13.5, lineHeight: 19, color: C.textSecondary },
  insightLead: { fontFamily: F.semibold, color: C.textPrimary },
  emptyNote: { fontFamily: F.body, fontSize: 13.5, lineHeight: 19, color: C.textMuted },
  trk: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bgSurface, borderRadius: 16, paddingVertical: 8, paddingLeft: 12, paddingRight: 8 },
  trkTitle: { fontFamily: F.semibold, fontSize: 15, color: C.textPrimary },
  trkSub: { fontFamily: F.body, fontSize: 12.5, color: C.textMuted, marginTop: 1 },
  disc: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyMeter: { backgroundColor: C.bgSurface, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16, gap: 4 },
  emptyTitle: { fontFamily: F.semibold, fontSize: 15, color: C.textPrimary },
  reflectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.goldPale, borderRadius: 16, paddingVertical: 10, paddingLeft: 12, paddingRight: 12, minHeight: 56 },
  reflectIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.bgBase, alignItems: 'center', justifyContent: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: C.primaryLight },
  addText: { fontFamily: F.semibold, fontSize: 13, color: C.primaryDark },
  linkLine: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40, alignSelf: 'flex-start' },
  linkLineText: { fontFamily: F.medium, fontSize: 13.5, color: C.primaryDark },
});
