import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PrayerActionSheet } from '../components/PrayerActionSheet';
import { C, AppSettings, CalendarEventSummary, PrayerId, PrayerTime, PRAYER_ICONS } from '../types';
import { getDateKey } from '../utils/date';
import { gregorianToHijri, HijriService } from '../services/HijriService';
import { getPrayerTimesObject } from '../services/PrayerService';
import { getDeviceCalendarEventsForDay, hasDeviceCalendarPermission } from '../services/CalendarIntegrationService';
import { loadPrayerLog } from '../services/StorageService';

type Location = { latitude: number; longitude: number; name: string };
const TRACKED_PRAYERS: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function countPrayed(dayLog: Record<string, string> = {}) {
  return TRACKED_PRAYERS.filter(id => dayLog[id] === 'prayed').length;
}

function countQaza(dayLog: Record<string, string> = {}) {
  return TRACKED_PRAYERS.filter(id => dayLog[id] === 'qaza').length;
}

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
  const monthShort = currentDate.toLocaleString('default', { month: 'short' });
  const hijriMonthStr = `${hijriCurrent.monthNameArabic} ${hijriCurrent.year}`;
  const monthPrayedDays = Object.entries(prayerLog).filter(([date, dayLog]) => {
    const dt = new Date(date + 'T12:00:00');
    if (dt.getFullYear() !== year || dt.getMonth() !== month) return false;
    return countPrayed(dayLog) >= 5;
  }).length;
  const monthActiveDays = Object.entries(prayerLog).filter(([date, dayLog]) => {
    const dt = new Date(date + 'T12:00:00');
    if (dt.getFullYear() !== year || dt.getMonth() !== month) return false;
    return countPrayed(dayLog) + countQaza(dayLog) > 0;
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

  const selectedComplete = countPrayed(selectedDayLog);
  const selectedQaza = countQaza(selectedDayLog);
  const selectedCompletionPct = Math.round((selectedComplete / TRACKED_PRAYERS.length) * 100);
  const currentStreak = useMemo(() => {
    let streak = 0;
    const cursor = new Date(selectedDateObject);
    for (let i = 0; i < 60; i++) {
      const dateKey = getDateKey(cursor);
      if (countPrayed(prayerLog[dateKey] || {}) >= 5) streak += 1;
      else break;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [prayerLog, selectedDateObject]);
  const weekActivity = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(selectedDateObject);
      day.setDate(day.getDate() - (6 - index));
      const dateKey = getDateKey(day);
      const log = prayerLog[dateKey] || {};
      return {
        key: dateKey,
        label: day.toLocaleDateString('en-AU', { weekday: 'short' }).slice(0, 1),
        count: countPrayed(log),
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
        <View style={styles.calendarHeroOrb} />
        <View style={styles.calendarHeroContent}>
          <View>
            <Text style={styles.calendarEyebrow}>Prayer activity</Text>
            <Text style={styles.calMonth}>Calendar</Text>
            <Text style={styles.calHijri}>{hijriMonthStr}</Text>
          </View>
          <View style={styles.heroMonthPill}>
            <Text style={styles.heroMonthPillText}>{monthShort}</Text>
            <Text style={styles.heroMonthPillSub}>{year}</Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{selectedComplete}/5</Text>
            <Text style={styles.heroStatLabel}>selected day</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{monthPrayedDays}</Text>
            <Text style={styles.heroStatLabel}>full days</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{currentStreak}</Text>
            <Text style={styles.heroStatLabel}>day streak</Text>
          </View>
        </View>
      </View>

      <View style={styles.activitySummaryCard}>
        <View style={styles.ringStage}>
          <View style={styles.ringOuter}>
            {TRACKED_PRAYERS.map((id, index) => {
              const positions = [
                styles.ringDotTop,
                styles.ringDotRight,
                styles.ringDotBottomRight,
                styles.ringDotBottomLeft,
                styles.ringDotLeft,
              ];
              const done = selectedDayLog[id] === 'prayed';
              const qaza = selectedDayLog[id] === 'qaza';
              return (
                <View
                  key={id}
                  style={[
                    styles.ringDot,
                    positions[index],
                    done && styles.ringDotDone,
                    qaza && styles.ringDotQaza,
                  ]}
                >
                  <Ionicons
                    name={(done ? 'checkmark' : qaza ? 'time-outline' : PRAYER_ICONS[id].icon) as any}
                    size={11}
                    color={done ? C.bgSurface : qaza ? C.gold : C.textMuted}
                  />
                </View>
              );
            })}
            <View style={styles.ringInner}>
              <Text style={styles.ringPct}>{selectedCompletionPct}%</Text>
              <Text style={styles.ringLabel}>complete</Text>
            </View>
          </View>
        </View>
        <View style={styles.daySummaryCopy}>
          <View style={styles.daySummaryTop}>
            <View>
              <Text style={styles.daySummaryTitle}>Daily prayer rings</Text>
              <Text style={styles.daySummarySub}>{selectedQaza ? `${selectedQaza} qaza recorded` : 'Tap a prayer below to update'}</Text>
            </View>
            <Text style={styles.daySummaryMeta}>{selectedComplete}/5</Text>
          </View>
          <View style={styles.prayerCapsules}>
            {TRACKED_PRAYERS.map(id => {
              const status = selectedDayLog[id];
              return (
                <View
                  key={id}
                  style={[
                    styles.prayerCapsule,
                    status === 'prayed' && styles.prayerCapsuleDone,
                    status === 'qaza' && styles.prayerCapsuleQaza,
                  ]}
                >
                  <Ionicons
                    name={(status === 'prayed' ? 'checkmark' : PRAYER_ICONS[id].icon) as any}
                    size={12}
                    color={status === 'prayed' ? C.bgSurface : status === 'qaza' ? C.gold : C.textMuted}
                  />
                </View>
              );
            })}
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
        <View style={styles.calendarCardHeader}>
          <View>
            <Text style={styles.calendarCardTitle}>{monthName}</Text>
            <Text style={styles.calendarCardSub}>Each tile shows 0-5 prayers completed</Text>
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
            const prayedCount = countPrayed(dayLog || {});
            const qazaCount = countQaza(dayLog || {});
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
                  <View style={styles.calDayBars}>
                    {TRACKED_PRAYERS.map(id => {
                      const status = dayLog?.[id];
                      return (
                        <View
                          key={id}
                          style={[
                            styles.calDayBar,
                            status === 'prayed' && styles.calDayBarDone,
                            status === 'qaza' && styles.calDayBarQaza,
                          ]}
                        />
                      );
                    })}
                  </View>
                )}
                {qazaCount > 0 && <Text style={styles.calQazaMark}>Q</Text>}
                {isCurrentMonth && <Text style={[styles.calDayHijri, prayedCount > 0 && styles.calDayHijriPrayed]}>{hijri.day}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.monthInsightRow}>
          <View style={styles.monthInsight}>
            <Text style={styles.monthInsightValue}>{monthActiveDays}</Text>
            <Text style={styles.monthInsightLabel}>active days</Text>
          </View>
          <View style={styles.monthInsight}>
            <Text style={styles.monthInsightValue}>{monthPrayedDays}</Text>
            <Text style={styles.monthInsightLabel}>5/5 days</Text>
          </View>
          <View style={styles.monthInsight}>
            <Text style={styles.monthInsightValue}>{Math.round((monthPrayedDays / Math.max(1, new Date(year, month + 1, 0).getDate())) * 100)}%</Text>
            <Text style={styles.monthInsightLabel}>month rate</Text>
          </View>
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
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.calDetailRow,
                        selectedDayLog[p.id] === 'prayed' && styles.calDetailRowDone,
                        selectedDayLog[p.id] === 'qaza' && styles.calDetailRowQaza,
                      ]}
                      onPress={() => openPrayerActions(defaultSelectedDate, p)}
                      activeOpacity={0.72}
                    >
                      <View style={styles.calDetailPrayerIcon}>
                        <Ionicons name={PRAYER_ICONS[p.id].icon as any} size={16} color={selectedDayLog[p.id] === 'prayed' ? C.emerald : C.gold} />
                      </View>
                      <View style={styles.calDetailPrayerCopy}>
                        <Text style={styles.calDetailPrayer}>{p.name}</Text>
                        <Text style={styles.calDetailPrayerMeta}>{selectedDayLog[p.id] === 'qaza' ? 'Qaza recorded' : selectedDayLog[p.id] === 'prayed' ? 'Completed' : 'Tap to update'}</Text>
                      </View>
                      <Text style={styles.calDetailTime}>{p.time}</Text>
                      {selectedDayLog[p.id] === 'prayed' && <Ionicons name="checkmark-circle" size={18} color={C.emerald} />}
                      {selectedDayLog[p.id] === 'qaza' && <Text style={styles.calDetailQaza}>Qaza</Text>}
                      {!selectedDayLog[p.id] && <Ionicons name="add-circle-outline" size={18} color={C.textMuted} />}
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
  calendarHero: { position: 'relative', overflow: 'hidden', borderRadius: 28, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)', padding: 18, marginTop: 8, marginBottom: 12, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.12, shadowRadius: 28 }, android: { elevation: 6 } }) },
  calendarHeroWash: { position: 'absolute', right: -46, top: -54, width: 184, height: 184, borderRadius: 92, backgroundColor: 'rgba(215,180,106,0.22)' },
  calendarHeroOrb: { position: 'absolute', left: -54, bottom: -70, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(11,122,83,0.09)' },
  calendarHeroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarEyebrow: { fontSize: 10, fontWeight: '900', color: C.gold, textTransform: 'uppercase', letterSpacing: 1 },
  calMonth: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 30, fontWeight: '900', color: C.navy, marginTop: 5 },
  calHijri: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 13, color: C.textSecondary, marginTop: 3, fontWeight: '700' },
  heroMonthPill: { minWidth: 64, height: 64, borderRadius: 22, backgroundColor: 'rgba(255,253,249,0.74)', borderWidth: 1, borderColor: 'rgba(184,132,32,0.14)', alignItems: 'center', justifyContent: 'center' },
  heroMonthPillText: { fontSize: 16, fontWeight: '900', color: C.gold },
  heroMonthPillSub: { fontSize: 10, fontWeight: '800', color: C.textMuted, marginTop: 1 },
  heroStats: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, backgroundColor: 'rgba(255,253,249,0.66)', borderWidth: 1, borderColor: C.border, paddingVertical: 12, marginTop: 18 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 19, fontWeight: '900', color: C.navy },
  heroStatLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, marginTop: 3 },
  heroStatDivider: { width: 1, height: 28, backgroundColor: C.border },
  calNav: { flexDirection: 'row', gap: 8 },
  calNavBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }, android: { elevation: 2 } }) },
  activitySummaryCard: { flexDirection: 'row', alignItems: 'center', gap: 15, borderRadius: 26, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.76)', padding: 14, marginBottom: 12, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.11, shadowRadius: 24 }, android: { elevation: 5 } }) },
  ringStage: { width: 108, alignItems: 'center', justifyContent: 'center' },
  ringOuter: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,122,83,0.07)', borderWidth: 10, borderColor: C.emeraldPale },
  ringInner: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border },
  ringPct: { fontSize: 19, fontWeight: '900', color: C.emerald },
  ringLabel: { fontSize: 9, fontWeight: '800', color: C.textMuted, marginTop: 1 },
  ringDot: { position: 'absolute', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border },
  ringDotDone: { backgroundColor: C.emerald, borderColor: C.emerald },
  ringDotQaza: { backgroundColor: C.goldPale, borderColor: 'rgba(184,132,32,0.22)' },
  ringDotTop: { top: -10, left: 39 },
  ringDotRight: { top: 22, right: -8 },
  ringDotBottomRight: { bottom: -4, right: 10 },
  ringDotBottomLeft: { bottom: -4, left: 10 },
  ringDotLeft: { top: 22, left: -8 },
  daySummaryCopy: { flex: 1 },
  daySummaryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 9 },
  daySummaryTitle: { fontSize: 15, fontWeight: '900', color: C.navy },
  daySummarySub: { fontSize: 11, lineHeight: 15, fontWeight: '700', color: C.textMuted, marginTop: 2 },
  daySummaryMeta: { fontSize: 13, fontWeight: '900', color: C.emerald },
  prayerCapsules: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  prayerCapsule: { flex: 1, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,26,53,0.04)', borderWidth: 1, borderColor: C.border },
  prayerCapsuleDone: { backgroundColor: C.emerald, borderColor: C.emerald },
  prayerCapsuleQaza: { backgroundColor: C.goldPale, borderColor: 'rgba(184,132,32,0.22)' },
  weekStrip: { flexDirection: 'row', gap: 7 },
  weekCell: { alignItems: 'center', gap: 4 },
  weekHeat: { width: 19, height: 19, borderRadius: 6, backgroundColor: 'rgba(7,26,53,0.05)', borderWidth: 1, borderColor: C.border },
  weekHeat1: { backgroundColor: 'rgba(11,122,83,0.10)' },
  weekHeat2: { backgroundColor: 'rgba(11,122,83,0.16)' },
  weekHeat3: { backgroundColor: 'rgba(11,122,83,0.24)' },
  weekHeat4: { backgroundColor: 'rgba(11,122,83,0.34)' },
  weekHeat5: { backgroundColor: C.emerald },
  weekLabel: { fontSize: 9, fontWeight: '800', color: C.textMuted },
  calendarCard: { borderRadius: 26, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.76)', padding: 13, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 22 }, android: { elevation: 5 } }) },
  calendarCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  calendarCardTitle: { fontSize: 17, fontWeight: '900', color: C.navy },
  calendarCardSub: { fontSize: 11, fontWeight: '700', color: C.textMuted, marginTop: 2 },
  heatLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  heatLegendText: { fontSize: 10, fontWeight: '800', color: C.textMuted },
  heatLegendDot: { width: 13, height: 13, borderRadius: 4, backgroundColor: 'rgba(7,26,53,0.05)', borderWidth: 1, borderColor: C.border },
  calWeekdays: { flexDirection: 'row', marginBottom: 8 },
  calWeekday: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '800', color: C.textMuted },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 5 },
  calDay: { width: `${100 / 7}%`, aspectRatio: 0.82, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  calDayHeat1: { backgroundColor: 'rgba(11,122,83,0.07)' },
  calDayHeat2: { backgroundColor: 'rgba(11,122,83,0.12)' },
  calDayHeat3: { backgroundColor: 'rgba(11,122,83,0.18)' },
  calDayHeat4: { backgroundColor: 'rgba(11,122,83,0.26)' },
  calDayHeat5: { backgroundColor: 'rgba(11,122,83,0.34)' },
  calDayOther: { opacity: 0.3 },
  calDayToday: { backgroundColor: C.goldPale },
  calDaySelected: { backgroundColor: C.bgSurface, borderWidth: 2, borderColor: C.gold },
  calDayNum: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  calDayNumToday: { color: C.gold, fontWeight: '700' },
  calDayNumOther: { color: C.textMuted },
  calDayBars: { flexDirection: 'row', gap: 2, marginTop: 6 },
  calDayBar: { width: 4, height: 13, borderRadius: 2, backgroundColor: 'rgba(7,26,53,0.08)' },
  calDayBarDone: { backgroundColor: C.emerald },
  calDayBarQaza: { backgroundColor: C.gold },
  calQazaMark: { position: 'absolute', top: 5, right: 6, fontSize: 8, fontWeight: '900', color: C.gold },
  calDayHijri: { fontSize: 8, color: C.textMuted, marginTop: 4, fontWeight: '700' },
  calDayHijriPrayed: { color: C.emerald },
  monthInsightRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  monthInsight: { flex: 1, minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,26,53,0.035)', borderWidth: 1, borderColor: C.border },
  monthInsightValue: { fontSize: 16, fontWeight: '900', color: C.navy },
  monthInsightLabel: { fontSize: 9, fontWeight: '800', color: C.textMuted, marginTop: 3 },
  calDetail: { backgroundColor: C.bgSurface, borderRadius: 24, padding: 14, marginTop: 12, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.08, shadowRadius: 18 }, android: { elevation: 4 } }) },
  calDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calDetailDate: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 17, fontWeight: '800', color: C.navy },
  calDetailHijri: { fontSize: 13, color: C.gold, marginTop: 2, marginBottom: 12 },
  calDetailScore: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: C.emeraldPale },
  calDetailScoreText: { fontSize: 13, fontWeight: '900', color: C.emerald },
  calendarStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, backgroundColor: 'rgba(7,26,53,0.04)', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  calendarStatusText: { flex: 1, fontSize: 11, fontWeight: '700', color: C.textSecondary },
  calDetailRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 17, padding: 10, marginTop: 8, backgroundColor: 'rgba(7,26,53,0.035)', borderWidth: 1, borderColor: C.border },
  calDetailRowDone: { backgroundColor: 'rgba(11,122,83,0.08)', borderColor: 'rgba(11,122,83,0.14)' },
  calDetailRowQaza: { backgroundColor: 'rgba(184,132,32,0.09)', borderColor: 'rgba(184,132,32,0.16)' },
  calDetailPrayerIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, marginRight: 10 },
  calDetailPrayerCopy: { flex: 1 },
  calDetailPrayer: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 14, color: C.navy, fontWeight: '800' },
  calDetailPrayerMeta: { fontSize: 10, color: C.textMuted, fontWeight: '700', marginTop: 2 },
  calDetailTime: { fontSize: 12, color: C.textMuted, marginRight: 8, fontWeight: '800' },
  calDetailQaza: { overflow: 'hidden', borderRadius: 11, backgroundColor: C.goldPale, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, color: C.gold, fontWeight: '900' },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 17, padding: 10, marginTop: 8, backgroundColor: 'rgba(255,248,233,0.70)', borderWidth: 1, borderColor: 'rgba(184,132,32,0.12)' },
  eventColor: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  eventCopy: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '800', color: C.navy },
  eventMeta: { fontSize: 11, fontWeight: '700', color: C.textMuted, marginTop: 3 },
});
