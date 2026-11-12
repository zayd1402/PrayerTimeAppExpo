// Habits: today's rings, then a heat map of prayers kept (month by default, or week or year),
// each prayer's on-time rate, one insight, and the other daily habits.
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { usePrayerApp } from '../context/PrayerAppContext';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { PrayerId } from '../types';
import { Glyph, GlyphName } from '../design/Glyph';
import { F, useHeatRamp } from '../design/palette';
import { FIVE } from '../design/dayState';
import {
  DayLog, PrayerLog, dayLevel, firstLoggedKey, monthCells, monthInsight, prayerRates, rangeStats, settledDays, yearGridKeys,
} from '../design/habits';
import { MiniRing, PageTitle, SectionLabel, Segmented, tapHaptic } from '../design/ui';
import {
  addQuranLog, getSunnahPrayersForDate, getTodayDhikrCount, loadFastingLog, loadPrayerLog, loadQuranLog, toggleFast,
} from '../services/StorageService';
import { HijriService } from '../services/HijriService';
import { getLocalDateKey, getLocalDateFromKey } from '../utils/date';
import type { RootStackParamList } from '../navigation/routes';

const NAMES: Record<string, string> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DHIKR_GOAL = 100;
const QURAN_GOAL = 4;

type Range = 'week' | 'month' | 'year';

function Rings({ prayers, dhikr, quran }: { prayers: number; dhikr: number; quran: number }) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const rings = [
    { r: 42, p: prayers / 5, color: C.primary, label: 'Prayers', value: `${prayers} of 5` },
    { r: 30, p: dhikr / DHIKR_GOAL, color: C.gold, label: 'Dhikr', value: `${dhikr} of ${DHIKR_GOAL}` },
    { r: 18, p: quran / QURAN_GOAL, color: C.quran, label: 'Quran', value: `${quran} of ${QURAN_GOAL} pages` },
  ];
  return (
    <View style={styles.rings} accessible accessibilityLabel={`Today: ${rings.map(r => `${r.label} ${r.value}`).join(', ')}`}>
      <Svg width={92} height={92} viewBox="0 0 96 96" style={{ transform: [{ rotate: '-90deg' }] }}>
        {rings.map(ring => {
          const circ = 2 * Math.PI * ring.r;
          const p = Math.max(0, Math.min(1, ring.p));
          return (
            <React.Fragment key={ring.r}>
              <Circle cx={48} cy={48} r={ring.r} stroke={C.bgCard} strokeWidth={9} fill="none" />
              {p > 0 && (
                <Circle cx={48} cy={48} r={ring.r} stroke={ring.color} strokeWidth={9} fill="none" strokeLinecap="round"
                  strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - p)} />
              )}
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={{ flex: 1, gap: 8 }}>
        {rings.map(ring => (
          <View key={ring.label} style={styles.ringRow}>
            <View style={[styles.ringDot, { backgroundColor: ring.color }]} />
            <Text style={styles.ringLabel}>{ring.label}</Text>
            <Text style={styles.ringValue}>{ring.value}</Text>
          </View>
        ))}
        <Text style={styles.ringCaption}>Today so far</Text>
      </View>
    </View>
  );
}

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

export default function HabitsScreen() {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const heat = useHeatRamp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const { prayerStatuses, prayerTimes } = usePrayerApp();
  const [range, setRange] = useState<Range>('month');
  const [log, setLog] = useState<PrayerLog>({});
  const [dhikr, setDhikr] = useState(0);
  const [quran, setQuran] = useState(0);
  const [fasted, setFasted] = useState(false);
  const [sunnahCount, setSunnahCount] = useState(0);
  const now = new Date();
  const todayKey = getLocalDateKey(now);
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(todayKey);

  const load = useCallback(() => {
    loadPrayerLog().then(l => setLog(l as PrayerLog)).catch(() => {});
    getTodayDhikrCount().then(d => setDhikr(d.subhanallah + d.alhamdulillah + d.allahuakbar)).catch(() => {});
    loadQuranLog().then(q => setQuran(q[getLocalDateKey()]?.pagesRead ?? 0)).catch(() => {});
    loadFastingLog().then(f => setFasted(!!f[getLocalDateKey()])).catch(() => {});
    setSunnahCount(getSunnahPrayersForDate(getLocalDateKey()).length);
  }, []);

  useFocusEffect(load);

  // Today's entry comes from live state, so a tick on Today shows here straight away.
  const fullLog: PrayerLog = useMemo(() => ({ ...log, [todayKey]: prayerStatuses as DayLog }), [log, prayerStatuses, todayKey]);
  const prayersToday = FIVE.filter(id => prayerStatuses[id] === 'prayed' || prayerStatuses[id] === 'qaza').length;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const prayerMinutes = useMemo(() => {
    const m: Partial<Record<PrayerId, number>> = {};
    prayerTimes.forEach(p => { m[p.id as PrayerId] = p.minutes; });
    return m;
  }, [prayerTimes]);

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

  const weeks = 26;
  const yCell = Math.floor((inner - (weeks - 1) * 2) / weeks);
  const yStep = (inner - yCell) / (weeks - 1);
  const yKeys = useMemo(() => yearGridKeys(weeks, now), [todayKey]);
  const yStats = rangeStats(yKeys, fullLog, now);
  const firstMonthKeys = yKeys.slice(0, 28);
  const lastMonthKeys = yKeys.slice(-35, -7);
  const firstStats = rangeStats(firstMonthKeys, fullLog, now);
  const lastStats = rangeStats(lastMonthKeys, fullLog, now);
  const delta = lastStats.onTimePct - firstStats.onTimePct;
  const monthLabels = useMemo(() => {
    const labels: { col: number; text: string }[] = [];
    let last = -1;
    for (let w = 0; w < weeks; w++) {
      const d = getLocalDateFromKey(yKeys[w * 7]);
      if (d.getMonth() !== last && d.getDate() <= 7) { labels.push({ col: w, text: MONTHS[d.getMonth()].slice(0, 3) }); last = d.getMonth(); }
    }
    return labels;
  }, [yKeys]);

  const weekKeys = Array.from({ length: 7 }, (_, i) => getLocalDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i)));

  const addPage = () => {
    tapHaptic();
    const next = quran + 1;
    setQuran(next);
    addQuranLog({ date: getLocalDateKey(), pagesRead: next }).catch(() => {});
  };
  const fastType = now.getDay() === 1 ? 'monday' : now.getDay() === 4 ? 'thursday' : 'custom';
  const logFast = () => {
    tapHaptic();
    setFasted(f => !f);
    toggleFast(getLocalDateKey(), fastType).catch(() => {});
  };

  const trackers: { title: string; sub: string; p: number; color: string; action: string; icon: GlyphName; onAdd: () => void; onOpen: () => void }[] = [
    { title: 'Tasbih', sub: `${dhikr} of ${DHIKR_GOAL} today`, p: dhikr / DHIKR_GOAL, color: C.gold, action: 'Open counter', icon: 'beads', onAdd: () => navigation.navigate('worship', { tab: 'dhikr' }), onOpen: () => navigation.navigate('worship', { tab: 'dhikr' }) },
    { title: 'Quran', sub: `${quran} of ${QURAN_GOAL} pages`, p: quran / QURAN_GOAL, color: C.quran, action: 'Add a page', icon: 'plus', onAdd: addPage, onOpen: () => navigation.navigate('worship', { tab: 'quran' }) },
    { title: fastType === 'custom' ? 'Fast' : `${WEEKDAYS[now.getDay()]} fast`, sub: fasted ? 'Logged for today' : fastType === 'custom' ? 'Voluntary' : 'Sunnah today', p: fasted ? 1 : 0, color: C.primary, action: fasted ? 'Undo fast' : 'Log fast', icon: fasted ? 'check' : 'plus', onAdd: logFast, onOpen: () => navigation.navigate('worship', { tab: 'fasting' }) },
    { title: 'Sunnah prayers', sub: `${sunnahCount} today`, p: Math.min(1, sunnahCount / 5), color: C.primary, action: 'Open sunnah prayers', icon: 'right', onAdd: () => navigation.navigate('worship', { tab: 'prayers' }), onOpen: () => navigation.navigate('worship', { tab: 'prayers' }) },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageTitle title="Habits" />
        <Rings prayers={prayersToday} dhikr={dhikr} quran={quran} />

        <Segmented<Range>
          value={range}
          onChange={setRange}
          options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }, { value: 'year', label: 'Year' }]}
        />

        {range === 'month' && (
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

            <SectionLabel style={{ marginTop: 4 }}>Each prayer on time this month</SectionLabel>
            {rates[0]?.days < 3 ? (
              <Text style={styles.emptyNote}>Tick your prayers on Today for a few days and each prayer's on-time rate shows up here.</Text>
            ) : (
            <View style={{ gap: 9 }}>
              {rates.map(r => (
                <View key={r.id} style={styles.barRow} accessible accessibilityLabel={`${NAMES[r.id]} ${r.pct} percent on time`}>
                  <Text style={styles.barName}>{NAMES[r.id]}</Text>
                  <View style={styles.barTrack}><View style={[styles.barFill, { width: `${r.pct}%` }]} /></View>
                  <Text style={styles.barPct}>{r.pct}%</Text>
                </View>
              ))}
            </View>
            )}
            {insight && (
              <View style={styles.insight}>
                <Text style={styles.insightText}><Text style={styles.insightLead}>{insight.lead} </Text>{insight.text}</Text>
              </View>
            )}
          </View>
        )}

        {range === 'week' && (
          <View style={{ gap: 10 }}>
            <View style={styles.mhead}>
              <View>
                <Text style={styles.mTitle}>Last 7 days</Text>
                <Text style={styles.mSub}>Filled is on time, outlined is qaza</Text>
              </View>
            </View>
            {weekKeys.map(k => {
              const d = getLocalDateFromKey(k);
              const day = fullLog[k];
              return (
                <View key={k} style={styles.weekRow} accessible accessibilityLabel={`${WEEKDAYS[d.getDay()]}, ${dayLevel(day)} of 5 prayers`}>
                  <View style={{ width: 64 }}>
                    <Text style={styles.weekDay}>{WEEKDAYS[d.getDay()].slice(0, 3)}</Text>
                    <Text style={styles.weekDate}>{d.getDate()} {MONTHS[d.getMonth()].slice(0, 3)}</Text>
                  </View>
                  <View style={styles.weekSegs}>
                    {FIVE.map(id => {
                      const st = day?.[id];
                      return (
                        <View key={id} style={[
                          styles.weekSeg,
                          st === 'prayed' && { backgroundColor: C.primary },
                          st === 'qaza' && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.qaza },
                        ]} />
                      );
                    })}
                  </View>
                  <Text style={styles.weekCount}>{dayLevel(day)}/5</Text>
                </View>
              );
            })}
          </View>
        )}

        {range === 'year' && (
          <View style={{ gap: 12 }}>
            <View style={styles.mhead}>
              <View>
                <Text style={styles.mTitle}>Last 6 months</Text>
                <Text style={styles.mSub}>One square per day</Text>
              </View>
            </View>
            <View>
              <View style={{ height: 16, marginBottom: 4 }}>
                {monthLabels.map(l => (
                  <Text key={l.col} style={[styles.yLabel, { left: l.col * yStep }]}>{l.text}</Text>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {Array.from({ length: weeks }, (_, w) => (
                  <View key={w} style={{ gap: 2 }}>
                    {yKeys.slice(w * 7, w * 7 + 7).map(k => (
                      <View key={k} style={{
                        width: yCell, height: yCell, borderRadius: 2,
                        backgroundColor: k > todayKey ? 'transparent' : heat.fills[dayLevel(fullLog[k])],
                      }} />
                    ))}
                  </View>
                ))}
              </View>
            </View>
            <ScaleKey showQaza={false} />
            <View style={styles.ystats}>
              <View style={styles.ystat}><Text style={styles.ystatNum}>{yStats.onTimePct}%</Text><Text style={styles.ystatLbl}>on time</Text></View>
              <View style={styles.ystat}><Text style={styles.ystatNum}>{yStats.fullDays}</Text><Text style={styles.ystatLbl}>full days</Text></View>
              <View style={styles.ystat}>
                <Text style={styles.ystatNum}>{firstStats.loggedDays ? `${delta >= 0 ? '+' : ''}${delta}%` : '–'}</Text>
                <Text style={styles.ystatLbl}>vs. {MONTHS[getLocalDateFromKey(yKeys[0]).getMonth()].slice(0, 3)}</Text>
              </View>
            </View>
            {yStats.loggedDays > 0 && (
              <View style={styles.insight}>
                <Text style={styles.insightText}>
                  {delta > 0
                    ? <><Text style={styles.insightLead}>A steady climb. </Text>More prayers on time now than six months ago.</>
                    : delta < 0
                      ? <><Text style={styles.insightLead}>A dip lately. </Text>Fewer on time than six months ago. Small steps: start with the prayer you miss most.</>
                      : <><Text style={styles.insightLead}>Holding steady. </Text>Keep logging to see your pattern.</>}
                </Text>
              </View>
            )}
          </View>
        )}

        <SectionLabel style={{ marginTop: 6 }}>Other habits</SectionLabel>
        <View style={{ gap: 8 }}>
          {trackers.map(t => (
            <Pressable key={t.title} onPress={t.onOpen} style={({ pressed }) => [styles.trk, pressed && { backgroundColor: C.surfacePressed }]} accessibilityRole="button" accessibilityLabel={`${t.title}, ${t.sub}`}>
              <MiniRing progress={t.p} color={t.color} />
              <View style={{ flex: 1 }}>
                <Text style={styles.trkTitle}>{t.title}</Text>
                <Text style={styles.trkSub}>{t.sub}</Text>
              </View>
              <Pressable onPress={t.onAdd} style={({ pressed }) => [styles.plus, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={t.action} hitSlop={4}>
                <Glyph name={t.icon} size={18} color={C.primaryDark} strokeWidth={2.2} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 16 },
  rings: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.bgSurface, borderRadius: 20, padding: 14 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ringDot: { width: 9, height: 9, borderRadius: 5 },
  ringLabel: { flex: 1, fontFamily: F.body, fontSize: 14, color: C.textSecondary },
  ringValue: { fontFamily: F.semibold, fontSize: 14, color: C.textPrimary, fontVariant: ['tabular-nums'] },
  ringCaption: { fontFamily: F.body, fontSize: 12, color: C.textMuted },
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
  weekRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSurface, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, gap: 8 },
  weekDay: { fontFamily: F.semibold, fontSize: 14, color: C.textPrimary },
  weekDate: { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  weekSegs: { flex: 1, flexDirection: 'row', gap: 4 },
  weekSeg: { flex: 1, height: 10, borderRadius: 5, backgroundColor: C.bgCard },
  emptyNote: { fontFamily: F.body, fontSize: 13.5, lineHeight: 19, color: C.textMuted },
  weekCount: { width: 32, textAlign: 'right', fontFamily: F.medium, fontSize: 13, color: C.textSecondary, fontVariant: ['tabular-nums'] },
  yLabel: { position: 'absolute', fontFamily: F.body, fontSize: 11, color: C.textMuted },
  ystats: { flexDirection: 'row', gap: 8 },
  ystat: { flex: 1, backgroundColor: C.bgSurface, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  ystatNum: { fontFamily: F.display, fontSize: 22, color: C.textPrimary },
  ystatLbl: { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  trk: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bgSurface, borderRadius: 16, paddingVertical: 8, paddingLeft: 12, paddingRight: 8 },
  trkTitle: { fontFamily: F.semibold, fontSize: 15, color: C.textPrimary },
  trkSub: { fontFamily: F.body, fontSize: 12.5, color: C.textMuted, marginTop: 1 },
  plus: { width: 44, height: 44, borderRadius: 13, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
});
