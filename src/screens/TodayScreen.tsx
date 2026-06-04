import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Animated, Dimensions, PanResponder, Alert, Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, PrayerId, PRAYER_ICONS } from '../types';

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
  { id: 'fajr', name: 'Fajr', arabicName: 'الفجر', icon: 'sunny-outline' },
  { id: 'sunrise', name: 'Sunrise', arabicName: 'الشروق', icon: 'partly-sunny-outline' },
  { id: 'dhuhr', name: 'Dhuhr', arabicName: 'الظهر', icon: 'sun-outline' },
  { id: 'asr', name: 'Asr', arabicName: 'العصر', icon: 'cloud-outline' },
  { id: 'maghrib', name: 'Maghrib', arabicName: 'المغرب', icon: 'moon-outline' },
  { id: 'isha', name: 'Isha', arabicName: 'العشاء', icon: 'moon-outline' },
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

// ─── Prayer Row with Swipe ───────────────────────────────────
function PrayerRow({
  prayer, time, isTrackable, isCompleted, isNext, isActive,
  onToggle, onLongPress, index
}: {
  prayer: Prayer; time: Date; isTrackable: boolean; isCompleted: boolean;
  isNext: boolean; isActive: boolean; onToggle: () => void; onLongPress: () => void;
  index: number;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx > 0) translateX.setValue(Math.min(gesture.dx, 120));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 80 && isTrackable) {
          Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          onToggle();
        } else {
          Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        }
      }})
  ).current;

  const iqama = isTrackable ? getIqamaTime(prayer.id, time) : null;
  const iqamaCountdown = iqama && isNext ? getTimeUntil(iqama) : null;

  const rowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rowScale, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
          Animated.timing(rowScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isActive]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.prayerRowWrap,
        { transform: [{ translateX }, { scale: rowScale }] },
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
          <Ionicons name={prayer.icon as any} size={22} color={isActive ? C.emerald : C.textSecondary} />
          {isActive && <View style={styles.activePulse} />}
        </View>

        <View style={styles.prayerInfo}>
          <Text style={[styles.prayerName, isNext && styles.prayerNameNext, isCompleted && styles.prayerNameDone]}>
            {prayer.name}
          </Text>
          <Text style={styles.prayerArabic}>{prayer.arabicName}</Text>
          {iqamaCountdown && (
            <View style={styles.iqamaBadge}>
              <Ionicons name="time-outline" size={10} color={C.emerald} />
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
export default function TodayScreen({
  prayerTimes, nextPrayer, nextPrayerTime, completedPrayers,
  locationName, hijriDate, timerDisplay, togglePrayer, dailyHadith
}: TodayScreenProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const entries = [
    { prayer: PRAYERS[0], time: prayerTimes.fajr },
    { prayer: PRAYERS[1], time: prayerTimes.sunrise },
    { prayer: PRAYERS[2], time: prayerTimes.dhuhr },
    { prayer: PRAYERS[3], time: prayerTimes.asr },
    { prayer: PRAYERS[4], time: prayerTimes.maghrib },
    { prayer: PRAYERS[5], time: prayerTimes.isha },
  ];

  const completedCount = TRACKABLE.filter(id => completedPrayers.has(id)).length;

  const heroScale = scrollY.interpolate({
    inputRange: [0, 150], outputRange: [1, 0.92], extrapolate: 'clamp'
  });
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 120], outputRange: [1, 0.7], extrapolate: 'clamp'
  });

  const handleToggle = (id: string) => {
    Vibration.vibrate(30);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
    >
      {/* Hero Card */}
      <Animated.View style={[styles.heroCard, { transform: [{ scale: heroScale }], opacity: heroOpacity }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroLeft}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.locationText}>{locationName}</Text>
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
      </Animated.View>

      {/* Hijri Date */}
      <View style={styles.hijriRow}>
        <Ionicons name="calendar-outline" size={14} color={C.textMuted} />
        <Text style={styles.hijriText}>{hijriDate}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { padding: 18, paddingBottom: 120 },

  // Hero
  heroCard: {
    backgroundColor: C.heroBg,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLeft: { flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  locationText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  nextPrayerText: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  nextPrayerTime: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 2 },
  timerText: { color: C.timerAmber, fontSize: 36, fontWeight: '700', marginTop: 12, fontVariant: ['tabular-nums'] },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: C.gold, borderRadius: 3 },
  progressText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', fontVariant: ['tabular-nums'] },

  // Ring
  ringContainer: { justifyContent: 'center', alignItems: 'center' },
  ringBg: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.1)' },
  ringSvg: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  ringTrack: { position: 'absolute' },
  ringFill: { position: 'absolute' },
  ringText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  // Hijri
  hijriRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 },
  hijriText: { textAlign: 'center', color: C.textSecondary, fontSize: 14, fontWeight: '500' },

  // Prayer List
  prayerList: { gap: 10 },

  // Prayer Row
  prayerRowWrap: { borderRadius: 18, overflow: 'hidden', marginBottom: 2 },
  prayerRowWrapNext: { shadowColor: C.emerald, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8},
  prayerRowWrapActive: { borderWidth: 1.5, borderColor: 'rgba(15,122,79,0.3)' },
  prayerRowWrapCompleted: { opacity: 0.75 },
  swipeBg: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 },
  swipeBgDone: { backgroundColor: C.emerald },
  swipeBgUndo: { backgroundColor: C.textMuted },
  swipeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  prayerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgSurface, borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 14, gap: 14},
  prayerRowNext: { backgroundColor: '#F0FAF5' },
  prayerRowActive: { backgroundColor: '#E8F5F0' },
  prayerRowDone: { backgroundColor: '#FAFAFA' },
  prayerIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F5F5F0', justifyContent: 'center', alignItems: 'center' },
  prayerIconWrapActive: { backgroundColor: 'rgba(15,122,79,0.12)' },
  prayerIcon: { fontSize: 22 },
  activePulse: { position: 'absolute', width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: C.emerald, opacity: 0.4 },
  prayerInfo: { flex: 1 },
  prayerName: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  prayerNameNext: { color: C.emerald, fontWeight: '700' },
  prayerNameDone: { color: C.textMuted, textDecorationLine: 'line-through' },
  prayerArabic: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  iqamaBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4, backgroundColor: 'rgba(15,122,79,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  iqamaText: { fontSize: 11, color: C.emerald, fontWeight: '600' },
  prayerRight: { alignItems: 'flex-end', gap: 6 },
  prayerTimeText: { fontSize: 15, color: C.textSecondary, fontWeight: '500', fontVariant: ['tabular-nums'] },
  prayerTimeNext: { color: C.emerald, fontWeight: '700' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.borderStrong, justifyContent: 'center', alignItems: 'center' },
  checkCircleDone: { backgroundColor: C.emerald, borderColor: C.emerald },
  checkEmpty: { width: 10, height: 10, borderRadius: 5 },

  // Hadith Card
  hadithCard: { backgroundColor: C.bgSurface, borderRadius: 18, padding: 18, marginTop: 16 },
  hadithHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  hadithTitle: { fontSize: 14, fontWeight: '700', color: C.gold },
  hadithText: { fontSize: 14, color: C.textPrimary, lineHeight: 22, fontStyle: 'italic' },
  hadithSource: { fontSize: 12, color: C.textMuted, marginTop: 8, textAlign: 'right' },

  // Hint
  hintText: { textAlign: 'center', color: C.textMuted, fontSize: 12, marginTop: 16 }});
