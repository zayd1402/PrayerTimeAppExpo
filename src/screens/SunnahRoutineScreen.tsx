import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { iconName } from '../components/Icon';
import { C } from '../types';
import { SUNNAH_ROUTINE, SunnahItem } from '../data/sunnahRoutine';
import { mmkv, getStreak } from '../services/StorageService';
import { getLocalDateKey } from '../utils/date';

const SUNNAH_LOG_KEY = '@prayertime:sunnah_log';

type Category = 'morning' | 'evening' | 'night';

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'morning', label: 'Morning', icon: 'sunny-outline' },
  { id: 'evening', label: 'Evening', icon: 'moon-outline' },
  { id: 'night', label: 'Night', icon: 'bed-outline' },
];

function getDateKey(): string {
  return getLocalDateKey();
}

function getTodayLog(): Record<string, number> {
  const raw = mmkv.getString(SUNNAH_LOG_KEY);
  if (raw) return JSON.parse(raw);
  return {};
}

function saveLog(log: Record<string, Record<string, number>>): void {
  mmkv.set(SUNNAH_LOG_KEY, JSON.stringify(log));
}

export default function SunnahRoutineScreen() {
  const [activeTab, setActiveTab] = useState<Category>('morning');
  const [todayLog, setTodayLog] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setTodayLog(getTodayLog());
    getStreak().then(setStreak);
  }, []);

  const dateKey = getDateKey();
  const items = SUNNAH_ROUTINE.filter(i => i.category === activeTab);
  const completed = items.filter(i => (todayLog[i.id] || 0) >= i.count).length;
  const total = items.length;

  const recordCount = (item: SunnahItem) => {
    const current = todayLog[item.id] || 0;
    const next = current < item.count ? item.count : 0;
    setTodayLog(prev => {
      const nextLog = { ...prev, [item.id]: next };
      const fullLog = JSON.parse(mmkv.getString(SUNNAH_LOG_KEY) || '{}');
      fullLog[dateKey] = nextLog;
      saveLog(fullLog);
      return nextLog;
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Sunnah</Text>
        <Text style={styles.subtitle}>Amal al-Yawm wal-Laylah</Text>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakItem}>
          <Ionicons name="flame-outline" size={20} color={C.primary} />
          <Text style={styles.streakValue}>{streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color={C.primary} />
          <Text style={styles.streakValue}>{completed}/{total}</Text>
          <Text style={styles.streakLabel}>today</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {CATEGORIES.map(cat => {
          const isActive = cat.id === activeTab;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(cat.id)}
            >
              <Ionicons name={iconName(cat.icon)} size={16} color={isActive ? C.white : C.textSecondary} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {items.map(item => {
        const current = todayLog[item.id] || 0;
        const isComplete = current >= item.count;
        return (
          <View key={item.id} style={[styles.itemCard, isComplete && styles.itemCardComplete]}>
            <View style={styles.itemHeader}>
              <TouchableOpacity
                style={[styles.checkCircle, isComplete && styles.checkCircleDone]}
                onPress={() => recordCount(item)}
              >
                {isComplete && <Ionicons name="checkmark" size={14} color={C.white} />}
              </TouchableOpacity>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, isComplete && styles.itemTitleDone]}>{item.title}</Text>
                <Text style={styles.itemArabic}>{item.arabic}</Text>
              </View>
            </View>

            <View style={styles.itemFooter}>
              <View style={styles.countRow}>
                {isComplete ? (
                  <Text style={styles.completeLabel}>Complete</Text>
                ) : (
                  <>
                    {[...Array(Math.min(item.count, 34))].map((_, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.countDot,
                          current > i && styles.countDotFilled,
                          item.count > 33 && i >= 33 && styles.countDotLast,
                        ]}
                        onPress={() => {
                          setTodayLog(prev => {
                            const nextLog = { ...prev, [item.id]: Math.max(current, i + 1) };
                            const fullLog = JSON.parse(mmkv.getString(SUNNAH_LOG_KEY) || '{}');
                            fullLog[dateKey] = nextLog;
                            saveLog(fullLog);
                            return nextLog;
                          });
                        }}
                      />
                    ))}
                    {item.count > 33 && (
                      <TouchableOpacity style={styles.tapToFill} onPress={() => recordCount(item)}>
                        <Ionicons name="add" size={12} color={C.primary} />
                        <Text style={styles.tapFillText}>Fill</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.countText}>{current}/{item.count}</Text>
                  </>
                )}
              </View>
              {item.source && <Text style={styles.sourceText}>{item.source}</Text>}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingBottom: 120 },
  header: { padding: 18, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.goldPale },
  subtitle: { fontSize: 14, color: C.goldLight, fontFamily: 'Jost_400Regular', marginTop: 4 },

  streakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: C.goldPale, borderRadius: 16, margin: 18, marginBottom: 10,
    paddingVertical: 14,
  },
  streakItem: { alignItems: 'center' },
  streakValue: { fontSize: 22, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  streakLabel: { fontSize: 11, fontFamily: 'Jost_500Medium', color: C.textMuted, marginTop: 1 },
  streakDivider: { width: 1, height: 32, backgroundColor: C.border },

  tabRow: { flexDirection: 'row', marginHorizontal: 18, marginBottom: 12, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: C.bgSurface },
  tabActive: { backgroundColor: C.primary },
  tabLabel: { fontSize: 13, fontFamily: 'Jost_600SemiBold', color: C.textSecondary },
  tabLabelActive: { color: C.white },

  itemCard: { backgroundColor: C.surfaceElevated, borderRadius: 16, marginHorizontal: 18, marginBottom: 10, padding: 14 },
  itemCardComplete: { backgroundColor: C.goldPale },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.borderStrong, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkCircleDone: { backgroundColor: C.primary, borderColor: C.primary },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  itemTitleDone: { color: C.textMuted, textDecorationLine: 'line-through' },
  itemArabic: { fontSize: 13, color: C.textSecondary, marginTop: 6, lineHeight: 22, textAlign: 'right' },

  itemFooter: { marginTop: 10 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  countDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  countDotFilled: { backgroundColor: C.primary, borderColor: C.primary },
  countDotLast: {},
  countText: { fontSize: 12, fontFamily: 'Jost_600SemiBold', color: C.textMuted, marginLeft: 4 },
  completeLabel: { fontSize: 12, fontFamily: 'Jost_700Bold', color: C.primary },
  tapToFill: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tapFillText: { fontSize: 10, fontFamily: 'Jost_600SemiBold', color: C.primary },
  sourceText: { fontSize: 11, color: C.textMuted, marginTop: 4, fontStyle: 'italic' },
});
