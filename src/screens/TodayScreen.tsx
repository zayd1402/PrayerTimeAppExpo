// Today: a sky that takes the colour of the current prayer time, then the five prayers with the
// small habits stacked after each, then one next step (or a welcome back after a gap). Nothing else.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { usePrayerApp } from '../context/PrayerAppContext';
import { Tokens, useTheme, useThemedStyles, useTokens } from '../context/ThemeContext';
import { PrayerId } from '../types';
import MarkSheet from '../components/MarkSheet';
import { useHabits } from '../context/HabitsContext';
import HabitSheet, { HabitSheetState } from '../components/HabitSheet';
import { Glyph } from '../design/Glyph';
import { F, Sky, useSky } from '../design/palette';
import { computeDayState, formatClock, formatDuration, isDone, minutesOf, FIVE } from '../design/dayState';
import { PrimaryButton, ProfileButton, TickButton, TickState, tapHaptic } from '../design/ui';
import { HabitItem, NextStepCard, ReturnCard } from '../design/habitsUi';
import { AnchorPrayer, habitDone, habitsFor, ladder, needsWelcomeBack, nextStep, prayerConsistency } from '../design/journey';
import type { DayLog, PrayerLog } from '../design/habits';
import { HijriService } from '../services/HijriService';
import { getReturnDismissed, loadPrayerLog, setReturnDismissed } from '../services/StorageService';
import { getLocalDateKey } from '../utils/date';
import type { RootStackParamList } from '../navigation/routes';

const NAMES: Record<PrayerId, { en: string; ar: string; short: string }> = {
  fajr: { en: 'Fajr', ar: 'الفجر', short: 'Fajr' },
  sunrise: { en: 'Sunrise', ar: 'الشروق', short: 'Sunrise' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر', short: 'Dhuhr' },
  asr: { en: 'Asr', ar: 'العصر', short: 'Asr' },
  maghrib: { en: 'Maghrib', ar: 'المغرب', short: 'Mgh' },
  isha: { en: 'Isha', ar: 'العشاء', short: 'Isha' },
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Current minute of the day, refreshed every 15 seconds. */
function useNowMinutes(): number {
  const [now, setNow] = useState(() => minutesOf(new Date()));
  useEffect(() => {
    const id = setInterval(() => setNow(minutesOf(new Date())), 15000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/** The striped segment for the prayer that's open now. The stripes drift slowly unless motion is reduced. */
function NowSegment({ color }: { color: string }) {
  const reduce = useReduceMotion();
  const x = useSharedValue(0);
  useEffect(() => {
    if (reduce) { cancelAnimation(x); x.value = 0; return; }
    x.value = withRepeat(withTiming(-14, { duration: 1600, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [reduce, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={{ height: 5, borderRadius: 3, overflow: 'hidden', width: '100%' }}>
      <Animated.View style={[{ flexDirection: 'row', width: '200%' }, style]}>
        {Array.from({ length: 30 }, (_, i) => (
          <View key={i} style={{ width: 4, height: 5, marginRight: 3, backgroundColor: color, borderRadius: 1 }} />
        ))}
      </Animated.View>
    </View>
  );
}

function Segments({ sky, statuses, open }: { sky: Sky; statuses: Partial<Record<PrayerId, string>>; open: PrayerId | null }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`${FIVE.filter(id => isDone(statuses[id] as never)).length} of 5 prayers done today`}>
      {FIVE.map(id => {
        const done = isDone(statuses[id] as never);
        const now = !done && id === open;
        return (
          <View key={id} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            {now ? <NowSegment color={sky.fg} /> : (
              <View style={{ height: 5, width: '100%', borderRadius: 3, backgroundColor: done ? sky.fg : sky.wash }} />
            )}
            <Text style={{ fontSize: 11, fontFamily: done || now ? F.semibold : F.body, color: done || now ? sky.fg : sky.fg2 }}>
              {NAMES[id].short}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function TodayScreen() {
  const C = useTokens();
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { prayerTimes, prayerStatuses, location, handleMarkPrayer } = usePrayerApp();
  const now = useNowMinutes();
  const [sheetFor, setSheetFor] = useState<PrayerId | null>(null);
  const [habitSheet, setHabitSheet] = useState<HabitSheetState>(null);
  const { habits, log: habitLog, ladderLevel, toggleHabit, setLadderLevel } = useHabits();
  const [pastLog, setPastLog] = useState<PrayerLog>({});
  const todayKey = getLocalDateKey();
  const [returnDismissed, setDismissed] = useState(() => getReturnDismissed());
  // A prayer whose habits are all done folds to one line, so the day gets shorter as it is kept.
  const [unfolded, setUnfolded] = useState<Record<string, boolean>>({});
  const folded = (id: PrayerId, tick: TickState, stacked: { id: string }[]) =>
    !unfolded[id] && (tick === 'done' || tick === 'qaza') && stacked.every(h => habitDone(habitLog, todayKey, h.id));

  const times = useMemo(() => {
    if (prayerTimes.length < 6) return null;
    const m: Record<string, number> = {};
    prayerTimes.forEach(p => { m[p.id] = p.minutes; });
    return m as Record<PrayerId, number>;
  }, [prayerTimes]);

  const state = useMemo(() => times ? computeDayState(times, now, prayerStatuses) : null, [times, now, prayerStatuses]);
  const sky = useSky(state?.sky ?? (now >= 18 * 60 || now < 5 * 60 ? 'night' : 'day'));
  const lightText = sky.fg.startsWith('#F');

  // The status bar follows the sky while Today is on screen.
  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle(lightText ? 'light-content' : 'dark-content');
    return () => StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
  }, [lightText, isDark]));

  useFocusEffect(useCallback(() => {
    loadPrayerLog().then(l => setPastLog(l as PrayerLog)).catch(() => {});
  }, []));

  // Today's entry comes from live state, so a tick shows in the numbers straight away.
  const prayerLog: PrayerLog = useMemo(() => ({ ...pastLog, [todayKey]: prayerStatuses as DayLog }), [pastLog, prayerStatuses, todayKey]);
  const steps = useMemo(() => ladder(ladderLevel, habits, prayerLog, habitLog), [ladderLevel, habits, prayerLog, habitLog]);
  useEffect(() => { if (steps.level > ladderLevel) setLadderLevel(steps.level); }, [steps.level, ladderLevel, setLadderLevel]);
  const offer = useMemo(() => nextStep(habits, steps.rungs, prayerLog), [habits, steps.rungs, prayerLog]);
  // The log only holds yesterday and before once loaded, so wait for it before welcoming anyone back.
  const welcomeBack = returnDismissed !== todayKey && needsWelcomeBack(pastLog, habitLog);
  const consistency = useMemo(() => (welcomeBack ? prayerConsistency(pastLog) : null), [welcomeBack, pastLog]);

  const today = new Date();
  const hijri = HijriService.gregorianToHijri(today);
  const dateLine = `${WEEKDAYS[today.getDay()]}, ${hijri.day} ${hijri.monthName} ${hijri.year}`;

  const mark = (id: PrayerId) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    handleMarkPrayer(id, 'prayed');
  };

  const tickStateFor = (id: PrayerId): TickState => {
    const s = prayerStatuses[id];
    if (s === 'prayed') return 'done';
    if (s === 'qaza') return 'qaza';
    if (times && times[id] > now) return 'future';
    return 'open';
  };

  const onTick = (id: PrayerId) => {
    const s = tickStateFor(id);
    if (s === 'future') return;
    // Ticking the prayer that's open marks it on time. Anything already logged, or a prayer whose
    // time has passed, opens the sheet so on time vs qaza is a real choice.
    if (s === 'open' && id === state?.open) mark(id);
    else { tapHaptic(); setSheetFor(id); }
  };

  const windowText = (id: PrayerId): string | undefined => {
    if (!times) return undefined;
    const ends: Record<PrayerId, number> = {
      fajr: times.sunrise, sunrise: times.dhuhr, dhuhr: times.asr, asr: times.maghrib, maghrib: times.isha, isha: times.fajr,
    };
    const verb = times[id] <= now ? 'Started' : 'Starts';
    return `${verb} ${formatClock(times[id])}, open until ${formatClock(ends[id])}`;
  };

  const heroName = state ? NAMES[state.hero.prayer].en : 'Set your city';
  const heroLabel = state ? (state.hero.mode === 'now' ? 'Now' : 'Next') : 'Prayer times';
  let heroAt = 'Choose a city to see prayer times';
  if (state && times) {
    if (state.hero.mode === 'now' && state.openEnds !== null) {
      const endName = state.open === 'fajr' ? 'sunrise' : state.open === 'isha' ? 'Fajr' : NAMES[state.next].en;
      heroAt = `Until ${endName}, ${formatClock(state.openEnds)}`;
    } else {
      heroAt = `${formatClock(times[state.hero.prayer])}${state.nextIsTomorrow ? ' tomorrow' : ''}`;
    }
  }

  const open = state?.open ?? null;

  // Welcome back: one prayer to restart with, the open one if there is one, else the next.
  const restartWith = state ? (open && !isDone(prayerStatuses[open]) ? open : state.next) : null;
  const returnBody = `It has been a few days.${consistency ? ` Your 30-day rate is still ${Math.round(consistency.rate * 100)}%.` : ''} Pray ${restartWith ? NAMES[restartWith].en : 'the next prayer'} on time today; that is enough.`;
  const dismissReturn = () => { tapHaptic(); setReturnDismissed(todayKey); setDismissed(todayKey); };

  const sheetPrayer = sheetFor ? { id: sheetFor, name: NAMES[sheetFor].en } : null;
  const sheetCurrent = sheetFor ? (prayerStatuses[sheetFor] ?? (times && times[sheetFor] <= now && sheetFor !== open ? 'missed' : undefined)) : undefined;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <LinearGradient
          colors={[sky.top, sky.bottom, C.bgBase]}
          locations={[0, 0.72, 1]}
          style={{ paddingTop: insets.top + 8, paddingBottom: 26 }}
        >
          <View style={styles.skyIn}>
            <View style={styles.topbar}>
              <Pressable
                style={styles.loc}
                onPress={() => navigation.navigate('settings')}
                accessibilityRole="button"
                accessibilityLabel={`Location ${location?.name ?? 'not set'}. Change in settings`}
              >
                <Glyph name="pin" size={17} color={sky.fg} />
                <View>
                  <Text style={[styles.locName, { color: sky.fg }]} numberOfLines={1}>{location?.name ?? 'Choose your city'}</Text>
                  <Text style={[styles.locDate, { color: sky.fg2 }]}>{dateLine}</Text>
                </View>
              </Pressable>
              <ProfileButton background={sky.wash} color={sky.fg} />
            </View>

            <View style={styles.heroRow} accessible accessibilityLabel={`${heroLabel} ${heroName}, ${heroAt}${state ? `, ${state.hero.mode === 'now' ? 'time left' : 'starts in'} ${formatDuration(state.hero.minutes)}` : ''}`}>
              <View style={{ flexShrink: 1 }}>
                <Text style={[styles.heroLbl, { color: sky.fg2 }]}>{heroLabel}</Text>
                <Text style={[styles.heroName, { color: sky.fg }]} numberOfLines={1} adjustsFontSizeToFit>{heroName}</Text>
                <Text style={[styles.heroAt, { color: sky.fg2 }]}>{heroAt}</Text>
              </View>
              {state && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.heroLbl, { color: sky.fg2 }]}>{state.hero.mode === 'now' ? 'Time left' : 'Starts in'}</Text>
                  <Text style={[styles.heroCd, { color: sky.fg }]}>{formatDuration(state.hero.minutes)}</Text>
                </View>
              )}
            </View>

            {state && <Segments sky={sky} statuses={prayerStatuses} open={open} />}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {!times && (
            <View style={styles.nudge}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nudgeTitle}>Location needed</Text>
                <Text style={styles.nudgeSub}>Pick your city so prayer times, Qibla and mosques are accurate.</Text>
              </View>
              <PrimaryButton label="Choose city" onPress={() => navigation.navigate('settings')} />
            </View>
          )}

          {welcomeBack && times && (
            <ReturnCard
              title={`Start again with ${restartWith ? NAMES[restartWith].en : 'one prayer'}`}
              body={returnBody}
              action={restartWith && restartWith === open && !isDone(prayerStatuses[restartWith]) ? `Mark ${NAMES[restartWith].en} prayed` : undefined}
              onAction={restartWith ? () => mark(restartWith) : undefined}
              onDismiss={dismissReturn}
            />
          )}

          {times && (
            <View>
              {(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerId[]).map((id, i, all) => {
                const last = i === all.length - 1;
                if (id === 'sunrise') {
                  return (
                    <View key={id} style={[styles.sunRow, styles.rowLine]}>
                      <Text style={styles.sunTime}>{formatClock(times.sunrise, false)}</Text>
                      <Glyph name="sunrise" size={14} color={C.textMuted} />
                      <Text style={styles.sunText}>Sunrise</Text>
                    </View>
                  );
                }
                const tick = tickStateFor(id);
                const isNow = id === open && tick === 'open';
                const past = tick === 'done' || tick === 'qaza' || (times[id] <= now && !isNow);
                const stacked = habitsFor(habits, id as AnchorPrayer);
                return (
                  <View key={id} style={[!last && styles.rowLine, stacked.length > 0 && { paddingBottom: 4 }]}>
                    <Pressable
                      onLongPress={tick === 'future' ? undefined : () => { tapHaptic(); setSheetFor(id); }}
                      style={[styles.prow, isNow && styles.prowNow]}
                    >
                      <Text style={[styles.ptime, isNow && styles.ptimeNow]}>{formatClock(times[id], false)}</Text>
                      <View style={styles.pname}>
                        <Text style={[styles.pnameText, past && { color: C.textSecondary }, isNow && { fontFamily: F.semibold }]}>{NAMES[id].en}</Text>
                        <Text style={styles.pnameAr}>{NAMES[id].ar}</Text>
                        {tick === 'qaza' && <Text style={styles.qazaTag}>Qaza</Text>}
                        {tick === 'open' && !isNow && <Text style={styles.qazaTag}>Not marked</Text>}
                      </View>
                      <TickButton
                        state={tick}
                        highlight={isNow}
                        onPress={() => onTick(id)}
                        onLongPress={() => { tapHaptic(); setSheetFor(id); }}
                        label={`${NAMES[id].en}, ${formatClock(times[id])}, ${tick === 'done' ? 'prayed on time' : tick === 'qaza' ? 'prayed as qaza' : tick === 'future' ? 'not started yet' : 'not marked'}`}
                      />
                    </Pressable>
                    {stacked.length > 0 && folded(id, tick, stacked) ? (
                      <Pressable
                        onPress={() => { tapHaptic(); setUnfolded(u => ({ ...u, [id]: true })); }}
                        style={styles.foldRow}
                        accessibilityRole="button"
                        accessibilityLabel={`After ${NAMES[id].en}, all ${stacked.length} habits done. Show them`}
                      >
                        <Glyph name="check" size={13} color={C.textMuted} strokeWidth={2.2} />
                        <Text style={styles.anchor}>After {NAMES[id].en}: {stacked.length === 1 ? stacked[0].title : `all ${stacked.length} habits`} done</Text>
                      </Pressable>
                    ) : stacked.length > 0 && (
                      <View style={styles.stack}>
                        <Text style={styles.anchor}>After {NAMES[id].en}</Text>
                        {stacked.map(h => (
                          <HabitItem
                            key={h.id}
                            habit={h}
                            done={habitDone(habitLog, todayKey, h.id)}
                            onToggle={() => toggleHabit(h.id)}
                            onOpen={() => setHabitSheet({ mode: 'view', habitId: h.id })}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {!welcomeBack && offer && times ? (
            <NextStepCard
              title={offer.title}
              detail={offer.detail}
              onPress={() => { tapHaptic(); setHabitSheet({ mode: 'add', drafts: offer.habits, title: offer.habits.length > 1 ? offer.title : undefined }); }}
            />
          ) : times ? (
            <Pressable onPress={() => { tapHaptic(); setHabitSheet({ mode: 'add', drafts: [] }); }} style={styles.addLink} accessibilityRole="button">
              <Glyph name="plus" size={16} color={C.primaryDark} />
              <Text style={styles.addLinkText}>Add a habit after a prayer</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <MarkSheet
        prayer={sheetPrayer}
        window={sheetFor ? windowText(sheetFor) : undefined}
        current={sheetCurrent}
        onSave={(id, status) => handleMarkPrayer(id, status)}
        onClear={id => handleMarkPrayer(id, null)}
        onClose={() => setSheetFor(null)}
      />
      <HabitSheet state={habitSheet} onClose={() => setHabitSheet(null)} />
    </View>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  skyIn: { paddingHorizontal: 20, gap: 18 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1, minHeight: 44 },
  locName: { fontFamily: F.semibold, fontSize: 16 },
  locDate: { fontFamily: F.body, fontSize: 12.5, marginTop: 1 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  heroLbl: { fontFamily: F.body, fontSize: 13 },
  heroName: { fontFamily: F.display, fontSize: 48, lineHeight: 54, marginTop: 2 },
  heroAt: { fontFamily: F.body, fontSize: 14, marginTop: 2 },
  heroCd: { fontFamily: F.displayMedium, fontSize: 32, lineHeight: 38 },
  body: { paddingHorizontal: 16, gap: 16 },
  nudge: { backgroundColor: C.primaryLight, borderRadius: 18, paddingVertical: 12, paddingLeft: 16, paddingRight: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nudgeTitle: { fontFamily: F.semibold, fontSize: 15, color: C.textPrimary },
  nudgeSub: { fontFamily: F.body, fontSize: 13, color: C.textSecondary, marginTop: 1 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.borderStrong },
  prow: { flexDirection: 'row', alignItems: 'center', minHeight: 54, paddingLeft: 12, paddingRight: 2 },
  prowNow: { backgroundColor: C.primaryLight, borderRadius: 14 },
  ptime: { width: 54, fontFamily: F.body, fontSize: 14, color: C.textMuted, fontVariant: ['tabular-nums'] },
  ptimeNow: { color: C.primaryDark, fontFamily: F.semibold },
  pname: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  pnameText: { fontFamily: F.medium, fontSize: 17, color: C.textPrimary },
  pnameAr: { fontFamily: F.arabic, fontSize: 17, color: C.textMuted, writingDirection: 'rtl' },
  qazaTag: { fontFamily: F.medium, fontSize: 11.5, color: C.qaza },
  sunRow: { flexDirection: 'row', alignItems: 'center', minHeight: 36, paddingLeft: 12, gap: 6 },
  sunTime: { width: 48, fontFamily: F.body, fontSize: 13, color: C.textMuted, fontVariant: ['tabular-nums'] },
  sunText: { fontFamily: F.body, fontSize: 13, color: C.textMuted },
  stack: { marginLeft: 66, marginBottom: 8, gap: 4 },
  foldRow: { marginLeft: 66, marginBottom: 6, minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6 },
  anchor: { fontFamily: F.body, fontSize: 12, lineHeight: 16, color: C.textMuted, paddingLeft: 2 },
  addLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 },
  addLinkText: { fontFamily: F.medium, fontSize: 14, color: C.primaryDark },
});
