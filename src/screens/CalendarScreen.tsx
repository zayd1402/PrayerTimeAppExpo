import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { HijriService } from '../services/HijriService';
import { loadPrayerLog } from '../services/StorageService';
import { getEventsForHijriDate, ISLAMIC_EVENTS } from '../data/islamicEvents';

function getDateKey(date) {
  return date.toISOString().split('T')[0];
}

const EVENT_COLORS = {
  ramadan: C.emerald,
  eid: C.gold,
  hajj: C.navySoft,
  ashura: C.red,
  mawlid: C.blue,
  laylatul_qadr: C.purple,
  white_days: C.teal,
  jumuah: C.green,
  general: C.textSecondary,
};

const EVENT_ICONS = {
  ramadan: 'moon-outline',
  eid: 'gift-outline',
  hajj: 'airplane-outline',
  ashura: 'flame-outline',
  mawlid: 'heart-outline',
  laylatul_qadr: 'star-outline',
  white_days: 'sunny-outline',
  jumuah: 'time-outline',
  general: 'calendar-outline',
};

const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
  'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah',
];

export default function CalendarScreen() {
  const { c, type, radius, elevation } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prayerLog, setPrayerLog] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const todayKey = getDateKey(today);

  const loadData = useCallback(async () => {
    const log = await loadPrayerLog();
    setPrayerLog(log);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const grid = HijriService.getMonthGrid(year, month);
  const hijriCurrent = HijriService.gregorianToHijri(new Date(year, month, 15));

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const hijriMonthStr = `${hijriCurrent.monthNameArabic} ${hijriCurrent.year}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bgBase }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={c.emerald}
          colors={[c.emerald]}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.heroBg, paddingTop: 60 }]}>
        <Text style={[type.headline, { color: c.onHero, fontSize: 22, fontWeight: '700' }]}>
          Islamic Calendar
        </Text>
        <Text style={[type.body, { color: c.onDarkMuted, marginTop: 4 }]}>
          {hijriMonthStr}
        </Text>
      </View>

      {/* Month Navigation */}
      <View style={[styles.calHeader, { paddingHorizontal: 18 }]}>
        <View>
          <Text style={[type.title, { color: c.textPrimary, fontSize: 18 }]}>{monthName}</Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{hijriMonthStr}</Text>
        </View>
        <View style={styles.calNav}>
          <TouchableOpacity
            style={[styles.calNavBtn, { backgroundColor: c.bgSurface, borderRadius: 10 }]}
            onPress={prevMonth}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Ionicons name="chevron-back" size={16} color={c.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.calNavBtn, { backgroundColor: c.bgSurface, borderRadius: 10, marginLeft: 8 }]}
            onPress={nextMonth}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Ionicons name="chevron-forward" size={16} color={c.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday headers */}
      <View style={[styles.calWeekdays, { paddingHorizontal: 18 }]}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
          <Text
            key={d}
            style={[type.caption, { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: c.textMuted }]}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={[styles.calGrid, { paddingHorizontal: 18 }]}>
        {grid.map((cell, idx) => {
          const { gregorian, hijri, isCurrentMonth } = cell;
          const dateKey = getDateKey(gregorian);
          const isToday = dateKey === todayKey;
          const dayLog = prayerLog[dateKey];
          const prayedCount = dayLog
            ? Object.entries(dayLog).filter(([id, s]) => id !== 'sunrise' && s === 'prayed').length
            : 0;
          const isSelected = dateKey === selectedDate;
          const events = getEventsForHijriDate(hijri.day, hijri.month);
          const hasEvent = events.length > 0;

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.calDay,
                {
                  backgroundColor: isSelected ? c.emerald : isToday ? c.emeraldPale : 'transparent',
                  borderRadius: 12,
                  opacity: !isCurrentMonth ? 0.4 : 1,
                },
              ]}
              onPress={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
              accessibilityRole="button"
              accessibilityLabel={`${gregorian.toDateString()}, Hijri ${hijri.day}${prayedCount > 0 ? `, ${prayedCount} prayers logged` : ''}${hasEvent ? `, event: ${events[0].title}` : ''}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  type.body,
                  {
                    fontSize: 14,
                    fontWeight: isToday || isSelected ? '700' : '600',
                    color: isSelected ? '#FFF' : isToday ? c.emerald : c.textPrimary,
                  },
                ]}
              >
                {gregorian.getDate()}
              </Text>
              {isCurrentMonth && (
                <Text
                  style={[
                    type.caption,
                    {
                      color: isSelected ? '#FFF' : prayedCount > 0 ? c.emerald : c.textMuted,
                      fontWeight: prayedCount > 0 ? '600' : '400',
                    },
                  ]}
                >
                  {hijri.day}
                </Text>
              )}
              {prayedCount >= 5 && isCurrentMonth && (
                <View style={[styles.prayedDot, { backgroundColor: isSelected ? '#FFF' : c.emerald }]} />
              )}
              {hasEvent && isCurrentMonth && (
                <View style={[styles.eventDot, { backgroundColor: isSelected ? '#FFF' : EVENT_COLORS[events[0].type] || c.gold }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Date Details */}
      {selectedDate && (
        <View style={[styles.detailCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, padding: 18, marginTop: 8 }]}>
          <Text style={[type.title, { color: c.textPrimary }]}>
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {(() => {
            const selectedHijri = HijriService.gregorianToHijri(new Date(selectedDate));
            const events = getEventsForHijriDate(selectedHijri.day, selectedHijri.month);
            return (
              <>
                <Text style={[type.caption, { color: c.textMuted, marginTop: 2, marginBottom: 12 }]}>
                  {selectedHijri.day} {selectedHijri.monthNameArabic} {selectedHijri.year} AH
                </Text>
                {events.map(event => {
                  const col = EVENT_COLORS[event.type] || c.gold;
                  return (
                    <View
                      key={event.id}
                      style={[styles.eventRow, { backgroundColor: col + '12', borderRadius: 12 }]}
                    >
                      <Ionicons name={EVENT_ICONS[event.type]} size={16} color={col} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={[type.label, { color: col, fontWeight: '600' }]}>{event.title}</Text>
                        {event.description && (
                          <Text style={[type.caption, { color: c.textMuted, marginTop: 1 }]}>
                            {event.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
                {events.length === 0 && (
                  <Text style={[type.caption, { color: c.textMuted, fontStyle: 'italic' }]}>
                    No special events on this day
                  </Text>
                )}
              </>
            );
          })()}
        </View>
      )}

      {/* Events Legend */}
      <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 24, marginBottom: 10 }]}>
        Islamic Events
      </Text>
      <View style={[styles.legendCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, padding: 16 }]}>
        {ISLAMIC_EVENTS.filter(e => e.type !== 'white_days').map(event => (
          <View key={event.id} style={[styles.legendItem, { borderBottomColor: c.border }]}>
            <View style={[styles.legendDot, { backgroundColor: EVENT_COLORS[event.type] || c.gold }]} />
            <Text style={[type.body, { flex: 1, color: c.textPrimary, marginLeft: 10 }]}>{event.title}</Text>
            <Text style={[type.caption, { color: c.textMuted }]}>
              {event.hijriDate.day} {HIJRI_MONTHS[event.hijriDate.month - 1] || ''}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 18 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calNav: { flexDirection: 'row' },
  calNavBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  calWeekdays: { flexDirection: 'row', marginBottom: 8 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  prayedDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  eventDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },
  detailCard: {},
  eventRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 },
  legendCard: {},
  legendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
});
