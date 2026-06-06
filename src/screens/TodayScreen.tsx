import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Dimensions, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, PrayerId, PRAYER_ICONS } from '../types';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler,
  withTiming, withSequence, withRepeat
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { usePrayerApp } from '../context/PrayerAppContext';

const { width } = Dimensions.get('window');

interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

interface Prayer {
  id: string;
  name: string;
  arabicName: string;
  icon: string;
}

interface TodayScreenProps {
  prayerTimes: PrayerTimes;
  nextPrayer: Prayer | null;
  nextPrayerTime: Date | null;
  completedPrayers: Set<string>;
  locationName: string;
  hijriDate: string;
  timerDisplay: string;
  togglePrayer: (id: string) => void;
  dailyHadith?: { english: string; source: string } | null;
}

const PRAYERS: Prayer[] = [
  { id: 'fajr', name: 'Fajr', arabicName: 'الفجر', icon: PRAYER_ICONS.fajr.icon },
  { id: 'sunrise', name: 'Sunrise', arabicName: 'الشروق', icon: PRAYER_ICONS.sunrise.icon },
  { id: 'dhuhr', name: 'Dhuhr', arabicName: 'الظهر', icon: PRAYER_ICONS.dhuhr.icon },
  { id: 'asr', name: 'Asr', arabicName: 'العصر', icon: PRAYER_ICONS.asr.icon },
  { id: 'maghrib', name: 'Maghrib', arabicName: 'المغرب', icon: PRAYER_ICONS.maghrib.icon },
  { id: 'isha', name: 'Isha', arabicName: 'العشاء', icon: PRAYER_ICONS.isha.icon },
];

const TRACKABLE = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getIqamaTime(prayerId: string, prayerTime: Date): Date | null {
  const iqamaMinutes: Record<string, number> = {
    fajr: 20, dhuhr: 15, asr: 15, maghrib: 5, isha: 15
  };
  if (!iqamaMinutes[prayerId]) return null;
  const iqama = new Date(prayerTime);
  iqama.setMinutes(iqama.getMinutes() + iqamaMinutes[prayerId]);
  return iqama;
}

function getTimeUntil(target: Date): string {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Now';
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
}

// ─── Circular Progress Ring ──────────────────────────────────
function PrayerRing({ completed, total }: { completed: number; total: number }) {
  const size = 58;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = completed / total;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <View style={[styles.ringBg, { width: size, height: size, borderRadius: size / 2 }]} />
      <View style={styles.ringSvg}>
        <View style={[styles.ringTrack, {
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: 'rgba(255,255,255,0.15)'
        }]} />
        <Animated.View style={[styles.ringFill, {
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: C.gold,
          borderTopColor: C.gold, borderRightColor: progress > 0.25 ? C.gold : 'transparent',
          borderBottomColor: progress > 0.5 ? C.gold : 'transparent',
          borderLeftColor: progress > 0.75 ? C.gold : 'transparent',
          transform: [{ rotate: `${-90 + progress * 360}deg` }]}]} />
      </View>
      <Text style={styles.ringText}>{completed}/{total}</Text>
    </View>
  );
}

// ─── Prayer Row with Swipe (Reanimated + Gesture Handler) ─────
function PrayerRow({
  prayer, time, isTrackable, isCompleted, isNext, isActive,
  onToggle, onLongPress, index
}: {
  prayer: Prayer; time: Date; isTrackable: boolean; isCompleted: boolean;
  isNext: boolean; isActive: boolean; onToggle: () => void; onLongPress: () => void;
  index: number;
}) {
  const translateX = useSharedValue(0);
  const rowScale = useSharedValue(1);

  // Pulse animation for active prayer
  useEffect(() => {
    if (isActive) {
      rowScale.value = withRepeat(
        withSequence(
          withTiming(1.008, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1, true
      );
    } else {
      rowScale.value = withTiming(1, { duration: 300 });
    }
  }, [isActive]);

  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = Math.min(e.translationX, 120);
      }
    })
    .onEnd((e) => {
      if (e.translationX > 80 && isTrackable) {
        translateX.value = withTiming(0, { duration: 200 });
        onToggle();
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: rowScale.value }],
  }));

  const iqama = isTrackable ? getIqamaTime(prayer.id, time) : null;
  const iqamaCountdown = iqama && isNext ? getTimeUntil(iqama) : null;

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View
        style={[
          styles.prayerRowWrap,
          animatedRowStyle,
          isNext && styles.prayerRowWrapNext,
          isActive && styles.prayerRowWrapActive,
          isCompleted && styles.prayerRowWrapCompleted,
        ]}
      >
        {/* Swipe reveal background */}
        <View style={[styles.swipeBg, isCompleted ? styles.swipeBgUndo : styles.swipeBgDone]}>
          <Ionicons name={isCompleted ? 'arrow-undo' : 'checkmark'} size={24} color="#FFF" />
          <Text style={styles.swipeText}>{isCompleted ? 'Undo' : 'Prayed'}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={isTrackable ? onToggle : undefined}
          onLongPress={onLongPress}
          style={[
            styles.prayerRow,
            isNext && styles.prayerRowNext,
            isActive && styles.prayerRowActive,
            isCompleted && styles.prayerRowDone,
          ]}
        >
          <View style={[styles.prayerIconWrap, isActive && styles.prayerIconWrapActive]}>
            <Ionicons name={(isActive ? PRAYER_ICONS[prayer.id as PrayerId].iconActive : prayer.icon) as any} size={22} color={isActive ? C.primary : C.textSecondary} />
            {isActive && <View style={styles.activePulse} />}
          </View>

          <View style={styles.prayerInfo}>
            <Text style={[styles.prayerName, isNext && styles.prayerNameNext, isCompleted && styles.prayerNameDone]}>
              {prayer.name}
            </Text>
            <Text style={styles.prayerArabic}>{prayer.arabicName}</Text>
            {iqamaCountdown && (
              <View style={styles.iqamaBadge}>
                <Ionicons name="time-outline" size={10} color={C.primary} />
                <Text style={styles.iqamaText}>Iqama in {iqamaCountdown}</Text>
              </View>
            )}
          </View>

          <View style={styles.prayerRight}>
            <Text style={[styles.prayerTimeText, isNext && styles.prayerTimeNext]}>
              {formatTime(time)}
            </Text>
            {isTrackable && (
              <View style={[styles.checkCircle, isCompleted && styles.checkCircleDone]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                ) : (
                  <View style={styles.checkEmpty} />
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Daily Hadith Card ───────────────────────────────────────
function DailyHadithCard({ hadith }: { hadith: { english: string; source: string } | null }) {
  if (!hadith) return null;
  return (
    <View style={styles.hadithCard}>
      <View style={styles.hadithHeader}>
        <Ionicons name="book-outline" size={16} color={C.gold} />
        <Text style={styles.hadithTitle}>Hadith of the Day</Text>
      </View>
      <Text style={styles.hadithText} numberOfLines={3}>{hadith.english}</Text>
      <Text style={styles.hadithSource}>— {hadith.source}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function TodayScreen() {
  const {
    prayersObj: prayerTimes, nextPrayerObj: nextPrayer, nextPrayerTime,
    completedPrayers, location, timerDisplay, dailyHadith, hijriDateStr,
    handleTogglePrayer: togglePrayer,
  } = usePrayerApp();
  const scrollY = useSharedValue(0);
  const entries = [
    { prayer: PRAYERS[0], time: prayerTimes.fajr },
    { prayer: PRAYERS[1], time: prayerTimes.sunrise },
    { prayer: PRAYERS[2], time: prayerTimes.dhuhr },
    { prayer: PRAYERS[3], time: prayerTimes.asr },
    { prayer: PRAYERS[4], time: prayerTimes.maghrib },
    { prayer: PRAYERS[5], time: prayerTimes.isha },
  ];

  const completedCount = TRACKABLE.filter(id => completedPrayers.has(id)).length;

  const heroStyle = useAnimatedStyle(() => {
    const scale = 1 - Math.min(scrollY.value / 150, 0.08);
    const opacity = 1 - Math.min(scrollY.value / 120, 0.3);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleToggle = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    togglePrayer(id);
  };

  const handleLongPress = (prayer: Prayer) => {
    Alert.alert(
      `Mark ${prayer.name}`,
      'How did you pray?',
      [
        { text: 'Prayed On Time', onPress: () => togglePrayer(prayer.id) },
        { text: 'Qaza', onPress: () => togglePrayer(prayer.id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={scrollHandler}
    >
      {/* Hero Card with Sunset Gradient */}
      <Animated.View style={[styles.heroCard, heroStyle]}>
        <LinearGradient
          colors={['#FAF5FF', '#F3ECFF', '#FDF8FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={C.textSecondary} />
                <Text style={styles.locationText}>{location.name}</Text>
              </View>
              <Text style={styles.nextPrayerText}>
                {nextPrayer ? nextPrayer.name : 'All Complete'}
              </Text>
              <Text style={styles.nextPrayerTime}>
                {nextPrayer && nextPrayerTime ? `at ${formatTime(nextPrayerTime)}` : 'All prayers tracked'}
              </Text>
            </View>
            <PrayerRing completed={completedCount} total={5} />
          </View>

          {nextPrayerTime && (
            <Text style={styles.timerText}>{timerDisplay}</Text>
          )}

          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: `${(completedCount / 5) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{completedCount}/5</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Hijri Date */}
      <View style={styles.hijriRow}>
        <Ionicons name="calendar-outline" size={14} color={C.textMuted} />
        <Text style={styles.hijriText}>{hijriDateStr}</Text>
      </View>

      {/* Prayer List */}
      <View style={styles.prayerList}>
        {entries.map(({ prayer, time }, index) => {
          const isTrackable = TRACKABLE.includes(prayer.id);
          const isCompleted = completedPrayers.has(prayer.id);
          const isNext = nextPrayer?.id === prayer.id;
          const isActive = isNext && !isCompleted;

          return (
            <PrayerRow
              key={prayer.id}
              prayer={prayer}
              time={time}
              isTrackable={isTrackable}
              isCompleted={isCompleted}
              isNext={isNext}
              isActive={isActive}
              onToggle={() => handleToggle(prayer.id)}
              onLongPress={() => handleLongPress(prayer)}
              index={index}
            />
          );
        })}
      </View>

      {/* Daily Hadith */}
      <DailyHadithCard hadith={dailyHadith} />

      {/* Hint */}
      <Text style={styles.hintText}>Swipe right to mark • Long press for options</Text>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { padding: 18, paddingBottom: 120 },

  // Hero — Neumorphic
  heroCard: {
    borderRadius: 24,
    marginBottom: 16,
    // Neumorphic: soft raised shadow (light top-left, dark bottom-right)
    shadowColor: C.shadow.shadowColor,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 24,
    // Makes the top-left shadow "light" visible
    backgroundColor: C.bgCard,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLeft: { flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  locationText: { color: C.textSecondary, fontSize: 13, fontFamily: 'Jost_500Medium' },
  nextPrayerText: { color: C.textPrimary, fontSize: 34, fontFamily: 'BodoniModa_700Bold' },
  nextPrayerTime: { color: C.textSecondary, fontSize: 14, fontFamily: 'Jost_400Regular', marginTop: 2 },
  timerText: { color: C.gold, fontSize: 38, fontFamily: 'BodoniModa_700Bold', marginTop: 12, fontVariant: ['tabular-nums'] },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: 'rgba(202,138,4,0.15)', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: C.gold, borderRadius: 3 },
  progressText: { color: C.textPrimary, fontSize: 14, fontFamily: 'Jost_700Bold', fontVariant: ['tabular-nums'] },

  // Ring
  ringContainer: { justifyContent: 'center', alignItems: 'center' },
  ringBg: { position: 'absolute', backgroundColor: 'rgba(202,138,4,0.1)' },
  ringSvg: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  ringTrack: { position: 'absolute' },
  ringFill: { position: 'absolute' },
  ringText: { color: C.textPrimary, fontSize: 14, fontFamily: 'Jost_700Bold' },

  // Hijri
  hijriRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 },
  hijriText: { textAlign: 'center', color: C.textSecondary, fontSize: 14, fontFamily: 'Jost_500Medium' },

  // Prayer List
  prayerList: { gap: 10 },

  // Prayer Row
  prayerRowWrap: { borderRadius: 18, overflow: 'hidden', marginBottom: 2 },
  prayerRowWrapNext: {
    ...C.shadow,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.1)',
  },
  prayerRowWrapActive: { borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.2)' },
  prayerRowWrapCompleted: { opacity: 0.75 },
  swipeBg: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 },
  swipeBgDone: { backgroundColor: C.primary },
  swipeBgUndo: { backgroundColor: C.textMuted },
  swipeText: { color: '#FFF', fontSize: 12, fontFamily: 'Jost_600SemiBold' },
  prayerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceElevated, borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 14, gap: 14},
  prayerRowNext: { backgroundColor: C.bgCard },
  prayerRowActive: { backgroundColor: C.surfaceElevated },
  prayerRowDone: { backgroundColor: '#FAFAFA' },
  prayerIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(202,138,4,0.08)', justifyContent: 'center', alignItems: 'center' },
  prayerIconWrapActive: { backgroundColor: 'rgba(124,58,237,0.1)' },
  prayerIcon: { fontSize: 22 },
  activePulse: { position: 'absolute', width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: C.primary, opacity: 0.3 },
  prayerInfo: { flex: 1 },
  prayerName: { fontSize: 16, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  prayerNameNext: { color: C.primary, fontFamily: 'Jost_700Bold' },
  prayerNameDone: { color: C.textMuted, fontFamily: 'Jost_500Medium', textDecorationLine: 'line-through' },
  prayerArabic: { fontSize: 12, color: C.textMuted, fontFamily: 'Jost_400Regular', marginTop: 1 },
  iqamaBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4, backgroundColor: 'rgba(124,58,237,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  iqamaText: { fontSize: 11, color: C.primary, fontFamily: 'Jost_600SemiBold' },
  prayerRight: { alignItems: 'flex-end', gap: 6 },
  prayerTimeText: { fontSize: 15, color: C.textSecondary, fontFamily: 'Jost_500Medium', fontVariant: ['tabular-nums'] },
  prayerTimeNext: { color: C.primary, fontFamily: 'Jost_700Bold' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.borderStrong, justifyContent: 'center', alignItems: 'center' },
  checkCircleDone: { backgroundColor: C.primary, borderColor: C.primary },
  checkEmpty: { width: 10, height: 10, borderRadius: 5 },

  // Hadith Card
  hadithCard: {
    backgroundColor: C.surfaceElevated,
    borderRadius: 18, padding: 18, marginTop: 16,
    ...C.shadow,
    borderWidth: 1,
    borderColor: C.border,
  },
  hadithHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  hadithTitle: { fontSize: 14, fontFamily: 'Jost_700Bold', color: C.gold },
  hadithText: { fontSize: 14, color: C.textPrimary, lineHeight: 22, fontFamily: 'Jost_400Regular', fontStyle: 'italic' },
  hadithSource: { fontSize: 12, color: C.textMuted, marginTop: 8, textAlign: 'right', fontFamily: 'Jost_500Medium' },

  // Hint
  hintText: { textAlign: 'center', color: C.textMuted, fontSize: 12, fontFamily: 'Jost_400Regular', marginTop: 16 }});
