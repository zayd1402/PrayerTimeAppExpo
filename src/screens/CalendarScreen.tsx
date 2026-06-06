import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import { HijriService } from '../services/HijriService';
import { loadPrayerLog } from '../services/StorageService';
import { getEventsForHijriDate, ISLAMIC_EVENTS } from '../data/islamicEvents';

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

const EVENT_COLORS: Record<string, string> = {
  ramadan: C.coral,
  eid: C.gold,
  hajj: C.gold,
  ashura: C.red,
  mawlid: C.warmBlue,
  laylatul_qadr: C.rose,
  white_days: C.warmAmber,
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const todayKey = getDateKey(today);

  useEffect(() => {
    loadPrayerLog().then(setPrayerLog);
  }, []);

  const grid = HijriService.getMonthGrid(year, month);
  const hijriToday = HijriService.gregorianToHijri(today);
  const hijriCurrent = HijriService.gregorianToHijri(new Date(year, month, 15));

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const hijriMonthStr = `${hijriCurrent.monthNameArabic} ${hijriCurrent.year}`;

  // Countdown to next major event
  const getNextEvent = () => {
    const events = ISLAMIC_EVENTS.filter(e => e.type !== 'white_days');
    // Simplified - would calculate actual dates in production
    return events[0];
  };
  const nextEvent = getNextEvent();

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

      {/* Month Navigation */}
      <View style={styles.calHeader}>
        <View>
          <Text style={styles.calMonth}>{monthName}</Text>
          <Text style={styles.calHijri}>{hijriMonthStr}</Text>
        </View>
        <View style={styles.calNav}>
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
        {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
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

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.calDay,
                !isCurrentMonth && styles.calDayOther,
                isToday && styles.calDayToday,
                isSelected && styles.calDaySelected,
              ]}
              onPress={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
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
              {prayedCount >= 5 && (
                <View style={styles.prayedDot} />
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
            return (
              <>
                <Text style={styles.detailHijri}>
                  {selectedHijri.day} {selectedHijri.monthNameArabic} {selectedHijri.year} AH
                </Text>
                {events.map(event => (
                  <View key={event.id} style={[styles.eventRow, { backgroundColor: (EVENT_COLORS[event.type] || C.gold) + '10' }]}>
                    <Ionicons name={EVENT_ICONS[event.type] as any} size={16} color={EVENT_COLORS[event.type] || C.gold} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={[styles.eventTitle, { color: EVENT_COLORS[event.type] || C.gold }]}>{event.title}</Text>
                      <Text style={styles.eventDesc}>{event.description}</Text>
                    </View>
                  </View>
                ))}
                {events.length === 0 && (
                  <Text style={styles.noEvent}>No special events on this day</Text>
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
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.textPrimary },
  subtitle: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 4 },

  countdownCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surfaceElevated, borderRadius: 18, margin: 18, marginBottom: 12, padding: 16,
    ...C.shadow.md,
  },
  countdownLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  countdownTitle: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  countdownDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  countdownBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  countdownBadgeText: { fontSize: 12, fontFamily: 'Jost_700Bold' },

  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 12 },
  calMonth: { fontSize: 18, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  calHijri: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  calNav: { flexDirection: 'row', gap: 8 },
  calNavBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: C.surfaceElevated,
    justifyContent: 'center', alignItems: 'center',
    ...C.shadow.sm,
  },

  calWeekdays: { flexDirection: 'row', paddingHorizontal: 18, marginBottom: 8 },
  calWeekday: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Jost_700Bold', color: C.textMuted },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18 },
  calDay: {
    width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
    borderRadius: 12, marginBottom: 4,
    backgroundColor: C.surfaceElevated,
  },
  calDayOther: { opacity: 0.4 },
  calDayToday: { backgroundColor: C.primaryLight },
  calDaySelected: { backgroundColor: C.coral },
  calDayNum: { fontSize: 14, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  calDayNumToday: { color: C.coral, fontFamily: 'Jost_700Bold' },
  calDayNumOther: { color: C.textMuted },
  calDayHijri: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  calDayHijriPrayed: { color: C.coral, fontFamily: 'Jost_600SemiBold' },
  prayedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.coral, marginTop: 2 },
  eventDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },

  detailCard: {
    backgroundColor: C.surfaceElevated, borderRadius: 18, marginHorizontal: 18, padding: 18, marginTop: 8,
    ...C.shadow.md,
  },
  detailDate: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  detailHijri: { fontSize: 13, color: C.textMuted, marginTop: 2, marginBottom: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  eventTitle: { fontSize: 14, fontFamily: 'Jost_600SemiBold' },
  eventDesc: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  noEvent: { fontSize: 13, color: C.textMuted, fontStyle: 'italic' },

  sectionTitle: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginHorizontal: 18, marginTop: 24, marginBottom: 10 },
  legendCard: {
    backgroundColor: C.surfaceElevated, borderRadius: 18, marginHorizontal: 18, padding: 16,
    ...C.shadow.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { flex: 1, fontSize: 14, color: C.textPrimary, marginLeft: 10 },
  legendHijri: { fontSize: 12, color: C.textMuted }});
