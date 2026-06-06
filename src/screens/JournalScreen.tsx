import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, PrayerId, PRAYER_IDS } from '../types';
import { loadPrayerJournal, addJournalEntry } from '../services/StorageService';

const MOODS = [
  { value: 'peaceful', label: 'Peaceful', icon: 'leaf-outline', color: C.coral },
  { value: 'grateful', label: 'Grateful', icon: 'heart-outline', color: C.red },
  { value: 'joyful', label: 'Joyful', icon: 'sunny-outline', color: '#F59E0B' },
  { value: 'distracted', label: 'Distracted', icon: 'cloud-outline', color: C.textSecondary },
  { value: 'tired', label: 'Tired', icon: 'moon-outline', color: '#4B5563' },
  { value: 'anxious', label: 'Anxious', icon: 'rainy-outline', color: C.warmBlue },
] as const;

const PRAYER_NAMES: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha'
};

export default function JournalScreen() {
  const [entries, setEntries] = useState<Record<string, any[]>>({});
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerId>('fajr');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [improvement, setImprovement] = useState('');
  const todayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadPrayerJournal().then(setEntries);
  }, []);

  const saveEntry = async () => {
    if (!selectedMood) {
      Alert.alert('Select Mood', 'Please select how you felt during this prayer');
      return;
    }

    const entry = {
      id: Date.now().toString(),
      date: todayKey,
      prayerId: selectedPrayer,
      mood: selectedMood as any,
      reflection: reflection || undefined,
      gratitude: gratitude || undefined,
      improvement: improvement || undefined};

    const journal = await addJournalEntry(entry);
    setEntries(journal);

    // Reset form
    setSelectedMood('');
    setReflection('');
    setGratitude('');
    setImprovement('');

    Alert.alert('Entry Saved', 'Your reflection has been recorded');
  };

  const todayEntries = entries[todayKey] || [];
  const allEntries = Object.entries(entries).flatMap(([date, dayEntries]) =>
    dayEntries.map(e => ({ ...e, date }))
  ).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Prayer Journal</Text>
        <Text style={styles.subtitle}>Reflect on your prayers</Text>
      </View>

      {/* Today's Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{todayEntries.length}</Text>
          <Text style={styles.summaryLabel}>Entries Today</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{allEntries.length}</Text>
          <Text style={styles.summaryLabel}>Total Entries</Text>
        </View>
      </View>

      {/* New Entry Form */}
      <Text style={styles.sectionTitle}>New Entry</Text>

      {/* Prayer Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prayerSelector}>
        {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerId[]).map(prayer => (
          <TouchableOpacity
            key={prayer}
            style={[styles.prayerChip, selectedPrayer === prayer && styles.prayerChipActive]}
            onPress={() => setSelectedPrayer(prayer)}
          >
            <Text style={[styles.prayerChipLabel, selectedPrayer === prayer && styles.prayerChipLabelActive]}>
              {PRAYER_NAMES[prayer]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mood Selector */}
      <Text style={styles.inputLabel}>How did you feel?</Text>
      <View style={styles.moodGrid}>
        {MOODS.map(mood => (
          <TouchableOpacity
            key={mood.value}
            style={[styles.moodChip, selectedMood === mood.value && { backgroundColor: mood.color + '15', borderColor: mood.color }]}
            onPress={() => setSelectedMood(mood.value)}
          >
            <Ionicons name={mood.icon as any} size={20} color={selectedMood === mood.value ? mood.color : C.textMuted} />
            <Text style={[styles.moodLabel, selectedMood === mood.value && { color: mood.color, fontWeight: '700' }]}>
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reflection Inputs */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Reflection</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="What stood out during this prayer?"
          placeholderTextColor={C.textMuted}
          value={reflection}
          onChangeText={setReflection}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Gratitude</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="What are you grateful for?"
          placeholderTextColor={C.textMuted}
          value={gratitude}
          onChangeText={setGratitude}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Improvement</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="What can you improve for next time?"
          placeholderTextColor={C.textMuted}
          value={improvement}
          onChangeText={setImprovement}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveEntry}>
        <Ionicons name="save-outline" size={18} color="#FFF" />
        <Text style={styles.saveBtnText}>Save Entry</Text>
      </TouchableOpacity>

      {/* Recent Entries */}
      {allEntries.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Entries</Text>
          {allEntries.slice(0, 10).map((entry, index) => {
            const mood = MOODS.find(m => m.value === entry.mood);
            return (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryPrayer}>
                    <Text style={styles.entryPrayerText}>{PRAYER_NAMES[entry.prayerId]}</Text>
                  </View>
                  <Text style={styles.entryDate}>{entry.date}</Text>
                </View>
                {mood && (
                  <View style={[styles.moodBadge, { backgroundColor: mood.color + '10' }]}>
                    <Ionicons name={mood.icon as any} size={12} color={mood.color} />
                    <Text style={[styles.moodBadgeText, { color: mood.color }]}>{mood.label}</Text>
                  </View>
                )}
                {entry.reflection && (
                  <Text style={styles.entryText}>{entry.reflection}</Text>
                )}
                {entry.gratitude && (
                  <View style={styles.entryField}>
                    <Text style={styles.entryFieldLabel}>Gratitude:</Text>
                    <Text style={styles.entryFieldText}>{entry.gratitude}</Text>
                  </View>
                )}
                {entry.improvement && (
                  <View style={styles.entryField}>
                    <Text style={styles.entryFieldLabel}>Improvement:</Text>
                    <Text style={styles.entryFieldText}>{entry.improvement}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingBottom: 120 },
  header: { padding: 18, paddingTop: 60, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: C.textPrimary },
  subtitle: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 4 },

  summaryCard: { flexDirection: 'row', backgroundColor: C.bgSurface, borderRadius: 18, margin: 18, marginBottom: 12, padding: 16},
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: C.border },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: C.coral },
  summaryLabel: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginHorizontal: 18, marginTop: 8, marginBottom: 10 },

  prayerSelector: { paddingHorizontal: 18, paddingBottom: 8 },
  prayerChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: C.bgSurface, marginRight: 8},
  prayerChipActive: { backgroundColor: C.coral },
  prayerChipLabel: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  prayerChipLabelActive: { color: '#FFF', fontWeight: '700' },

  inputLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginHorizontal: 18, marginBottom: 8, marginTop: 12 },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 8 },
  moodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: C.bgSurface, borderWidth: 1.5, borderColor: 'transparent', marginBottom: 4 },
  moodLabel: { fontSize: 12, color: C.textSecondary, fontWeight: '500' },

  inputCard: { backgroundColor: C.bgSurface, borderRadius: 18, marginHorizontal: 18, marginBottom: 10, padding: 16 },
  textInput: { fontSize: 14, color: C.textPrimary, lineHeight: 22, minHeight: 60, textAlignVertical: 'top' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.coral, borderRadius: 16, marginHorizontal: 18, marginTop: 8, paddingVertical: 16 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  entryCard: { backgroundColor: C.bgSurface, borderRadius: 18, marginHorizontal: 18, marginBottom: 10, padding: 16},
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  entryPrayer: { backgroundColor: C.coralPale, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  entryPrayerText: { fontSize: 12, fontWeight: '700', color: C.coral },
  entryDate: { fontSize: 12, color: C.textMuted },
  moodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
  moodBadgeText: { fontSize: 11, fontWeight: '600' },
  entryText: { fontSize: 14, color: C.textPrimary, lineHeight: 22, fontStyle: 'italic' },
  entryField: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F8F8F8' },
  entryFieldLabel: { fontSize: 12, fontWeight: '600', color: C.textMuted, marginBottom: 2 },
  entryFieldText: { fontSize: 13, color: C.textSecondary, lineHeight: 20 }});
