import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { C, AppSettings, PrayerId, PrayerTime } from '../types';
import { getDateKey } from '../utils/date';
import { gregorianToHijri, HijriService } from '../services/HijriService';
import { getPrayerTimesObject } from '../services/PrayerService';
import { loadPrayerLog, markPrayer } from '../services/StorageService';

type Location = { latitude: number; longitude: number; name: string };

export function CalendarScreen({
  settings,
  location,
}: {
  settings: AppSettings;
  location: Location;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prayerLog, setPrayerLog] = useState<Record<string, Record<string, string>>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayKey = getDateKey(new Date());

  useEffect(() => {
    loadPrayerLog().then(setPrayerLog);
  }, []);

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

  const updatePrayerStatus = (dateKey: string, prayer: PrayerTime) => {
    Alert.alert(
      `Mark ${prayer.name}`,
      selectedDate ? 'Update this date in your prayer calendar.' : 'Update today in your prayer calendar.',
      [
        {
          text: 'Done',
          onPress: async () => {
            await markPrayer(dateKey, prayer.id as PrayerId, 'prayed');
            setPrayerLog(await loadPrayerLog());
          },
        },
        {
          text: 'Qaza',
          onPress: async () => {
            await markPrayer(dateKey, prayer.id as PrayerId, 'qaza');
            setPrayerLog(await loadPrayerLog());
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
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

      {defaultSelectedDate && (
        <View style={styles.calDetail}>
          {(() => {
            const selected = new Date(defaultSelectedDate + 'T12:00:00');
            const hijri = gregorianToHijri(selected);
            const dayLog = prayerLog[defaultSelectedDate] || {};
            const times = getPrayerTimesObject(
              selected,
              location.latitude,
              location.longitude,
              settings.calculationMethod,
              settings.madhab,
              0
            );
            const complete = times.filter((t: PrayerTime) => t.id !== 'sunrise' && dayLog[t.id] === 'prayed').length;
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
                    <Text style={styles.calDetailScoreText}>{complete}/5</Text>
                  </View>
                </View>
                {times.filter((t: PrayerTime) => t.id !== 'sunrise').map((p: PrayerTime) => (
                  <TouchableOpacity key={p.id} style={styles.calDetailRow} onPress={() => updatePrayerStatus(defaultSelectedDate, p)} activeOpacity={0.72}>
                    <Text style={styles.calDetailPrayer}>{p.name}</Text>
                    <Text style={styles.calDetailTime}>{p.time}</Text>
                    {dayLog[p.id] === 'prayed' && <Ionicons name="checkmark-circle" size={16} color={C.emerald} />}
                    {dayLog[p.id] === 'qaza' && <Text style={styles.calDetailQaza}>Q</Text>}
                    {!dayLog[p.id] && <Ionicons name="add-circle-outline" size={16} color={C.textMuted} />}
                  </TouchableOpacity>
                ))}
              </>
            );
          })()}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  screenPadding: { paddingHorizontal: 20, paddingBottom: 16 },
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
  calendarCard: { borderRadius: 22, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, padding: 12, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18 }, android: { elevation: 4 } }) },
  calWeekdays: { flexDirection: 'row', marginBottom: 8 },
  calWeekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 0.5 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
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
  calDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border },
  calDetailPrayer: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 15, color: C.navy, flex: 1, fontWeight: '700' },
  calDetailTime: { fontSize: 13, color: C.textMuted, marginRight: 8 },
  calDetailQaza: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
});
