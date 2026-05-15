import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PrayerActionSheet } from '../components/PrayerActionSheet';
import { C, AppSettings, CalendarEventSummary, PrayerId, PrayerTime } from '../types';
import { getDateKey } from '../utils/date';
import { gregorianToHijri, HijriService } from '../services/HijriService';
import { getPrayerTimesObject } from '../services/PrayerService';
import { getDeviceCalendarEventsForDay, hasDeviceCalendarPermission } from '../services/CalendarIntegrationService';
import { loadPrayerLog } from '../services/StorageService';

type Location = { latitude: number; longitude: number; name: string };

export function CalendarScreen({
  settings,
  location,
  prayerLogVersion = 0,
  onMarkPrayer,
  bottomInset = 0,
}: {
  settings: AppSettings;
  location: Location;
  prayerLogVersion?: number;
  onMarkPrayer: (dateKey: string, id: PrayerId, status: 'prayed' | 'qaza') => Promise<void>;
  bottomInset?: number;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prayerLog, setPrayerLog] = useState<Record<string, Record<string, string>>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerTime | null>(null);
  const [actionDateKey, setActionDateKey] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventSummary[]>([]);
  const [calendarState, setCalendarState] = useState<'off' | 'loading' | 'ready' | 'denied'>('off');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayKey = getDateKey(new Date());

  useEffect(() => {
    loadPrayerLog().then(setPrayerLog);
  }, [prayerLogVersion]);

  const grid = HijriService.getMonthGrid(year, month);
  const hijriCurrent = HijriService.gregorianToHijri(new Date(year, month, 15));
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const hijriMonthStr = `${hijriCurrent.monthNameArabic} ${hijriCurrent.year}`;
  const monthPrayedDays = Object.entries(prayerLog).filter(([date, dayLog]) => {
    const dt = new Date(date + 'T12:00:00');
    if (dt.getFullYear() !== year || dt.getMonth() !== month) return false;
    return Object.entries(dayLog).filter(([id, s]) => id !== 'sunrise' && s === 'prayed').length >= 5;
  }).length;
  const defaultSelectedDate = selectedDate || todayKey;
  const selectedDateObject = useMemo(() => new Date(defaultSelectedDate + 'T12:00:00'), [defaultSelectedDate]);

  useEffect(() => {
    let cancelled = false;
    const loadEvents = async () => {
      if (!settings.calendarIntegrationEnabled) {
        setCalendarState('off');
        setCalendarEvents([]);
        return;
      }

      setCalendarState('loading');
      const granted = await hasDeviceCalendarPermission();
      if (!granted) {
        if (!cancelled) {
          setCalendarState('denied');
          setCalendarEvents([]);
        }
        return;
      }

      const events = await getDeviceCalendarEventsForDay(selectedDateObject, settings.visibleCalendarIds);
      if (!cancelled) {
        setCalendarEvents(events);
        setCalendarState('ready');
      }
    };

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, [selectedDateObject, settings.calendarIntegrationEnabled, settings.visibleCalendarIds]);

  const selectedDayLog = prayerLog[defaultSelectedDate] || {};
  const selectedPrayerTimes = useMemo(() => getPrayerTimesObject(
    selectedDateObject,
    location.latitude,
    location.longitude,
    settings.calculationMethod,
    settings.madhab,
    0
  ), [location.latitude, location.longitude, selectedDateObject, settings.calculationMethod, settings.madhab]);

  const selectedComplete = selectedPrayerTimes.filter((t: PrayerTime) => t.id !== 'sunrise' && selectedDayLog[t.id] === 'prayed').length;
  const selectedQaza = selectedPrayerTimes.filter((t: PrayerTime) => t.id !== 'sunrise' && selectedDayLog[t.id] === 'qaza').length;
  const weekActivity = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(selectedDateObject);
      day.setDate(day.getDate() - (6 - index));
      const dateKey = getDateKey(day);
      const log = prayerLog[dateKey] || {};
      return {
        key: dateKey,
        label: day.toLocaleDateString('en-AU', { weekday: 'short' }).slice(0, 1),
        count: Object.entries(log).filter(([id, status]) => id !== 'sunrise' && status === 'prayed').length,
      };
    });
  }, [prayerLog, selectedDateObject]);

  const openPrayerActions = (dateKey: string, prayer: PrayerTime) => {
    setActionDateKey(dateKey);
    setSelectedPrayer(prayer);
  };

  const updatePrayerStatus = async (status: 'prayed' | 'qaza') => {
    if (!selectedPrayer || !actionDateKey) return;
    await onMarkPrayer(actionDateKey, selectedPrayer.id as PrayerId, status);
    setPrayerLog(await loadPrayerLog());
    setSelectedPrayer(null);
    setActionDateKey(null);
  };

  const formatEventTime = (event: CalendarEventSummary) => {
    if (event.isAllDay) return 'All day';
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const format = (date: Date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
    return `${format(start)} - ${format(end)}`;
  };

  const plannerItems = useMemo(() => {
    const prayers = selectedPrayerTimes
      .filter((prayer: PrayerTime) => prayer.id !== 'sunrise')
      .map((prayer: PrayerTime) => ({
        type: 'prayer' as const,
        key: `prayer-${prayer.id}`,
        sortMinutes: prayer.minutes,
        prayer,
      }));
    const events = calendarEvents.map(event => {
      const start = new Date(event.startDate);
      return {
        type: 'event' as const,
        key: `event-${event.id}`,
        sortMinutes: event.isAllDay ? -1 : start.getHours() * 60 + start.getMinutes(),
        event,
      };
    });
    return [...events, ...prayers].sort((a, b) => a.sortMinutes - b.sortMinutes);
  }, [calendarEvents, selectedPrayerTimes]);

  return (
    <>
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.screenPadding, { paddingBottom: 108 + bottomInset }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.calendarHero}>
        <View style={styles.calendarHeroWash} />
        <View style={styles.calendarHeroContent}>
          <View>
            <Text style={styles.calendarEyebrow}>Prayer calendar</Text>
            <Text style={styles.calMonth}>{monthName}</Text>
            <Text style={styles.calHijri}>{hijriMonthStr}</Text>
          </View>
          <View style={styles.monthScore}>
            <Text style={styles.monthScoreValue}>{monthPrayedDays}</Text>
            <Text style={styles.monthScoreLabel}>complete days</Text>
          </View>
        </View>
        <View style={styles.calNav}>
          <TouchableOpacity style={styles.calNavBtn} onPress={() => setCurrentDate(new Date(year, month - 1, 1))} activeOpacity={0.72}>
            <Ionicons name="chevron-back" size={16} color={C.navy} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.calNavBtn} onPress={() => setCurrentDate(new Date(year, month + 1, 1))} activeOpacity={0.72}>
            <Ionicons name="chevron-forward" size={16} color={C.navy} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.activitySummaryCard}>
        <View style={styles.dayRing}>
          <Text style={styles.dayRingValue}>{selectedComplete}/5</Text>
          <Text style={styles.dayRingLabel}>done</Text>
        </View>
        <View style={styles.daySummaryCopy}>
          <View style={styles.daySummaryTop}>
            <Text style={styles.daySummaryTitle}>Selected day activity</Text>
            <Text style={styles.daySummaryMeta}>{selectedQaza ? `${selectedQaza} qaza` : 'On track'}</Text>
          </View>
          <View style={styles.weekStrip}>
            {weekActivity.map(day => (
              <View key={day.key} style={styles.weekCell}>
                <View
                  style={[
                    styles.weekHeat,
                    day.count === 1 && styles.weekHeat1,
                    day.count === 2 && styles.weekHeat2,
                    day.count === 3 && styles.weekHeat3,
                    day.count === 4 && styles.weekHeat4,
                    day.count >= 5 && styles.weekHeat5,
                  ]}
                />
                <Text style={styles.weekLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.calWeekdays}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <Text key={d} style={styles.calWeekday}>{d}</Text>
          ))}
        </View>

        <View style={styles.calGrid}>
          {grid.map((cell: { gregorian: Date; hijri: { day: number; monthNameArabic: string }; isCurrentMonth: boolean }, idx: number) => {
            const { gregorian, hijri, isCurrentMonth } = cell;
            const dateKey = getDateKey(gregorian);
            const isToday = dateKey === todayKey;
            const dayLog = prayerLog[dateKey];
            const prayedCount = dayLog ? Object.entries(dayLog).filter(([id, s]) => id !== 'sunrise' && s === 'prayed').length : 0;
            const isSelected = dateKey === selectedDate;

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.calDay,
                  prayedCount === 1 && styles.calDayHeat1,
                  prayedCount === 2 && styles.calDayHeat2,
                  prayedCount === 3 && styles.calDayHeat3,
                  prayedCount === 4 && styles.calDayHeat4,
                  prayedCount >= 5 && styles.calDayHeat5,
                  !isCurrentMonth && styles.calDayOther,
                  isToday && styles.calDayToday,
                  isSelected && styles.calDaySelected,
                ]}
                onPress={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
                activeOpacity={0.72}
              >
                <Text style={[
                  styles.calDayNum,
                  isToday && styles.calDayNumToday,
                  !isCurrentMonth && styles.calDayNumOther,
                ]}>
                  {gregorian.getDate()}
                </Text>
                {isCurrentMonth && (
                  <Text style={[styles.calDayHijri, prayedCount > 0 && styles.calDayHijriPrayed]}>
                    {hijri.day}
                  </Text>
                )}
                {prayedCount >= 5 && <View style={styles.calPrayedDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.heatLegend}>
        <Text style={styles.heatLegendText}>Prayer activity</Text>
        {[0, 1, 2, 3, 4, 5].map(level => (
          <View
            key={level}
            style={[
              styles.heatLegendDot,
              level === 1 && styles.calDayHeat1,
              level === 2 && styles.calDayHeat2,
              level === 3 && styles.calDayHeat3,
              level === 4 && styles.calDayHeat4,
              level === 5 && styles.calDayHeat5,
            ]}
          />
        ))}
        <Text style={styles.heatLegendText}>5/5</Text>
      </View>

      {defaultSelectedDate && (
        <View style={styles.calDetail}>
          {(() => {
            const selected = new Date(defaultSelectedDate + 'T12:00:00');
            const hijri = gregorianToHijri(selected);
            return (
              <>
                <View style={styles.calDetailHeader}>
                  <View>
                    <Text style={styles.calDetailDate}>
                      {selected.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                    <Text style={styles.calDetailHijri}>
                      {hijri.day} {hijri.monthNameArabic} {hijri.year}
                    </Text>
                  </View>
                  <View style={styles.calDetailScore}>
                    <Text style={styles.calDetailScoreText}>{selectedComplete}/5</Text>
                  </View>
                </View>
                <View style={styles.calendarStatusRow}>
                  <Ionicons
                    name={calendarState === 'ready' ? 'calendar' : calendarState === 'denied' ? 'lock-closed-outline' : 'calendar-outline'}
                    size={14}
                    color={calendarState === 'ready' ? C.emerald : C.textMuted}
                  />
                  <Text style={styles.calendarStatusText}>
                    {calendarState === 'off' && 'Device calendar is off in Settings.'}
                    {calendarState === 'loading' && 'Loading device calendar events...'}
                    {calendarState === 'denied' && 'Calendar permission is not enabled.'}
                    {calendarState === 'ready' && (calendarEvents.length ? `${calendarEvents.length} event${calendarEvents.length === 1 ? '' : 's'} synced for this day.` : 'No calendar events for this day.')}
                  </Text>
                </View>
                {plannerItems.map(item => {
                  if (item.type === 'event') {
                    return (
                      <View key={item.key} style={styles.eventRow}>
                        <View style={[styles.eventColor, { backgroundColor: item.event.calendarColor || C.gold }]} />
                        <View style={styles.eventCopy}>
                          <Text style={styles.eventTitle}>{item.event.title || 'Calendar event'}</Text>
                          <Text style={styles.eventMeta}>{formatEventTime(item.event)} · {item.event.calendarTitle}</Text>
                        </View>
                      </View>
                    );
                  }
                  const p = item.prayer;
                  return (
                    <TouchableOpacity key={item.key} style={styles.calDetailRow} onPress={() => openPrayerActions(defaultSelectedDate, p)} activeOpacity={0.72}>
                      <Text style={styles.calDetailPrayer}>{p.name}</Text>
                      <Text style={styles.calDetailTime}>{p.time}</Text>
                      {selectedDayLog[p.id] === 'prayed' && <Ionicons name="checkmark-circle" size={16} color={C.emerald} />}
                      {selectedDayLog[p.id] === 'qaza' && <Text style={styles.calDetailQaza}>Qaza</Text>}
                      {!selectedDayLog[p.id] && <Ionicons name="add-circle-outline" size={16} color={C.textMuted} />}
                    </TouchableOpacity>
                  );
                })}
              </>
            );
          })()}
        </View>
      )}
    </ScrollView>
    <PrayerActionSheet
      prayer={selectedPrayer}
      visible={Boolean(selectedPrayer)}
      context={selectedDate ? 'Update this calendar date.' : 'Update today in your calendar.'}
      onClose={() => {
        setSelectedPrayer(null);
        setActionDateKey(null);
      }}
      onDone={() => updatePrayerStatus('prayed')}
      onQaza={() => updatePrayerStatus('qaza')}
    />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  screenPadding: { paddingHorizontal: 20, paddingBottom: 128 },
  calendarHero: { position: 'relative', overflow: 'hidden', borderRadius: 24, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, padding: 18, marginTop: 8, marginBottom: 14, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 22 }, android: { elevation: 5 } }) },
  calendarHeroWash: { position: 'absolute', right: -50, top: -38, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(215,180,106,0.20)' },
  calendarHeroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarEyebrow: { fontSize: 11, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  calMonth: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 25, fontWeight: '800', color: C.navy, marginTop: 6 },
  calHijri: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 14, color: C.gold, marginTop: 4, fontWeight: '700' },
  monthScore: { minWidth: 88, minHeight: 70, borderRadius: 18, backgroundColor: 'rgba(255,253,249,0.72)', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  monthScoreValue: { fontSize: 25, fontWeight: '900', color: C.emerald },
  monthScoreLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, marginTop: 2 },
  calNav: { flexDirection: 'row', gap: 8, marginTop: 16 },
  calNavBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }, android: { elevation: 2 } }) },
  activitySummaryCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 12, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.07, shadowRadius: 12 }, android: { elevation: 3 } }) },
  dayRing: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: C.emeraldPale, borderWidth: 7, borderColor: C.emerald },
  dayRingValue: { fontSize: 15, fontWeight: '900', color: C.emerald },
  dayRingLabel: { fontSize: 9, fontWeight: '800', color: C.textMuted, marginTop: 1 },
  daySummaryCopy: { flex: 1 },
  daySummaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  daySummaryTitle: { fontSize: 14, fontWeight: '900', color: C.navy },
  daySummaryMeta: { fontSize: 11, fontWeight: '800', color: C.gold },
  weekStrip: { flexDirection: 'row', gap: 7 },
  weekCell: { alignItems: 'center', gap: 4 },
  weekHeat: { width: 18, height: 18, borderRadius: 5, backgroundColor: 'rgba(7,26,53,0.05)', borderWidth: 1, borderColor: C.border },
  weekHeat1: { backgroundColor: 'rgba(11,122,83,0.10)' },
  weekHeat2: { backgroundColor: 'rgba(11,122,83,0.16)' },
  weekHeat3: { backgroundColor: 'rgba(11,122,83,0.24)' },
  weekHeat4: { backgroundColor: 'rgba(11,122,83,0.34)' },
  weekHeat5: { backgroundColor: C.emerald },
  weekLabel: { fontSize: 9, fontWeight: '800', color: C.textMuted },
  calendarCard: { borderRadius: 22, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, padding: 12, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18 }, android: { elevation: 4 } }) },
  heatLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  heatLegendText: { fontSize: 10, fontWeight: '800', color: C.textMuted },
  heatLegendDot: { width: 13, height: 13, borderRadius: 4, backgroundColor: 'rgba(7,26,53,0.05)', borderWidth: 1, borderColor: C.border },
  calWeekdays: { flexDirection: 'row', marginBottom: 8 },
  calWeekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 0.5 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  calDayHeat1: { backgroundColor: 'rgba(11,122,83,0.06)' },
  calDayHeat2: { backgroundColor: 'rgba(11,122,83,0.10)' },
  calDayHeat3: { backgroundColor: 'rgba(11,122,83,0.15)' },
  calDayHeat4: { backgroundColor: 'rgba(11,122,83,0.20)' },
  calDayHeat5: { backgroundColor: C.emeraldPale },
  calDayOther: { opacity: 0.3 },
  calDayToday: { backgroundColor: C.goldPale },
  calDaySelected: { backgroundColor: 'rgba(184,137,47,0.15)', borderWidth: 2, borderColor: C.gold },
  calDayNum: { fontSize: 14, fontWeight: '500', color: C.textPrimary },
  calDayNumToday: { color: C.gold, fontWeight: '700' },
  calDayNumOther: { color: C.textMuted },
  calDayHijri: { fontSize: 9, color: C.textMuted, marginTop: 2 },
  calDayHijriPrayed: { color: C.emerald },
  calPrayedDot: { position: 'absolute', bottom: 6, width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.emerald },
  calDetail: { backgroundColor: C.bgSurface, borderRadius: 18, padding: 16, marginTop: 12, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 }, android: { elevation: 3 } }) },
  calDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calDetailDate: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 17, fontWeight: '800', color: C.navy },
  calDetailHijri: { fontSize: 13, color: C.gold, marginTop: 2, marginBottom: 12 },
  calDetailScore: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: C.emeraldPale },
  calDetailScoreText: { fontSize: 13, fontWeight: '900', color: C.emerald },
  calendarStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, backgroundColor: 'rgba(7,26,53,0.04)', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  calendarStatusText: { flex: 1, fontSize: 11, fontWeight: '700', color: C.textSecondary },
  calDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border },
  calDetailPrayer: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 15, color: C.navy, flex: 1, fontWeight: '700' },
  calDetailTime: { fontSize: 13, color: C.textMuted, marginRight: 8 },
  calDetailQaza: { overflow: 'hidden', borderRadius: 11, backgroundColor: C.goldPale, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, color: C.gold, fontWeight: '900' },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  eventColor: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  eventCopy: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '800', color: C.navy },
  eventMeta: { fontSize: 11, fontWeight: '700', color: C.textMuted, marginTop: 3 },
});
