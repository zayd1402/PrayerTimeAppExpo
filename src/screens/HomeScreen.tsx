import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SectionHeader } from '../components/SectionHeader';
import { C, PrayerId, PrayerTime, AppSettings, PRAYER_ICONS } from '../types';
import { getDateKey } from '../utils/date';
import { gregorianToHijri } from '../services/HijriService';
import {
  bearingToCompassDirection,
  calculateQiblaDirection,
  getTimeUntilNext,
  minutesToTimeString,
} from '../services/PrayerService';
import { loadPrayerLog } from '../services/StorageService';

type Location = { latitude: number; longitude: number; name: string };

const METHOD_LABEL: Record<string, string> = {
  muslim_world_league: 'Muslim World League',
  isna: 'ISNA',
  egyptian: 'Egyptian',
  umm_al_qura: 'Umm Al-Qura',
  karachi: 'Karachi',
};

export function HomeScreen({
  prayerTimes,
  nextPrayer,
  settings,
  location,
  prayerLogVersion,
  currentMinutes,
  onMarkPrayer,
}: {
  prayerTimes: PrayerTime[];
  nextPrayer: PrayerTime | null;
  settings: AppSettings;
  location: Location;
  prayerLogVersion: number;
  currentMinutes: number;
  onMarkPrayer: (id: PrayerId, status: 'prayed' | 'qaza') => void;
}) {
  const [prayerLog, setPrayerLog] = useState<Record<string, string>>({});
  const todayKey = getDateKey(new Date());

  useEffect(() => {
    loadPrayerLog().then(log => {
      setPrayerLog((log[todayKey] as Record<string, string>) || {});
    });
  }, [todayKey, prayerLogVersion]);

  const model = useMemo(() => {
    const today = new Date();
    const hijri = gregorianToHijri(today);
    const trackablePrayers = prayerTimes.filter(p => p.id !== 'sunrise');
    const completedPrayers = trackablePrayers.filter(p => prayerLog[p.id] === 'prayed').length;
    const completionPct = trackablePrayers.length
      ? Math.round((completedPrayers / trackablePrayers.length) * 100)
      : 0;
    const activePrayer = nextPrayer || trackablePrayers.find(p => p.status === 'active') || trackablePrayers[0];
    const activeIndex = Math.max(0, trackablePrayers.findIndex(p => p.id === activePrayer?.id));
    const timelinePct = trackablePrayers.length > 1
      ? Math.round((activeIndex / (trackablePrayers.length - 1)) * 100)
      : 0;
    const qiblaDir = Math.round(calculateQiblaDirection(location.latitude, location.longitude));
    const nextTime = nextPrayer ? minutesToTimeString(nextPrayer.minutes).split(' ') : ['--:--', ''];

    return {
      today,
      hijri,
      trackablePrayers,
      completedPrayers,
      completionPct,
      timelinePct,
      qiblaDir,
      qiblaBearing: bearingToCompassDirection(qiblaDir),
      nextTime,
    };
  }, [location.latitude, location.longitude, nextPrayer, prayerLog, prayerTimes]);

  if (!prayerTimes.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  const openPrayerActions = (prayer: PrayerTime) => {
    if (prayer.id === 'sunrise') return;
    Alert.alert(
      `Mark ${prayer.name}`,
      'Update today\'s prayer status.',
      [
        { text: 'Done', onPress: () => onMarkPrayer(prayer.id, 'prayed') },
        { text: 'Qaza', onPress: () => onMarkPrayer(prayer.id, 'qaza') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getStatus = (prayer: PrayerTime) => {
    const logStatus = prayerLog[prayer.id];
    if (logStatus === 'prayed') return { label: 'Done', tone: 'done' as const, icon: 'checkmark-circle' };
    if (logStatus === 'qaza') return { label: 'Qaza', tone: 'muted' as const, icon: 'time-outline' };
    if (nextPrayer?.id === prayer.id) return { label: 'Next', tone: 'next' as const, icon: 'chevron-forward' };
    if (prayer.minutes < currentMinutes) return { label: 'Passed', tone: 'muted' as const, icon: 'checkmark-circle-outline' };
    return { label: 'Later', tone: 'muted' as const, icon: 'time-outline' };
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      <View style={styles.todayHeader}>
        <View style={styles.todayHeaderCopy}>
          <Text style={styles.todayTitle}>Today</Text>
          <Text style={styles.todayHijri}>
            {model.hijri.day} {model.hijri.monthName} {model.hijri.year}
          </Text>
          <Text style={styles.todayDate}>
            {model.today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.methodPill}>
            <Text style={styles.methodPillText}>{METHOD_LABEL[settings.calculationMethod]}</Text>
          </View>
          <View style={styles.headerIconButton}>
            <Ionicons name={settings.notificationsEnabled ? 'notifications' : 'notifications-outline'} size={18} color={C.gold} />
          </View>
        </View>
      </View>

      <View style={styles.locationLine}>
        <Ionicons name="location-outline" size={15} color={C.navySoft} />
        <Text style={styles.locationText}>{location.name}</Text>
      </View>

      <View style={styles.premiumHero}>
        <View style={styles.heroSkyWash} />
        <View style={styles.heroSun} />
        <View style={styles.heroMosqueDome} />
        <View style={styles.heroMinaret} />
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={20} color={C.gold} />
          </View>
          <Text style={styles.heroKicker}>Next: {nextPrayer?.name || 'Prayer'}</Text>
          <View style={styles.heroDisplayRow}>
            <Text style={styles.heroDisplayTime}>{model.nextTime[0]}</Text>
            <Text style={styles.heroDisplayAmPm}>{model.nextTime[1]}</Text>
          </View>
          <View style={styles.heroDivider} />
          <Text style={styles.heroRemaining}>
            {nextPrayer ? `${getTimeUntilNext(nextPrayer, currentMinutes)} remaining` : 'Calculating'}
          </Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaPill}>
              <Ionicons name="time-outline" size={13} color={C.navySoft} />
              <Text style={styles.heroMetaText}>{nextPrayer?.time || '--:--'}</Text>
            </View>
            <View style={styles.heroMetaPill}>
              <Ionicons name="navigate-outline" size={13} color={C.navySoft} />
              <Text style={styles.heroMetaText}>{model.qiblaDir}° {model.qiblaBearing}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.quickGrid}>
        <View style={styles.quickCard}>
          <View style={[styles.quickIcon, styles.quickIconDone]}>
            <Ionicons name="checkmark" size={17} color={C.bgSurface} />
          </View>
          <View style={styles.quickCopy}>
            <Text style={styles.quickValue}>{model.completedPrayers}/5</Text>
            <Text style={styles.quickLabel}>prayers completed</Text>
          </View>
        </View>
        <View style={styles.quickCard}>
          <View style={styles.quickIcon}>
            <Ionicons name="compass-outline" size={17} color={C.gold} />
          </View>
          <View style={styles.quickCopy}>
            <Text style={styles.quickValue}>Qibla</Text>
            <Text style={styles.quickLabel}>{model.qiblaDir}° {model.qiblaBearing}</Text>
          </View>
        </View>
        <View style={styles.quickCard}>
          <View style={styles.quickIcon}>
            <Ionicons name={settings.fajrAlarmEnabled ? 'alarm' : 'alarm-outline'} size={17} color={settings.fajrAlarmEnabled ? C.emerald : C.textMuted} />
          </View>
          <View style={styles.quickCopy}>
            <Text style={styles.quickValue}>Fajr</Text>
            <Text style={styles.quickLabel}>{settings.fajrAlarmEnabled ? `${settings.fajrAlarmMinutes}m alarm` : 'Alarm off'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.timelineCard}>
        <View style={styles.timelineTrack} />
        <View style={[styles.timelineProgress, { width: `${model.timelinePct}%` }]} />
        <View style={styles.timelineSteps}>
          {model.trackablePrayers.map(prayer => {
            const isComplete = prayerLog[prayer.id] === 'prayed';
            const isNext = nextPrayer?.id === prayer.id;
            return (
              <TouchableOpacity
                key={prayer.id}
                style={styles.timelineStep}
                activeOpacity={0.72}
                onPress={() => openPrayerActions(prayer)}
              >
                <View style={[
                  styles.timelineDot,
                  isComplete && styles.timelineDotDone,
                  isNext && styles.timelineDotNext,
                ]}>
                  <Ionicons
                    name={(isComplete ? 'checkmark' : PRAYER_ICONS[prayer.id].icon) as any}
                    size={isNext ? 16 : 13}
                    color={isComplete ? C.bgSurface : isNext ? C.gold : C.textMuted}
                  />
                </View>
                <Text style={[styles.timelineName, isNext && styles.timelineNameNext]}>{prayer.name}</Text>
                <Text style={[styles.timelineTime, isNext && styles.timelineTimeNext]}>{prayer.time.replace(' ', '')}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.dailyProgressCard}>
        <View style={styles.dailyProgressHeader}>
          <Text style={styles.dailyProgressTitle}>Daily Progress</Text>
          <Text style={styles.dailyProgressPct}>{model.completionPct}%</Text>
        </View>
        <View style={styles.dailyProgressTrack}>
          <View style={[styles.dailyProgressFill, { width: `${model.completionPct}%` }]} />
        </View>
      </View>

      <View style={styles.reflectionCard}>
        <View style={styles.reflectionImage}>
          <View style={styles.reflectionSun} />
          <View style={styles.reflectionDome} />
        </View>
        <View style={styles.reflectionCopy}>
          <Text style={styles.reflectionText}>Indeed, prayer prohibits indecency and wrongdoing.</Text>
          <Text style={styles.reflectionSource}>Al-Quran 29:45</Text>
        </View>
      </View>

      <SectionHeader title="Today's prayers" />
      <View style={styles.scheduleCard}>
        {prayerTimes.map((prayer, i) => {
          const status = getStatus(prayer);
          const isNext = nextPrayer?.id === prayer.id;
          const isSunrise = prayer.id === 'sunrise';
          return (
            <TouchableOpacity
              key={prayer.id}
              style={[
                styles.scheduleRow,
                isNext && styles.scheduleRowNext,
                i > 0 && styles.scheduleRowBorder,
              ]}
              onPress={() => openPrayerActions(prayer)}
              disabled={isSunrise}
              activeOpacity={0.7}
            >
              <View style={[styles.scheduleIcon, isNext && styles.scheduleIconNext]}>
                <Ionicons
                  name={(isNext ? PRAYER_ICONS[prayer.id].iconActive : PRAYER_ICONS[prayer.id].icon) as any}
                  size={18}
                  color={isNext ? C.emerald : C.gold}
                />
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={[styles.scheduleName, isNext && styles.scheduleNameNext]}>
                  {prayer.name}
                </Text>
                <Text style={styles.scheduleArabic}>{prayer.arabic}</Text>
              </View>
              <Text style={[styles.scheduleTime, isNext && styles.scheduleTimeNext]}>
                {prayer.time}
              </Text>
              <View style={[
                styles.scheduleStatus,
                status.tone === 'done' && styles.scheduleStatusDone,
                status.tone === 'next' && styles.scheduleStatusNext,
              ]}>
                <Text style={[
                  styles.scheduleStatusText,
                  status.tone === 'done' && styles.scheduleStatusTextDone,
                  status.tone === 'next' && styles.scheduleStatusTextNext,
                ]}>{status.label}</Text>
                <Ionicons
                  name={status.icon as any}
                  size={13}
                  color={status.tone === 'done' ? C.emerald : status.tone === 'next' ? C.bgSurface : C.textMuted}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  screenPadding: { paddingHorizontal: 20, paddingBottom: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgBase },
  loadingText: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 24, fontWeight: '600', color: C.navy, marginTop: 16 },

  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 8, paddingBottom: 10 },
  todayHeaderCopy: { flex: 1, paddingRight: 12 },
  todayTitle: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 24, fontWeight: '600', color: C.navy, lineHeight: 29 },
  todayHijri: { fontSize: 13, fontWeight: '600', color: C.gold, marginTop: 4 },
  todayDate: { fontSize: 13, fontWeight: '500', color: C.textSecondary, marginTop: 3 },
  headerActions: { alignItems: 'flex-end', gap: 8 },
  methodPill: { maxWidth: 154, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(255,253,249,0.88)', borderWidth: 1, borderColor: C.border },
  methodPillText: { fontSize: 10, fontWeight: '700', color: C.textSecondary },
  headerIconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 }, android: { elevation: 3 } }) },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  locationText: { fontSize: 13, fontWeight: '600', color: C.navySoft },

  premiumHero: { minHeight: 312, borderRadius: 28, overflow: 'hidden', backgroundColor: C.bgSurface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)', marginBottom: 12, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.13, shadowRadius: 28 }, android: { elevation: 7 } }) },
  heroSkyWash: { position: 'absolute', top: -42, left: -40, right: -40, bottom: -20, backgroundColor: '#FFF5DE', opacity: 0.88 },
  heroSun: { position: 'absolute', right: 22, bottom: 44, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(215,180,106,0.30)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' },
  heroMosqueDome: { position: 'absolute', left: 26, bottom: 0, width: 176, height: 96, borderTopLeftRadius: 88, borderTopRightRadius: 88, backgroundColor: 'rgba(7,26,53,0.08)' },
  heroMinaret: { position: 'absolute', left: 30, bottom: 0, width: 18, height: 154, borderTopLeftRadius: 9, borderTopRightRadius: 9, backgroundColor: 'rgba(7,26,53,0.08)' },
  heroContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 30 },
  heroBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,253,249,0.82)', borderWidth: 1, borderColor: 'rgba(184,132,32,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroKicker: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 23, fontWeight: '600', color: C.navy, textAlign: 'center' },
  heroDisplayRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginTop: 4 },
  heroDisplayTime: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 66, fontWeight: '500', color: C.navy, lineHeight: 76 },
  heroDisplayAmPm: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 21, fontWeight: '500', color: C.navy, marginLeft: 5, marginBottom: 12 },
  heroDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, marginTop: 4, marginBottom: 11 },
  heroRemaining: { fontSize: 15, fontWeight: '700', color: C.emerald },
  heroMetaRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  heroMetaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18, backgroundColor: 'rgba(255,253,249,0.70)', borderWidth: 1, borderColor: 'rgba(7,26,53,0.07)' },
  heroMetaText: { fontSize: 11, fontWeight: '700', color: C.navySoft },

  quickGrid: { flexDirection: 'row', gap: 9, marginBottom: 12 },
  quickCard: { flex: 1, minHeight: 74, borderRadius: 16, padding: 12, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12 }, android: { elevation: 3 } }) },
  quickIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(184,132,32,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  quickIconDone: { backgroundColor: C.emerald },
  quickCopy: { minHeight: 30 },
  quickValue: { fontSize: 13, fontWeight: '800', color: C.navy, marginBottom: 2 },
  quickLabel: { fontSize: 10, fontWeight: '600', color: C.textSecondary, lineHeight: 12 },

  timelineCard: { position: 'relative', borderRadius: 18, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingTop: 20, paddingBottom: 14, marginBottom: 12, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12 }, android: { elevation: 3 } }) },
  timelineTrack: { position: 'absolute', left: 30, right: 30, top: 42, height: 2, backgroundColor: 'rgba(7,26,53,0.13)' },
  timelineProgress: { position: 'absolute', left: 30, top: 42, height: 2, backgroundColor: C.emerald },
  timelineSteps: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineStep: { flex: 1, alignItems: 'center' },
  timelineDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.borderStrong, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  timelineDotDone: { backgroundColor: C.emerald, borderColor: C.emerald },
  timelineDotNext: { width: 42, height: 42, borderRadius: 21, marginTop: -4, backgroundColor: '#FFF8E9', borderWidth: 2, borderColor: C.gold, ...Platform.select({ ios: { shadowColor: C.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.28, shadowRadius: 12 }, android: { elevation: 4 } }) },
  timelineName: { fontSize: 10, fontWeight: '700', color: C.textSecondary, textAlign: 'center' },
  timelineNameNext: { color: C.gold },
  timelineTime: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 3, textAlign: 'center' },
  timelineTimeNext: { color: C.gold },

  dailyProgressCard: { borderRadius: 17, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 4 },
  dailyProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dailyProgressTitle: { fontSize: 13, fontWeight: '800', color: C.navy },
  dailyProgressPct: { fontSize: 13, fontWeight: '800', color: C.emerald },
  dailyProgressTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(7,26,53,0.08)', overflow: 'hidden' },
  dailyProgressFill: { height: 8, borderRadius: 4, backgroundColor: C.emerald },

  reflectionCard: { minHeight: 86, borderRadius: 18, overflow: 'hidden', backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'stretch', marginTop: 8, marginBottom: 2 },
  reflectionImage: { width: 104, backgroundColor: '#FFF3D8', overflow: 'hidden' },
  reflectionSun: { position: 'absolute', right: 16, top: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(215,180,106,0.35)' },
  reflectionDome: { position: 'absolute', left: 14, bottom: -16, width: 84, height: 56, borderTopLeftRadius: 42, borderTopRightRadius: 42, backgroundColor: 'rgba(7,26,53,0.09)' },
  reflectionCopy: { flex: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  reflectionText: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 14, lineHeight: 20, fontWeight: '700', color: C.navy },
  reflectionSource: { fontSize: 11, fontWeight: '700', color: C.gold, marginTop: 5 },

  scheduleCard: { overflow: 'hidden', borderRadius: 18, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, marginBottom: 18, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14 }, android: { elevation: 4 } }) },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 66, paddingHorizontal: 14, paddingVertical: 10 },
  scheduleRowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  scheduleRowNext: { backgroundColor: 'rgba(11,122,83,0.08)', borderLeftWidth: 4, borderLeftColor: C.emerald },
  scheduleIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(184,132,32,0.09)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  scheduleIconNext: { backgroundColor: 'rgba(11,122,83,0.12)' },
  scheduleInfo: { flex: 1 },
  scheduleName: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 16, fontWeight: '600', color: C.navy },
  scheduleNameNext: { color: C.emerald },
  scheduleArabic: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  scheduleTime: { minWidth: 70, fontSize: 14, fontWeight: '700', color: C.navy, textAlign: 'right', marginRight: 10 },
  scheduleTimeNext: { color: C.emerald },
  scheduleStatus: { minWidth: 66, height: 28, borderRadius: 14, backgroundColor: 'rgba(7,26,53,0.06)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  scheduleStatusDone: { backgroundColor: C.emeraldPale },
  scheduleStatusNext: { backgroundColor: C.emerald },
  scheduleStatusText: { fontSize: 10, fontWeight: '800', color: C.textMuted },
  scheduleStatusTextDone: { color: C.emerald },
  scheduleStatusTextNext: { color: C.bgSurface },
});
