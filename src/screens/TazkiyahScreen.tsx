import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { iconName } from '../components/Icon';
import { C } from '../types';
import { mmkv } from '../services/StorageService';
import { getLocalDateKey } from '../utils/date';

const TAZKIYAH_KEY = '@prayertime:tazkiyah_log';

interface TazkiyahEntry {
  date: string;
  muhasabah: string;
  gratitude: string[];
  sabrMoment: string;
  heartCheck: number;
  notes?: string;
}

const HEART_CHECKS = [
  { value: 1, label: 'Struggling', icon: 'sad-outline' },
  { value: 2, label: 'Uneasy', icon: 'cloud-outline' },
  { value: 3, label: 'Peaceful', icon: 'leaf-outline' },
  { value: 4, label: 'Grateful', icon: 'heart-outline' },
  { value: 5, label: 'Exalted', icon: 'sunny-outline' },
];

const DEATH_REMINDERS = [
  { quote: 'Remember often the destroyer of pleasures.', source: '— The Prophet ﷺ (Tirmidhi)' },
  { quote: 'The grave is the first stage of the Hereafter.', source: '— Ibn Majah' },
  { quote: 'Whoever loves to meet Allah, Allah loves to meet him.', source: '— Bukhari' },
  { quote: 'The intelligent person is the one who subjects himself to account.', source: '— Umar ibn al-Khattab' },
  { quote: 'Today is action without reckoning, tomorrow is reckoning without action.', source: '— Early Muslim saying' },
];

function getDateKey(): string {
  return getLocalDateKey();
}

export default function TazkiyahScreen() {
  const [todayEntry, setTodayEntry] = useState<TazkiyahEntry>({
    date: getDateKey(), muhasabah: '', gratitude: ['', '', ''],
    sabrMoment: '', heartCheck: 3,
  });
  const [entries, setEntries] = useState<TazkiyahEntry[]>([]);
  const [showDeathReflection, setShowDeathReflection] = useState(false);

  const todayReminder = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return DEATH_REMINDERS[dayOfYear % DEATH_REMINDERS.length];
  }, []);

  useEffect(() => {
    const raw = mmkv.getString(TAZKIYAH_KEY);
    if (raw) {
      const all: TazkiyahEntry[] = JSON.parse(raw);
      setEntries(all);
      const today = all.find(e => e.date === getDateKey());
      if (today) setTodayEntry(today);
    }
  }, []);

  const saveEntry = () => {
    const filtered = entries.filter(e => e.date !== getDateKey());
    const all = [todayEntry, ...filtered];
    setEntries(all);
    mmkv.set(TAZKIYAH_KEY, JSON.stringify(all));
  };

  const updateGratitude = (text: string, index: number) => {
    const next = [...todayEntry.gratitude];
    next[index] = text;
    setTodayEntry(prev => ({ ...prev, gratitude: next }));
  };

  const streak = entries.filter(e => e.muhasabah.length > 0).length;
  const avgHeart = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.heartCheck, 0) / entries.length * 10) / 10 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Tazkiyah</Text>
        <Text style={styles.subtitle}>Purification of the Heart</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>days of muhasabah</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{avgHeart}/5</Text>
          <Text style={styles.statLabel}>avg heart state</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{todayEntry.gratitude.filter(g => g.length > 0).length}/3</Text>
          <Text style={styles.statLabel}>blessings today</Text>
        </View>
      </View>

      {/* Daily Muhasabah */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="search-outline" size={18} color={C.primary} />
          <Text style={styles.cardTitle}>Daily Muhasabah</Text>
        </View>
        <Text style={styles.cardHint}>Take 2 minutes to review your day. Be honest with yourself — this is between you and your Creator.</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="What did I do well today? What needs tawbah? How can I improve tomorrow?"
          placeholderTextColor={C.textMuted}
          value={todayEntry.muhasabah}
          onChangeText={t => setTodayEntry(prev => ({ ...prev, muhasabah: t }))}
          textAlignVertical="top"
        />
      </View>

      {/* Heart State Check */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="heart-outline" size={18} color={C.primary} />
          <Text style={styles.cardTitle}>State of Your Heart</Text>
        </View>
        <View style={styles.heartRow}>
          {HEART_CHECKS.map(h => (
            <TouchableOpacity
              key={h.value}
              style={[styles.heartBtn, todayEntry.heartCheck === h.value && styles.heartBtnActive]}
              onPress={() => setTodayEntry(prev => ({ ...prev, heartCheck: h.value }))}
            >
              <Ionicons name={iconName(h.icon)} size={20} color={todayEntry.heartCheck === h.value ? C.white : C.textSecondary} />
              <Text style={[styles.heartLabel, todayEntry.heartCheck === h.value && styles.heartLabelActive]}>{h.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Gratitude Practice */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="sunny-outline" size={18} color={C.gold} />
          <Text style={styles.cardTitle}>3 Blessings</Text>
        </View>
        <Text style={styles.cardHint}>Name 3 blessings from today — big or small. Train your heart to see Allah's goodness.</Text>
        {[0, 1, 2].map(i => (
          <TextInput
            key={i}
            style={styles.gratitudeInput}
            placeholder={i === 0 ? 'e.g., Woke up healthy' : i === 1 ? 'e.g., A kind conversation' : 'e.g., The taste of water'}
            placeholderTextColor={C.textMuted}
            value={todayEntry.gratitude[i]}
            onChangeText={t => updateGratitude(t, i)}
          />
        ))}
      </View>

      {/* Moment of Sabr */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-outline" size={18} color={C.gold} />
          <Text style={styles.cardTitle}>Moment of Patience (Sabr)</Text>
        </View>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Did you exercise patience today? When was it hardest? How did you respond?"
          placeholderTextColor={C.textMuted}
          value={todayEntry.sabrMoment}
          onChangeText={t => setTodayEntry(prev => ({ ...prev, sabrMoment: t }))}
          textAlignVertical="top"
        />
      </View>

      {/* Death Remembrance */}
      <TouchableOpacity style={styles.reminderCard} onPress={() => setShowDeathReflection(!showDeathReflection)}>
        <View style={styles.cardHeader}>
          <Ionicons name="moon-outline" size={18} color={C.primary} />
          <Text style={styles.cardTitle}>Dhikr al-Mawt</Text>
          <Ionicons name={showDeathReflection ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
        </View>
        <Text style={styles.reminderQuote}>{todayReminder.quote}</Text>
        <Text style={styles.reminderSource}>{todayReminder.source}</Text>
        {showDeathReflection && (
          <TextInput
            style={[styles.textArea, { marginTop: 10 }]}
            multiline
            placeholder="How does this reminder make you feel? What action does it call you to?"
            placeholderTextColor={C.textMuted}
            value={todayEntry.notes}
            onChangeText={t => setTodayEntry(prev => ({ ...prev, notes: t }))}
            textAlignVertical="top"
          />
        )}
      </TouchableOpacity>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={saveEntry}>
        <Ionicons name="save-outline" size={18} color={C.white} />
        <Text style={styles.saveBtnText}>Save Today's Muhasabah</Text>
      </TouchableOpacity>

      {/* Past Entries */}
      {entries.slice(0, 5).map((entry, i) => (
        <View key={i} style={styles.entryCard}>
          <Text style={styles.entryDate}>{entry.date}</Text>
          {entry.muhasabah.length > 0 && <Text style={styles.entryText} numberOfLines={2}>{entry.muhasabah}</Text>}
          <View style={styles.entryMeta}>
            <Text style={styles.entryMetaText}>Heart: {entry.heartCheck}/5</Text>
            <Text style={styles.entryMetaText}>Blessings: {entry.gratitude.filter(g => g.length > 0).length}</Text>
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingBottom: 120 },
  header: { padding: 18, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.goldPale },
  subtitle: { fontSize: 14, color: C.goldLight, fontFamily: 'Jost_400Regular', marginTop: 4 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', margin: 18, marginBottom: 10 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontFamily: 'Jost_700Bold', color: C.primary },
  statLabel: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  card: { backgroundColor: C.surfaceElevated, borderRadius: 18, margin: 18, marginBottom: 10, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.textPrimary, flex: 1 },
  cardHint: { fontSize: 12, color: C.textMuted, marginBottom: 10, lineHeight: 18 },

  textArea: { backgroundColor: C.bgBase, borderRadius: 12, padding: 14, fontSize: 14, color: C.textPrimary, minHeight: 100, lineHeight: 22 },

  heartRow: { flexDirection: 'row', gap: 6 },
  heartBtn: { alignItems: 'center', padding: 8, borderRadius: 12, backgroundColor: C.bgCard, flex: 1 },
  heartBtnActive: { backgroundColor: C.primary },
  heartLabel: { fontSize: 9, color: C.textMuted, marginTop: 4 },
  heartLabelActive: { color: C.white, fontFamily: 'Jost_600SemiBold' },

  gratitudeInput: { backgroundColor: C.bgBase, borderRadius: 10, padding: 12, fontSize: 14, color: C.textPrimary, marginBottom: 8 },

  reminderCard: { backgroundColor: C.bgCard, borderRadius: 18, margin: 18, marginBottom: 10, padding: 16, borderLeftWidth: 3, borderLeftColor: C.primary },
  reminderQuote: { fontSize: 14, color: C.textPrimary, fontStyle: 'italic', lineHeight: 22, marginTop: 4 },
  reminderSource: { fontSize: 12, color: C.textMuted, marginTop: 6 },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 16, margin: 18, paddingVertical: 14 },
  saveBtnText: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.white },

  entryCard: { backgroundColor: C.bgSurface, borderRadius: 14, marginHorizontal: 18, marginBottom: 8, padding: 14 },
  entryDate: { fontSize: 11, color: C.textMuted, fontFamily: 'Jost_600SemiBold' },
  entryText: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
  entryMeta: { flexDirection: 'row', gap: 16, marginTop: 6 },
  entryMetaText: { fontSize: 11, color: C.textMuted },
});
