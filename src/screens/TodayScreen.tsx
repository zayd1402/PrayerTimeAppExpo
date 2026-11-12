// Today: a sky that takes the colour of the current prayer time, one button for the prayer that's
// due, the five times with visible ticks, quick actions and one timely suggestion.
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
import { Glyph, GlyphName } from '../design/Glyph';
import { F, Sky, useSky } from '../design/palette';
import { computeDayState, formatClock, formatDuration, isDone, minutesOf, FIVE } from '../design/dayState';
import { getSpecialMoment } from '../design/moment';
import { PrimaryButton, ProfileButton, TickButton, TickState, tapHaptic } from '../design/ui';
import { HijriService } from '../services/HijriService';
import { calculateQiblaDirection } from '../services/PrayerService';
import { getNearbyMosques } from '../services/LocalMosqueService';
import { getTodayDhikrCount } from '../services/StorageService';
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
  const [dhikrToday, setDhikrToday] = useState(0);

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
    getTodayDhikrCount().then(d => setDhikrToday(d.subhanallah + d.alhamdulillah + d.allahuakbar)).catch(() => {});
  }, []));

  const today = new Date();
  const hijri = HijriService.gregorianToHijri(today);
  const dateLine = `${WEEKDAYS[today.getDay()]}, ${hijri.day} ${hijri.monthName} ${hijri.year}`;
  const qibla = location ? Math.round(calculateQiblaDirection(location.latitude, location.longitude)) : null;
  const nearest = useMemo(() => location ? getNearbyMosques(location, 50)[0] : undefined, [location]);
  const moment = useMemo(() => getSpecialMoment(today), [today.toDateString()]);
  const { dailyHadith } = usePrayerApp();

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
  const showNudge = !!(state && open && !isDone(prayerStatuses[open]));
  let nudgeTitle = '';
  let nudgeSub = '';
  if (showNudge && times && open && state?.openEnds != null) {
    const sinceStart = (now - times[open] + 1440) % 1440;
    nudgeTitle = sinceStart < 60 ? `${NAMES[open].en} has started` : `${NAMES[open].en} is still open`;
    nudgeSub = open === 'isha' ? 'Prayed it yet? Open until Fajr' : `Prayed it yet? ${formatDuration(state.openEnds - now)} left`;
  }

  const duaHint = state ? { dawn: 'Morning', day: `After ${state.open ? NAMES[state.open].en : 'Fajr'}`, golden: 'Evening', maghrib: 'Evening', night: 'Before sleep' }[state.sky] : 'Daily';

  const quick: { icon: GlyphName; label: string; hint: string; onPress: () => void }[] = [
    { icon: 'qibla', label: 'Qibla', hint: qibla !== null ? `${qibla}°` : 'Compass', onPress: () => navigation.navigate('tabs', { screen: 'qibla' } as never) },
    { icon: 'beads', label: 'Tasbih', hint: dhikrToday > 0 ? `${dhikrToday} today` : 'Start', onPress: () => navigation.navigate('worship', { tab: 'dhikr' }) },
    { icon: 'hands', label: 'Duas', hint: duaHint, onPress: () => navigation.navigate('duas') },
    { icon: 'mosque', label: 'Mosques', hint: nearest ? (nearest.distanceKm < 1 ? `${Math.round(nearest.distanceKm * 1000)} m` : `${nearest.distanceKm.toFixed(1)} km`) : 'Nearby', onPress: () => navigation.navigate('mosques') },
  ];

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

          {showNudge && open && (
            <View style={styles.nudge}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nudgeTitle}>{nudgeTitle}</Text>
                <Text style={styles.nudgeSub}>{nudgeSub}</Text>
              </View>
              <PrimaryButton label="Mark prayed" onPress={() => mark(open)} />
            </View>
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
                return (
                  <Pressable
                    key={id}
                    onLongPress={tick === 'future' ? undefined : () => { tapHaptic(); setSheetFor(id); }}
                    style={[styles.prow, !last && !isNow && styles.rowLine, isNow && styles.prowNow]}
                  >
                    <Text style={[styles.ptime, isNow && styles.ptimeNow]}>{formatClock(times[id], false)}</Text>
                    <View style={styles.pname}>
                      <Text style={[styles.pnameText, past && { color: C.textSecondary }, isNow && { fontFamily: F.semibold }]}>{NAMES[id].en}</Text>
                      <Text style={styles.pnameAr}>{NAMES[id].ar}</Text>
                      {tick === 'qaza' && <Text style={styles.qazaTag}>Qaza</Text>}
                    </View>
                    <TickButton
                      state={tick}
                      highlight={isNow}
                      onPress={() => onTick(id)}
                      onLongPress={() => { tapHaptic(); setSheetFor(id); }}
                      label={`${NAMES[id].en}, ${formatClock(times[id])}, ${tick === 'done' ? 'prayed on time' : tick === 'qaza' ? 'prayed as qaza' : tick === 'future' ? 'not started yet' : 'not marked'}`}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.quick}>
            {quick.map(q => (
              <Pressable key={q.label} onPress={q.onPress} style={styles.quickItem} accessibilityRole="button" accessibilityLabel={`${q.label}, ${q.hint}`}>
                {({ pressed }) => (
                  <>
                    <View style={[styles.quickIcon, pressed && { backgroundColor: C.surfacePressed }]}>
                      <Glyph name={q.icon} size={22} color={C.primaryDark} />
                    </View>
                    <Text style={styles.quickLabel}>{q.label}</Text>
                    <Text style={styles.quickHint} numberOfLines={1}>{q.hint}</Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>

          {moment ? (
            <Pressable onPress={() => moment.route && navigation.navigate(moment.route)} style={styles.moment} accessibilityRole="button">
              <Text style={styles.momentK}>{moment.kicker}</Text>
              <Text style={styles.momentTitle}>{moment.title}</Text>
              {moment.body ? <Text style={styles.momentBody}>{moment.body}</Text> : null}
            </Pressable>
          ) : dailyHadith ? (
            <Pressable onPress={() => navigation.navigate('hadith')} style={styles.moment} accessibilityRole="button">
              <Text style={styles.momentK}>Hadith of the day</Text>
              <Text style={styles.momentHadith} numberOfLines={4}>{dailyHadith.english}</Text>
              <Text style={styles.momentBody}>{dailyHadith.source}</Text>
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
  quick: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  quickItem: { flex: 1, alignItems: 'center', gap: 4 },
  quickIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: C.bgSurface, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  quickLabel: { fontFamily: F.medium, fontSize: 13, color: C.textSecondary },
  quickHint: { fontFamily: F.body, fontSize: 11.5, color: C.textMuted },
  moment: { backgroundColor: C.goldPale, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, gap: 3 },
  momentK: { fontFamily: F.semibold, fontSize: 12.5, color: C.gold },
  momentTitle: { fontFamily: F.semibold, fontSize: 16, color: C.textPrimary },
  momentHadith: { fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.textPrimary },
  momentBody: { fontFamily: F.body, fontSize: 13, color: C.textSecondary },
});
