import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import { loadFastingLog, toggleFast } from '../services/StorageService';

interface WeeklyActivity {
  id: string;
  title: string;
  description: string;
  dayOfWeek: number; // 0 = Sunday
  type: 'fasting' | 'sunnah' | 'quran' | 'dhikr' | 'charity' | 'reminder';
  icon: string;
  action?: string;
}

const WEEKLY_ACTIVITIES: WeeklyActivity[] = [
  { id: 'monday-fast', title: 'Monday Fast', description: 'Sunnah fasting on Monday — the day the Prophet ﷺ was born', dayOfWeek: 1, type: 'fasting', icon: 'water-outline', action: 'monday' },
  { id: 'thursday-fast', title: 'Thursday Fast', description: 'Sunnah fasting on Thursday — deeds are presented to Allah', dayOfWeek: 4, type: 'fasting', icon: 'water-outline', action: 'thursday' },
  { id: 'friday-prep', title: 'Friday Preparation', description: 'Ghusl, best clothes, Surah Al-Kahf, early to mosque', dayOfWeek: 5, type: 'reminder', icon: 'star-outline' },
  { id: 'friday-dua', title: 'Friday Dua Hour', description: 'Last hour before Maghrib — best time for dua', dayOfWeek: 5, type: 'reminder', icon: 'time-outline' },
  { id: 'saturday-reflect', title: 'Weekly Reflection', description: 'Review your week, seek forgiveness, plan improvements', dayOfWeek: 6, type: 'reminder', icon: 'refresh-outline' },
  { id: 'sunday-family', title: 'Family Time', description: 'Spend quality time with family, visit relatives', dayOfWeek: 0, type: 'reminder', icon: 'people-outline' },
];

const SUNNAH_REVIVAL = [
  { week: 1, title: 'Siwak (Miswak)', description: 'Clean your teeth with miswak before every prayer', icon: 'sunny-outline' },
  { week: 2, title: 'Right Hand Eating', description: 'Eat and drink with your right hand', icon: 'restaurant-outline' },
  { week: 3, title: 'Saying Bismillah', description: 'Begin every action with Bismillah', icon: 'chatbubble-outline' },
  { week: 4, title: 'Sitting to Drink', description: 'Sit down when drinking water', icon: 'water-outline' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeeklyScreen() {
  const [fastingLog, setFastingLog] = useState<Record<string, any>>({});
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const today = new Date().getDay();

  useEffect(() => {
    loadFastingLog().then(setFastingLog);
  }, []);

  const getDateKeyForDay = (dayOfWeek: number) => {
    const now = new Date();
    const diff = dayOfWeek - now.getDay();
    const target = new Date(now);
    target.setDate(now.getDate() + diff);
    return target.toISOString().split('T')[0];
  };

  const toggleFasting = async (type: string) => {
    const dateKey = getDateKeyForDay(selectedDay);
    const log = await toggleFast(dateKey, type as any);
    setFastingLog(log);
  };

  const isFastActive = (type: string) => {
    const dateKey = getDateKeyForDay(selectedDay);
    return fastingLog[dateKey]?.type === type;
  };

  const currentWeek = Math.ceil(new Date().getDate() / 7);
  const weeklySunnah = SUNNAH_REVIVAL[(currentWeek - 1) % SUNNAH_REVIVAL.length];

  const todaysActivities = WEEKLY_ACTIVITIES.filter(a => a.dayOfWeek === selectedDay);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Activities</Text>
        <Text style={styles.subtitle}>Sunnah practices throughout the week</Text>
      </View>

      {/* Day Selector */}
      <View style={styles.daySelector}>
        {DAY_SHORT.map((day, index) => {
          const isSelected = index === selectedDay;
          const isToday = index === today;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.dayChip, isSelected && styles.dayChipSelected, isToday && !isSelected && styles.dayChipToday]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected, isToday && !isSelected && styles.dayLabelToday]}>
                {day}
              </Text>
              {isToday && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Name */}
      <Text style={styles.selectedDayName}>{DAY_NAMES[selectedDay]}{selectedDay === today ? ' (Today)' : ''}</Text>

      {/* Activities for Selected Day */}
      {todaysActivities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={40} color={C.textMuted} />
          <Text style={styles.emptyText}>No specific activities for {DAY_NAMES[selectedDay]}</Text>
          <Text style={styles.emptySub}>Use this day for general worship and good deeds</Text>
        </View>
      ) : (
        todaysActivities.map(activity => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={[styles.activityIconWrap, { backgroundColor: activity.type === 'fasting' ? C.primaryLight : activity.type === 'reminder' ? C.goldPale : C.primaryLight }]}>
              <Ionicons name={activity.icon as any} size={22} color={activity.type === 'fasting' ? C.primary : activity.type === 'reminder' ? C.gold : C.textSecondary} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDesc}>{activity.description}</Text>
            </View>
            {activity.type === 'fasting' && (
              <TouchableOpacity
                style={[styles.fastToggle, isFastActive(activity.action!) && styles.fastToggleActive]}
                onPress={() => toggleFasting(activity.action!)}
              >
                <Text style={[styles.fastToggleText, isFastActive(activity.action!) && styles.fastToggleTextActive]}>
                  {isFastActive(activity.action!) ? 'Fasting' : 'Fast'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      {/* Weekly Sunnah Revival */}
      <View style={styles.sunnahRevivalCard}>
        <View style={styles.sunnahHeader}>
          <Ionicons name="bulb-outline" size={18} color={C.gold} />
          <Text style={styles.sunnahTitle}>Sunnah Revival — Week {currentWeek}</Text>
        </View>
        <View style={styles.sunnahContent}>
          <View style={[styles.sunnahIconWrap, { backgroundColor: C.goldPale }]}>
            <Ionicons name={weeklySunnah.icon as any} size={24} color={C.gold} />
          </View>
          <View style={styles.sunnahInfo}>
            <Text style={styles.sunnahName}>{weeklySunnah.title}</Text>
            <Text style={styles.sunnahDesc}>{weeklySunnah.description}</Text>
          </View>
        </View>
      </View>

      {/* Weekly Overview */}
      <Text style={styles.sectionTitle}>Weekly Overview</Text>
      <View style={styles.overviewCard}>
        {WEEKLY_ACTIVITIES.map(activity => {
          const isTodayActivity = activity.dayOfWeek === today;
          return (
            <View key={activity.id} style={[styles.overviewItem, isTodayActivity && styles.overviewItemToday]}>
              <View style={styles.overviewDot}>
                <Ionicons name={activity.icon as any} size={12} color={isTodayActivity ? '#FFF' : C.textMuted} />
              </View>
              <View style={styles.overviewInfo}>
                <Text style={[styles.overviewTitle, isTodayActivity && styles.overviewTitleToday]}>{activity.title}</Text>
                <Text style={styles.overviewDay}>{DAY_NAMES[activity.dayOfWeek]}</Text>
              </View>
              {isTodayActivity && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>Today</Text></View>}
            </View>
          );
        })}
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

  daySelector: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, marginTop: 16, marginBottom: 8 },
  dayChip: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: C.bgSurface, minWidth: 44 },
  dayChipSelected: { backgroundColor: C.primary },
  dayChipToday: { backgroundColor: C.goldPale, borderWidth: 1, borderColor: C.gold },
  dayLabel: { fontSize: 12, fontFamily: 'Jost_600SemiBold', color: C.textSecondary },
  dayLabelSelected: { color: '#FFF' },
  dayLabelToday: { color: C.gold },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, marginTop: 4 },

  selectedDayName: { fontSize: 18, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginHorizontal: 18, marginBottom: 12 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: C.textSecondary, marginTop: 12, fontFamily: 'Jost_500Medium' },
  emptySub: { fontSize: 13, color: C.textMuted, marginTop: 4 },

  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSurface, borderRadius: 18, padding: 16, marginHorizontal: 18, marginBottom: 10},
  activityIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  activityInfo: { flex: 1, marginLeft: 14 },
  activityTitle: { fontSize: 15, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  activityDesc: { fontSize: 12, color: C.textMuted, marginTop: 2, lineHeight: 18 },
  fastToggle: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F0' },
  fastToggleActive: { backgroundColor: C.primary },
  fastToggleText: { fontSize: 12, fontFamily: 'Jost_600SemiBold', color: C.textSecondary },
  fastToggleTextActive: { color: '#FFF' },

  sunnahRevivalCard: { backgroundColor: C.bgSurface, borderRadius: 18, marginHorizontal: 18, marginTop: 16, padding: 18},
  sunnahHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sunnahTitle: { fontSize: 14, fontFamily: 'Jost_700Bold', color: C.gold },
  sunnahContent: { flexDirection: 'row', alignItems: 'center' },
  sunnahIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sunnahInfo: { flex: 1, marginLeft: 14 },
  sunnahName: { fontSize: 15, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  sunnahDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  sectionTitle: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginHorizontal: 18, marginTop: 24, marginBottom: 10 },

  overviewCard: { backgroundColor: C.bgSurface, borderRadius: 18, marginHorizontal: 18, padding: 16},
  overviewItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  overviewItemToday: { backgroundColor: '#FFF5F0', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 10 },
  overviewDot: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F5F5F0', justifyContent: 'center', alignItems: 'center' },
  overviewInfo: { flex: 1, marginLeft: 12 },
  overviewTitle: { fontSize: 14, fontFamily: 'Jost_500Medium', color: C.textPrimary },
  overviewTitleToday: { color: C.primary, fontFamily: 'Jost_600SemiBold' },
  overviewDay: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  todayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: C.primary },
  todayBadgeText: { fontSize: 10, color: '#FFF', fontFamily: 'Jost_700Bold' }});
