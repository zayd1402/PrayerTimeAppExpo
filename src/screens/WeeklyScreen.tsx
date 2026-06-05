import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useSnackbar } from '../components/Snackbar';
import { EmptyState } from '../components/EmptyState';
import { loadFastingLog, toggleFast } from '../services/StorageService';

interface WeeklyActivity {
  id: string;
  title: string;
  description: string;
  dayOfWeek: number;
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
  const { c, type, radius } = useTheme();
  const { show } = useSnackbar();
  const [fastingLog, setFastingLog] = useState<Record<string, any>>({});
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date().getDay();

  const loadData = useCallback(async () => {
    const log = await loadFastingLog();
    setFastingLog(log);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

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
    show({
      message: isFastActive(type) ? 'Fast unmarked' : 'Fast marked',
      variant: 'success',
      icon: 'water-outline',
    });
  };

  const isFastActive = (type: string) => {
    const dateKey = getDateKeyForDay(selectedDay);
    return fastingLog[dateKey]?.type === type;
  };

  const currentWeek = Math.ceil(new Date().getDate() / 7);
  const weeklySunnah = SUNNAH_REVIVAL[(currentWeek - 1) % SUNNAH_REVIVAL.length];
  const todaysActivities = WEEKLY_ACTIVITIES.filter(a => a.dayOfWeek === selectedDay);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bgBase }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} colors={[c.emerald]} />}
    >
      <View style={[styles.header, { backgroundColor: c.heroBg, paddingTop: 60 }]}>
        <Text style={[type.headline, { color: c.onHero, fontSize: 22, fontWeight: '700' }]}>Weekly Activities</Text>
        <Text style={[type.body, { color: c.onDarkMuted, marginTop: 4 }]}>Sunnah practices throughout the week</Text>
      </View>

      {/* Day Selector */}
      <View
        style={[styles.daySelector, { paddingHorizontal: 18, marginTop: 16, marginBottom: 8 }]}
        accessibilityRole="tablist"
        accessibilityLabel="Day of the week"
      >
        {DAY_SHORT.map((day, index) => {
          const isSelected = index === selectedDay;
          const isToday = index === today;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayChip,
                {
                  backgroundColor: isSelected ? c.emerald : c.bgSurface,
                  borderRadius: radius.md,
                  borderWidth: isToday && !isSelected ? 1 : 0,
                  borderColor: c.gold,
                  minWidth: 44,
                },
              ]}
              onPress={() => setSelectedDay(index)}
              accessibilityRole="tab"
              accessibilityLabel={`${DAY_NAMES[index]}${isToday ? ', today' : ''}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  type.caption,
                  {
                    fontSize: 12,
                    fontWeight: '600',
                    color: isSelected ? '#FFF' : isToday ? c.gold : c.textSecondary,
                  },
                ]}
              >
                {day}
              </Text>
              {isToday && <View style={[styles.todayDot, { backgroundColor: isSelected ? '#FFF' : c.gold }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Name */}
      <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginBottom: 12, fontSize: 18, fontWeight: '700' }]}>
        {DAY_NAMES[selectedDay]}{selectedDay === today ? ' (Today)' : ''}
      </Text>

      {/* Activities for Selected Day */}
      {todaysActivities.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Ionicons name="calendar-outline" size={40} color={c.textMuted} />
          <Text style={[type.body, { color: c.textSecondary, marginTop: 12, fontWeight: '500' }]}>
            No specific activities for {DAY_NAMES[selectedDay]}
          </Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 4 }]}>
            Use this day for general worship and good deeds
          </Text>
        </View>
      ) : (
        todaysActivities.map(activity => (
          <View
            key={activity.id}
            style={[styles.activityCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, padding: 16, marginHorizontal: 18, marginBottom: 10 }]}
            accessibilityLabel={`${activity.title}: ${activity.description}`}
          >
            <View
              style={[
                styles.activityIconWrap,
                {
                  backgroundColor: activity.type === 'fasting' ? c.emeraldPale : activity.type === 'reminder' ? c.goldPale : c.emeraldPale,
                  borderRadius: 14,
                },
              ]}
            >
              <Ionicons
                name={activity.icon as any}
                size={22}
                color={activity.type === 'fasting' ? c.emerald : activity.type === 'reminder' ? c.gold : c.blue}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[type.body, { color: c.textPrimary, fontWeight: '600' }]}>{activity.title}</Text>
              <Text style={[type.caption, { color: c.textMuted, marginTop: 2, lineHeight: 18 }]}>{activity.description}</Text>
            </View>
            {activity.type === 'fasting' && (
              <TouchableOpacity
                style={[
                  styles.fastToggle,
                  {
                    backgroundColor: isFastActive(activity.action!) ? c.emerald : c.bgMuted,
                    borderRadius: 20,
                  },
                ]}
                onPress={() => toggleFasting(activity.action!)}
                accessibilityRole="button"
                accessibilityLabel={`${isFastActive(activity.action!) ? 'Fasting' : 'Not fasting'} for ${activity.title}, tap to toggle`}
                accessibilityState={{ selected: isFastActive(activity.action!) }}
              >
                <Text
                  style={[
                    type.caption,
                    {
                      fontSize: 12,
                      fontWeight: '600',
                      color: isFastActive(activity.action!) ? '#FFF' : c.textSecondary,
                    },
                  ]}
                >
                  {isFastActive(activity.action!) ? 'Fasting' : 'Fast'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      {/* Weekly Sunnah Revival */}
      <View style={[styles.sunnahRevivalCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, marginTop: 16, padding: 18 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Ionicons name="bulb-outline" size={18} color={c.gold} />
          <Text style={[type.label, { color: c.gold, fontWeight: '700' }]}>Sunnah Revival — Week {currentWeek}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.sunnahIconWrap, { backgroundColor: c.goldPale, borderRadius: 14 }]}>
            <Ionicons name={weeklySunnah.icon as any} size={24} color={c.gold} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[type.body, { color: c.textPrimary, fontWeight: '600' }]}>{weeklySunnah.title}</Text>
            <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{weeklySunnah.description}</Text>
          </View>
        </View>
      </View>

      {/* Weekly Overview */}
      <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 24, marginBottom: 10 }]}>
        Weekly Overview
      </Text>
      <View style={[styles.overviewCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, padding: 16 }]}>
        {WEEKLY_ACTIVITIES.map(activity => {
          const isTodayActivity = activity.dayOfWeek === today;
          return (
            <View
              key={activity.id}
              style={[
                styles.overviewItem,
                {
                  borderBottomColor: c.border,
                  backgroundColor: isTodayActivity ? c.bgPrayed : 'transparent',
                  borderRadius: 10,
                },
              ]}
            >
              <View style={[styles.overviewDot, { backgroundColor: c.bgMuted, borderRadius: 8 }]}>
                <Ionicons name={activity.icon as any} size={12} color={isTodayActivity ? '#FFF' : c.textMuted} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[type.body, { color: isTodayActivity ? c.emerald : c.textPrimary, fontWeight: isTodayActivity ? '600' : '500' }]}>
                  {activity.title}
                </Text>
                <Text style={[type.caption, { color: c.textMuted, marginTop: 1 }]}>{DAY_NAMES[activity.dayOfWeek]}</Text>
              </View>
              {isTodayActivity && (
                <View style={[styles.todayBadge, { backgroundColor: c.emerald }]}>
                  <Text style={[type.caption, { color: '#FFF', fontWeight: '700', fontSize: 10 }]}>Today</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 18 },
  daySelector: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  todayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  activityCard: { flexDirection: 'row', alignItems: 'center' },
  activityIconWrap: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  fastToggle: { paddingHorizontal: 14, paddingVertical: 8 },
  sunnahRevivalCard: {},
  sunnahIconWrap: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  overviewCard: {},
  overviewItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  overviewDot: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  todayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
});
