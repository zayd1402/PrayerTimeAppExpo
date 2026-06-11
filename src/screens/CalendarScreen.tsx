import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import { HijriService } from '../services/HijriService';
import { getRamadanState } from '../services/RamadanService';
import { loadPrayerLog, getStreak, getTotalPrayers, getOnTimeRate, getHeatmapData, getKhushuAverage } from '../services/StorageService';
import { getEventsForHijriDate, ISLAMIC_EVENTS } from '../data/islamicEvents';

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

const EVENT_COLORS: Record<string, string> = {
  ramadan: C.primary,
  eid: C.gold,
  hajj: C.gold,
  ashura: C.red,
  mawlid: C.textSecondary,
  laylatul_qadr: C.primaryLight,
  white_days: C.gold,
  jumuah: C.gold,
  general: C.textSecondary};

const EVENT_ICONS: Record<string, string> = {
  ramadan: 'moon-outline',
  eid: 'gift-outline',
  hajj: 'airplane-outline',
  ashura: 'flame-outline',
  mawlid: 'heart-outline',
  laylatul_qadr: 'star-outline',
  white_days: 'sunny-outline',
  jumuah: 'time-outline',
  general: 'calendar-outline'};

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prayerLog, setPrayerLog] = useState<Record<string, Record<string, string>>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalPrayers, setTotalPrayers] = useState(0);
  const [onTimeRate, setOnTimeRate] = useState(0);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [khushuAvg, setKhushuAvg] = useState(0);
  const [khushuEntryCount, setKhushuEntryCount] = useState(0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const todayKey = getDateKey(today);

  useEffect(() => {
    loadPrayerLog().then(log => {
      setPrayerLog(log);
    });
    Promise.all([
      getStreak(),
      getTotalPrayers(),
      getOnTimeRate(),
      getHeatmapData(2),
      getKhushuAverage(7),
    ]).then(([s, t, o, h, k]) => {
      setStreak(s);
      setTotalPrayers(t);
      setOnTimeRate(o);
      setHeatmapData(h);
      setKhushuAvg(k.average);
      setKhushuEntryCount(k.entries);
    });
  }, [selectedDate]);

  const grid = HijriService.getMonthGrid(year, month);
  const hijriToday = HijriService.gregorianToHijri(today);
  const hijriCurrent = HijriService.gregorianToHijri(new Date(year, month, 15));

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const jumpToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(todayKey);
  };

  const isCurrentMonthToday = year === today.getFullYear() && month === today.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const hijriMonthStr = `${hijriCurrent.monthNameArabic} ${hijriCurrent.year}`;

  const getNextEvent = () => {
    const events = ISLAMIC_EVENTS.filter(e => e.type !== 'white_days');
    return events[0];
  };
  const nextEvent = getNextEvent();
  const ramadanState = getRamadanState();

  const RamadanSummary = () => {
    const title = ramadanState.isRamadan
      ? `Ramadan — day ${ramadanState.ramadanDay}`
      : ramadanState.isPreRamadan
        ? `${ramadanState.daysUntilRamadan} days until Ramadan`
        : ramadanState.isPostRamadan
          ? 'Shawwal — continue the good deeds'
          : `${ramadanState.daysUntilRamadan} days until Ramadan`;

    return (
      <View style={styles.ramadanSummary}>
        <View style={styles.ramadanSummaryLeft}>
          <Ionicons name="moon-outline" size={24} color={C.gold} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.ramadanSummaryTitle}>{title}</Text>
            <Text style={styles.ramadanSummaryDesc}>
              {ramadanState.isRamadan
                ? ramadanState.isLast10Nights ? 'Last 10 nights are visible on the Hijri calendar.' : 'Ramadan events are marked in the calendar grid.'
                : 'Ramadan, Laylat al-Qadr, Eid, and Shawwal are included in the MVP calendar.'}
            </Text>
          </View>
        </View>
        <View style={[styles.ramadanSummaryBadge, { backgroundColor: (EVENT_COLORS.ramadan || C.gold) + '15' }]}>
          <Text style={[styles.ramadanSummaryBadgeText, { color: C.gold }]}>Ramadan</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Islamic Calendar</Text>
        <Text style={styles.subtitle}>{hijriMonthStr}</Text>
      </View>

      {/* Event Countdown */}
      {nextEvent && (
        <View style={styles.countdownCard}>
          <View style={styles.countdownLeft}>
            <Ionicons name={EVENT_ICONS[nextEvent.type] as any} size={24} color={EVENT_COLORS[nextEvent.type] || C.gold} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.countdownTitle}>{nextEvent.title}</Text>
              <Text style={styles.countdownDesc}>{nextEvent.description}</Text>
            </View>
          </View>
          <View style={[styles.countdownBadge, { backgroundColor: (EVENT_COLORS[nextEvent.type] || C.gold) + '15' }]}>
            <Text style={[styles.countdownBadgeText, { color: EVENT_COLORS[nextEvent.type] || C.gold }]}>Soon</Text>
          </View>
        </View>
      )}

      {/* Streak Summary */}
      <View style={styles.streakCard}>
        <View style={styles.streakItem}>
          <Ionicons name="flame-outline" size={18} color={C.primary} />
          <Text style={styles.streakValue}>{streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakItem}>
          <Text style={styles.streakValue}>{totalPrayers}</Text>
          <Text style={styles.streakLabel}>total prayers</Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakItem}>
          <Text style={styles.streakValue}>{onTimeRate}%</Text>
          <Text style={styles.streakLabel}>on time</Text>
        </View>
      </View>

      <RamadanSummary />

      {/* Month Navigation */}
      <View style={styles.calHeader}>
        <View>
          <Text style={styles.calMonth}>{monthName}</Text>
          <Text style={styles.calHijri}>{hijriMonthStr}</Text>
        </View>
        <View style={styles.calNav}>
          {!isCurrentMonthToday && (
            <TouchableOpacity style={styles.todayBtn} onPress={jumpToToday}>
              <Ionicons name="today-outline" size={13} color={C.white} />
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.calNavBtn} onPress={prevMonth}>
            <Ionicons name="chevron-back" size={16} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.calNavBtn} onPress={nextMonth}>
            <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday headers */}
      <View style={styles.calWeekdays}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <Text key={d} style={styles.calWeekday}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calGrid}>
        {grid.map((cell, idx: number) => {
          const { gregorian, hijri, isCurrentMonth } = cell;
          const dateKey = getDateKey(gregorian);
          const isToday = dateKey === todayKey;
          const dayLog = prayerLog[dateKey];
          const prayedCount = dayLog ? Object.entries(dayLog).filter(([id, s]) => id !== 'sunrise' && s === 'prayed').length : 0;
          const isSelected = dateKey === selectedDate;
          const events = getEventsForHijriDate(hijri.day, hijri.month);
          const hasEvent = events.length > 0;
          const heatLevel = isCurrentMonth ? (heatmapData[dateKey] || 0) : 0;

          const heatBg = heatLevel >= 5 ? C.primaryLight
            : heatLevel >= 3 ? C.goldPale
            : heatLevel >= 1 ? C.bgCard
            : C.surfaceElevated;

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.calDay,
                { backgroundColor: isToday ? C.primaryLight : isSelected ? C.primary : heatBg },
                !isCurrentMonth && styles.calDayOther,
                isSelected && styles.calDaySelected,
                heatLevel >= 5 && isCurrentMonth && !isToday && !isSelected && styles.calDayFull,
              ]}
              onPress={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
            >
              <Text style={[
                styles.calDayNum,
                isToday && styles.calDayNumToday,
                isSelected && { color: C.white },
                !isCurrentMonth && styles.calDayNumOther,
              ]}>
                {gregorian.getDate()}
              </Text>
              {isCurrentMonth && (
                <Text style={[styles.calDayHijri, prayedCount > 0 && styles.calDayHijriPrayed]}>
                  {hijri.day}
                </Text>
              )}
              {hasEvent && isCurrentMonth && (
                <View style={[styles.eventDot, { backgroundColor: EVENT_COLORS[events[0].type] || C.gold }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Date Details */}
      {selectedDate && (
        <View style={styles.detailCard}>
          <Text style={styles.detailDate}>
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {(() => {
            const selectedHijri = HijriService.gregorianToHijri(new Date(selectedDate));
            const events = getEventsForHijriDate(selectedHijri.day, selectedHijri.month);
            const dayLog = prayerLog[selectedDate];
            const PRAYER_LIST = [
              { id: 'fajr', name: 'Fajr', icon: 'sunny-outline' },
              { id: 'dhuhr', name: 'Dhuhr', icon: 'sun-outline' },
              { id: 'asr', name: 'Asr', icon: 'cloud-outline' },
              { id: 'maghrib', name: 'Maghrib', icon: 'sunset-outline' },
              { id: 'isha', name: 'Isha', icon: 'moon-outline' },
            ];

            const prayedDayCount = dayLog
              ? Object.entries(dayLog).filter(([id, s]) => id !== 'sunrise' && s === 'prayed').length
              : 0;

            return (
              <>
                <Text style={styles.detailHijri}>
                  {selectedHijri.day} {selectedHijri.monthNameArabic} {selectedHijri.year} AH
                </Text>

                {dayLog && (
                  <>
                    <Text style={styles.detailSectionTitle}>Prayer Activity</Text>
                    <View style={styles.prayerBreakdown}>
                      {PRAYER_LIST.map(p => {
                        const status = dayLog[p.id] as string | undefined;
                        const isPrayed = status === 'prayed';
                        const isQaza = status === 'qaza';
                        const isMissed = status === 'missed';
                        return (
                          <View key={p.id} style={styles.prayerStatusRow}>
                            <Ionicons name={p.icon as any} size={16} color={isPrayed ? C.primary : C.textMuted} />
                            <Text style={[styles.prayerStatusName, isPrayed && styles.prayerStatusNameDone]}>{p.name}</Text>
                            <View style={[
                              styles.prayerStatusBadge,
                              isPrayed && styles.prayerStatusBadgePrayed,
                              isQaza && styles.prayerStatusBadgeQaza,
                              isMissed && styles.prayerStatusBadgeMissed,
                            ]}>
                              <Text style={[
                                styles.prayerStatusBadgeText,
                                isPrayed && styles.prayerStatusBadgeTextPrayed,
                              ]}>
                                {isPrayed ? 'Prayed' : isQaza ? 'Qaza' : isMissed ? 'Missed' : '—'}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                    <Text style={styles.prayerSummary}>
                      {prayedDayCount} of 5 completed
                    </Text>
                    {khushuEntryCount > 0 && (
                      <Text style={styles.khushuSummary}>
                        <Ionicons name="heart-half-outline" size={12} color={C.primary} /> Weekly khushu' avg: {khushuAvg}/5 ({khushuEntryCount} entries)
                      </Text>
                    )}
                  </>
                )}

                {events.map(event => (
                  <View key={event.id} style={[styles.eventRow, { backgroundColor: (EVENT_COLORS[event.type] || C.gold) + '10' }]}>
                    <Ionicons name={EVENT_ICONS[event.type] as any} size={16} color={EVENT_COLORS[event.type] || C.gold} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={[styles.eventTitle, { color: EVENT_COLORS[event.type] || C.gold }]}>{event.title}</Text>
                      <Text style={styles.eventDesc}>{event.description}</Text>
                    </View>
                  </View>
                ))}
                {events.length === 0 && !dayLog && (
                  <Text style={styles.noEvent}>No prayers tracked for this day</Text>
                )}
              </>
            );
          })()}
        </View>
      )}

      {/* Islamic Events Legend */}
      <Text style={styles.sectionTitle}>Islamic Events</Text>
      <View style={styles.legendCard}>
        {ISLAMIC_EVENTS.filter(e => e.type !== 'white_days').map(event => (
          <View key={event.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: EVENT_COLORS[event.type] || C.gold }]} />
            <Text style={styles.legendText}>{event.title}</Text>
            <Text style={styles.legendHijri}>{event.hijriDate.day} {['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Awwal','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhu al-Qidah','Dhu al-Hijjah'][event.hijriDate.month - 1] || ''}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingBottom: 120 },
  header: { padding: 18, paddingTop: 60, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.goldPale },
  subtitle: { fontSize: 14, color: C.goldLight, fontFamily: "Jost_400Regular", marginTop: 4 },

  countdownCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surfaceElevated, borderRadius: 18, margin: 18, marginBottom: 12, padding: 16,
  },
  countdownLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  countdownTitle: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  countdownDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  countdownBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  countdownBadgeText: { fontSize: 12, fontFamily: 'Jost_700Bold' },

  streakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: C.goldPale, borderRadius: 16, marginHorizontal: 18, marginBottom: 14,
    paddingVertical: 12, paddingHorizontal: 8,
  },
  ramadanSummary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surfaceElevated, borderRadius: 18, marginHorizontal: 18, marginBottom: 14,
    padding: 16,
  },
  ramadanSummaryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  ramadanSummaryTitle: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  ramadanSummaryDesc: { fontSize: 12, color: C.textMuted, lineHeight: 17, marginTop: 2 },
  ramadanSummaryBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  ramadanSummaryBadgeText: { fontSize: 11, fontFamily: 'Jost_700Bold' },
  streakItem: { alignItems: 'center', flex: 1 },
  streakValue: { fontSize: 20, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  streakLabel: { fontSize: 11, fontFamily: 'Jost_500Medium', color: C.textMuted, marginTop: 1 },
  streakDivider: { width: 1, height: 28, backgroundColor: C.border },

  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 12 },
  calMonth: { fontSize: 18, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  calHijri: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  calNav: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  todayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primary, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 6, marginRight: 4,
  },
  todayBtnText: { fontSize: 12, fontFamily: 'Jost_700Bold', color: C.white },
  calNavBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: C.surfaceElevated,
    justifyContent: 'center', alignItems: 'center',
  },

  calWeekdays: { flexDirection: 'row', paddingHorizontal: 18, marginBottom: 8 },
  calWeekday: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Jost_700Bold', color: C.textMuted },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18 },
  calDay: {
    width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
    borderRadius: 12, marginBottom: 4,
  },
  calDayOther: { opacity: 0.3 },
  calDayToday: { borderWidth: 2, borderColor: C.primary },
  calDayFull: { borderWidth: 1.5, borderColor: C.primary },
  calDaySelected: {},
  calDayNum: { fontSize: 14, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  calDayNumToday: { color: C.textPrimary, fontFamily: 'Jost_700Bold' },
  calDayNumOther: { color: C.textMuted },
  calDayHijri: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  calDayHijriPrayed: { color: C.primary, fontFamily: 'Jost_600SemiBold' },
  eventDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },

  detailCard: {
    backgroundColor: C.surfaceElevated, borderRadius: 18, marginHorizontal: 18, padding: 18, marginTop: 8,
  },
  detailDate: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  detailHijri: { fontSize: 13, color: C.textMuted, marginTop: 2, marginBottom: 14 },
  detailSectionTitle: { fontSize: 13, fontFamily: 'Jost_700Bold', color: C.textSecondary, marginBottom: 8 },

  prayerBreakdown: { marginBottom: 8 },
  prayerStatusRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  prayerStatusName: { flex: 1, fontSize: 14, color: C.textSecondary, fontFamily: 'Jost_500Medium' },
  prayerStatusNameDone: { color: C.textPrimary, fontFamily: 'Jost_600SemiBold' },
  prayerStatusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: C.border },
  prayerStatusBadgePrayed: { backgroundColor: C.primaryLight },
  prayerStatusBadgeQaza: { backgroundColor: C.goldPale },
  prayerStatusBadgeMissed: { backgroundColor: 'rgba(196,85,59,0.12)' },
  prayerStatusBadgeText: { fontSize: 11, fontFamily: 'Jost_600SemiBold', color: C.textMuted },
  prayerStatusBadgeTextPrayed: { color: C.primary },
  prayerSummary: { fontSize: 13, fontFamily: 'Jost_600SemiBold', color: C.primary, marginTop: 2, marginBottom: 12 },
  khushuSummary: { fontSize: 12, fontFamily: 'Jost_500Medium', color: C.textMuted, marginTop: -8, marginBottom: 12 },

  eventRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  eventTitle: { fontSize: 14, fontFamily: 'Jost_600SemiBold' },
  eventDesc: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  noEvent: { fontSize: 13, color: C.textMuted, fontStyle: 'italic', marginTop: 6 },

  sectionTitle: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginHorizontal: 18, marginTop: 24, marginBottom: 10 },
  legendCard: {
    backgroundColor: C.surfaceElevated, borderRadius: 18, marginHorizontal: 18, padding: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { flex: 1, fontSize: 14, color: C.textPrimary, marginLeft: 10 },
  legendHijri: { fontSize: 12, color: C.textMuted }});
