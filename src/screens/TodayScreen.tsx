import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Animated, Dimensions, PanResponder, Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, PrayerId, PRAYER_ICONS } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useSnackbar } from '../components/Snackbar';
import { BottomSheet, SheetAction } from '../components/BottomSheet';
import { Fab } from '../components/Fab';

const { width } = Dimensions.get('window');

interface PrayerTimes {
  fajr: Date; sunrise: Date; dhuhr: Date; asr: Date; maghrib: Date; isha: Date;
}
interface Prayer { id: string; name: string; arabicName: string; icon: string; }

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
  const iqamaMinutes: Record<string, number> = { fajr: 20, dhuhr: 15, asr: 15, maghrib: 5, isha: 15 };
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
  const { c, type } = useTheme();
  const size = 58;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = completed / total;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View
      style={[styles.ringContainer, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityLabel={`${completed} of ${total} prayers completed`}
      accessibilityValue={{ min: 0, max: total, now: completed }}
    >
      <View style={[styles.ringBg, { width: size, height: size, borderRadius: size / 2, backgroundColor: c.bgTint }]} />
      <View style={styles.ringSvg}>
        <View style={[styles.ringTrack, {
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: c.bgTint,
        }]} />
        <Animated.View style={[styles.ringFill, {
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: c.gold,
          borderTopColor: c.gold,
          borderRightColor: progress > 0.25 ? c.gold : 'transparent',
          borderBottomColor: progress > 0.5 ? c.gold : 'transparent',
          borderLeftColor: progress > 0.75 ? c.gold : 'transparent',
          transform: [{ rotate: `${-90 + progress * 360}deg` }],
        }]} />
      </View>
      <Text style={[type.label, { color: '#FFF', fontSize: 14, fontWeight: '700' }]}>
        {completed}/{total}
      </Text>
    </View>
  );
}

// ─── Prayer Row with Swipe ───────────────────────────────────
function PrayerRow({
  prayer, time, isTrackable, isCompleted, isNext, isActive,
  onToggle, onLongPress, index,
}: {
  prayer: Prayer; time: Date; isTrackable: boolean; isCompleted: boolean;
  isNext: boolean; isActive: boolean; onToggle: () => void; onLongPress: () => void;
  index: number;
}) {
  const { c, type, radius, elevation } = useTheme();
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
        { transform: [{ translateX }, { scale: rowScale }] },
        isNext && elevation.level2,
        isNext && { shadowColor: c.emerald },
      ]}
    >
      {/* Swipe reveal background */}
      <View
        style={[
          styles.swipeBg,
          { backgroundColor: isCompleted ? c.textMuted : c.emerald, borderRadius: radius.lg },
        ]}
      >
        <Ionicons name={isCompleted ? 'arrow-undo' : 'checkmark'} size={24} color="#FFF" />
        <Text style={[type.label, { color: '#FFF', fontSize: 12, fontWeight: '600' }]}>
          {isCompleted ? 'Undo' : 'Prayed'}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={isTrackable ? onToggle : undefined}
        onLongPress={onLongPress}
        accessibilityRole={isTrackable ? 'checkbox' : 'text'}
        accessibilityLabel={`${prayer.name} prayer at ${formatTime(time)}${isCompleted ? ', marked as prayed' : ''}${isNext ? ', next prayer' : ''}`}
        accessibilityState={{ checked: isCompleted, disabled: !isTrackable }}
        accessibilityHint={isTrackable ? 'Tap to mark as prayed. Swipe right to confirm. Long press for more options.' : undefined}
        style={[
          styles.prayerRow,
          {
            backgroundColor: isCompleted ? c.bgPassed : isActive ? c.bgActive : isNext ? c.bgPrayed : c.bgSurface,
            borderRadius: radius.lg,
            borderWidth: isActive ? 1.5 : 0,
            borderColor: isActive ? c.emerald : 'transparent',
            opacity: isCompleted ? 0.78 : 1,
          },
        ]}
      >
        <View style={[
          styles.prayerIconWrap,
          { backgroundColor: isActive ? c.bgTint : c.bgMuted, borderRadius: 12 },
        ]}>
          <Ionicons
            name={prayer.icon as any}
            size={22}
            color={isActive ? c.emerald : c.textSecondary}
          />
          {isActive && <View style={[styles.activePulse, { borderColor: c.emerald }]} />}
        </View>

        <View style={styles.prayerInfo}>
          <Text style={[
            type.title,
            {
              color: isCompleted ? c.textMuted : c.textPrimary,
              textDecorationLine: isCompleted ? 'line-through' : 'none',
              fontWeight: isNext ? '700' : '600',
            },
          ]}>
            {prayer.name}
          </Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 1 }]}>
            {prayer.arabicName}
          </Text>
          {iqamaCountdown && (
            <View style={[styles.iqamaBadge, { backgroundColor: c.bgTint }]}>
              <Ionicons name="time-outline" size={10} color={c.emerald} />
              <Text style={[type.caption, { color: c.emerald, fontWeight: '600' }]}>
                Iqama in {iqamaCountdown}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.prayerRight}>
          <Text style={[
            type.body,
            {
              color: isNext ? c.emerald : c.textSecondary,
              fontWeight: isNext ? '700' : '500',
            },
          ]}>
            {formatTime(time)}
          </Text>
          {isTrackable && (
            <View
              style={[
                styles.checkCircle,
                {
                  borderColor: isCompleted ? c.emerald : c.borderStrong,
                  backgroundColor: isCompleted ? c.emerald : 'transparent',
                },
              ]}
            >
              {isCompleted && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Daily Hadith Card ───────────────────────────────────────
function DailyHadithCard({ hadith }: { hadith: { english: string; source: string } | null }) {
  const { c, type, radius } = useTheme();
  if (!hadith) return null;
  return (
    <View
      style={[styles.hadithCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg }]}
      accessibilityRole="text"
    >
      <View style={styles.hadithHeader}>
        <Ionicons name="book-outline" size={16} color={c.gold} />
        <Text style={[type.label, { color: c.gold, fontWeight: '700' }]}>Hadith of the Day</Text>
      </View>
      <Text style={[type.body, { color: c.textPrimary, lineHeight: 22, fontStyle: 'italic' }]} numberOfLines={3}>
        {hadith.english}
      </Text>
      <Text style={[type.caption, { color: c.textMuted, marginTop: 8, textAlign: 'right' }]}>
        — {hadith.source}
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function TodayScreen({
  prayerTimes, nextPrayer, nextPrayerTime, completedPrayers,
  locationName, hijriDate, timerDisplay, togglePrayer, dailyHadith,
}: TodayScreenProps) {
  const { c, type, radius, elevation } = useTheme();
  const { show } = useSnackbar();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [statusSheet, setStatusSheet] = useState<Prayer | null>(null);

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
    inputRange: [0, 150], outputRange: [1, 0.92], extrapolate: 'clamp',
  });
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 120], outputRange: [1, 0.7], extrapolate: 'clamp',
  });

  const handleToggle = (id: string) => {
    Vibration.vibrate(30);
    const wasCompleted = completedPrayers.has(id);
    togglePrayer(id);
    const prayerName = PRAYERS.find(p => p.id === id)?.name ?? id;
    if (!wasCompleted) {
      show({
        message: `${prayerName} marked as prayed`,
        variant: 'success',
        icon: 'checkmark-circle',
        duration: 3000,
        action: { label: 'Undo', onPress: () => togglePrayer(id) },
      });
    }
  };

  const handleLongPress = (prayer: Prayer) => {
    if (!TRACKABLE.includes(prayer.id)) return;
    setStatusSheet(prayer);
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bgBase }}
        contentContainerStyle={{ padding: 18, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        {/* Hero Card */}
        <Animated.View
          style={[
            styles.heroCard,
            {
              backgroundColor: c.heroBg,
              borderRadius: radius.xl,
              transform: [{ scale: heroScale }],
              opacity: heroOpacity,
            },
            elevation.level2,
          ]}
          accessibilityLabel={`Today's prayer summary. Location: ${locationName}. ${nextPrayer ? `Next prayer: ${nextPrayer.name} at ${nextPrayerTime ? formatTime(nextPrayerTime) : ''}` : 'All prayers complete.'}. ${completedCount} of 5 prayers completed.`}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={c.onDarkMuted} />
                <Text style={[type.label, { color: c.onDarkMuted, fontSize: 13 }]}>{locationName}</Text>
              </View>
              <Text style={[type.display, { color: c.onHero, fontSize: 30, marginTop: 6 }]}>
                {nextPrayer ? nextPrayer.name : 'All Complete'}
              </Text>
              <Text style={[type.body, { color: c.onDarkMuted, marginTop: 2 }]}>
                {nextPrayer && nextPrayerTime ? `at ${formatTime(nextPrayerTime)}` : 'All prayers tracked'}
              </Text>
            </View>
            <PrayerRing completed={completedCount} total={5} />
          </View>

          {nextPrayerTime && (
            <Text
              style={[type.display, { color: c.timerAmber, marginTop: 16, fontVariant: ['tabular-nums'] }]}
              accessibilityLabel={`${timerDisplay} until next prayer`}
            >
              {timerDisplay}
            </Text>
          )}

          <View style={styles.progressRow}>
            <View style={[styles.progressBar, { backgroundColor: c.bgTint }]}>
              <Animated.View
                style={[styles.progressFill, { backgroundColor: c.gold, width: `${(completedCount / 5) * 100}%` }]}
              />
            </View>
            <Text style={[type.body, { color: c.onHero, fontWeight: '700', fontVariant: ['tabular-nums'] }]}>
              {completedCount}/5
            </Text>
          </View>
        </Animated.View>

        {/* Hijri Date */}
        <View style={styles.hijriRow}>
          <Ionicons name="calendar-outline" size={14} color={c.textMuted} />
          <Text style={[type.body, { color: c.textSecondary, fontWeight: '500' }]}>{hijriDate}</Text>
        </View>

        {/* Prayer List */}
        <View style={styles.prayerList}>
          {entries.map(({ prayer, time }) => {
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
                index={0}
              />
            );
          })}
        </View>

        {/* Daily Hadith */}
        <DailyHadithCard hadith={dailyHadith ?? null} />

        {/* Hint */}
        <Text style={[type.caption, { textAlign: 'center', color: c.textMuted, marginTop: 16 }]}>
          Tap to mark • Swipe right to confirm • Long press for options
        </Text>
      </ScrollView>

      {/* Prayer status sheet (long-press) */}
      <BottomSheet
        visible={!!statusSheet}
        onClose={() => setStatusSheet(null)}
        title={statusSheet ? `${statusSheet.name} prayer` : ''}
        subtitle="How did you pray?"
      >
        <SheetAction
          label="Prayed on time"
          icon="checkmark-circle"
          description="You prayed at the scheduled time"
          variant="primary"
          onPress={() => { togglePrayer(statusSheet!.id); show({ message: `${statusSheet!.name} marked as prayed`, variant: 'success', icon: 'checkmark-circle' }); setStatusSheet(null); }}
        />
        <SheetAction
          label="Prayed late (Qaza)"
          icon="time-outline"
          description="You prayed but outside the preferred window"
          onPress={() => { togglePrayer(statusSheet!.id); show({ message: `${statusSheet!.name} marked as qaza` }); setStatusSheet(null); }}
        />
        <SheetAction
          label="Cancel"
          icon="close"
          onPress={() => setStatusSheet(null)}
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  // Hero
  heroCard: { padding: 20, marginBottom: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLeft: { flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // Ring
  ringContainer: { justifyContent: 'center', alignItems: 'center' },
  ringBg: { position: 'absolute' },
  ringSvg: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  ringTrack: { position: 'absolute' },
  ringFill: { position: 'absolute' },

  // Hijri
  hijriRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 },

  // Prayer List
  prayerList: { gap: 10 },

  // Prayer Row
  swipeBg: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 },
  prayerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  prayerIconWrap: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  activePulse: { position: 'absolute', width: 44, height: 44, borderRadius: 12, borderWidth: 2, opacity: 0.4 },
  prayerInfo: { flex: 1 },
  iqamaBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  prayerRight: { alignItems: 'flex-end', gap: 6 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },

  // Hadith Card
  hadithCard: { padding: 18, marginTop: 16 },
  hadithHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
});
