import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, PrayerId } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useSnackbar } from '../components/Snackbar';
import { Fab } from '../components/Fab';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { loadPrayerJournal, addJournalEntry } from '../services/StorageService';

const MOODS = [
  { value: 'peaceful',  label: 'Peaceful',  icon: 'leaf-outline',   color: C.emerald },
  { value: 'grateful',  label: 'Grateful',  icon: 'heart-outline',  color: C.red },
  { value: 'joyful',    label: 'Joyful',    icon: 'sunny-outline',  color: C.amber },
  { value: 'distracted',label: 'Distracted',icon: 'cloud-outline',  color: C.textSecondary },
  { value: 'tired',     label: 'Tired',     icon: 'moon-outline',   color: '#4B5563' },
  { value: 'anxious',   label: 'Anxious',   icon: 'rainy-outline',  color: C.blue },
] as const;

const PRAYER_NAMES: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

export default function JournalScreen() {
  const { c, type, radius } = useTheme();
  const { show } = useSnackbar();
  const [entries, setEntries] = useState<Record<string, any[]>>({});
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerId>('fajr');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [improvement, setImprovement] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const todayKey = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    const j = await loadPrayerJournal();
    setEntries(j);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const saveEntry = async () => {
    if (!selectedMood) {
      show({ message: 'Please select a mood', variant: 'error', icon: 'alert-circle' });
      return;
    }
    const entry = {
      id: Date.now().toString(),
      date: todayKey,
      prayerId: selectedPrayer,
      mood: selectedMood as any,
      reflection: reflection || undefined,
      gratitude: gratitude || undefined,
      improvement: improvement || undefined,
    };
    const journal = await addJournalEntry(entry);
    setEntries(journal);
    setSelectedMood('');
    setReflection('');
    setGratitude('');
    setImprovement('');
    show({ message: 'Reflection saved', variant: 'success', icon: 'bookmark' });
  };

  const todayEntries = entries[todayKey] || [];
  const allEntries = Object.entries(entries).flatMap(([date, dayEntries]) =>
    dayEntries.map(e => ({ ...e, date }))
  ).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bgBase }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} colors={[c.emerald]} />}
      >
        <View style={[styles.header, { backgroundColor: c.heroBg, paddingTop: 60 }]}>
          <Text style={[type.headline, { color: c.onHero, fontSize: 22, fontWeight: '700' }]}>Prayer Journal</Text>
          <Text style={[type.body, { color: c.onDarkMuted, marginTop: 4 }]}>Reflect on your prayers</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, margin: 18, marginBottom: 12, padding: 16 }]}>
          <View style={styles.summaryItem}>
            <Text style={[type.headline, { color: c.emerald, fontWeight: '700' }]}>{todayEntries.length}</Text>
            <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>Entries Today</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[type.headline, { color: c.emerald, fontWeight: '700' }]}>{allEntries.length}</Text>
            <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>Total Entries</Text>
          </View>
        </View>

        <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 8, marginBottom: 10 }]}>
          New Entry
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8, gap: 8, flexDirection: 'row' }}>
          {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerId[]).map(prayer => (
            <Chip
              key={prayer}
              label={PRAYER_NAMES[prayer]}
              selected={selectedPrayer === prayer}
              onPress={() => setSelectedPrayer(prayer)}
            />
          ))}
        </ScrollView>

        <Text style={[type.body, { color: c.textPrimary, marginHorizontal: 18, marginBottom: 8, marginTop: 12, fontWeight: '600' }]}>
          How did you feel?
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 8 }}>
          {MOODS.map(mood => {
            const active = selectedMood === mood.value;
            return (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodChip,
                  {
                    backgroundColor: active ? mood.color + '18' : c.bgSurface,
                    borderColor: active ? mood.color : 'transparent',
                    borderRadius: 14,
                  },
                ]}
                onPress={() => setSelectedMood(mood.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${mood.label} mood`}
              >
                <Ionicons name={mood.icon as any} size={20} color={active ? mood.color : c.textMuted} />
                <Text style={[type.caption, { color: active ? mood.color : c.textSecondary, fontWeight: active ? '700' : '500' }]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {([
          { label: 'Reflection', value: reflection, setter: setReflection, placeholder: 'What stood out during this prayer?' },
          { label: 'Gratitude',  value: gratitude,  setter: setGratitude,  placeholder: 'What are you grateful for?' },
          { label: 'Improvement',value: improvement,setter: setImprovement,placeholder: 'What can you improve for next time?' },
        ]).map(field => (
          <View
            key={field.label}
            style={[styles.inputCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, marginBottom: 10, padding: 16 }]}
          >
            <Text style={[type.body, { color: c.textPrimary, fontWeight: '600', marginBottom: 8 }]}>
              {field.label}
            </Text>
            <TextInput
              style={[styles.textInput, { color: c.textPrimary }]}
              multiline
              placeholder={field.placeholder}
              placeholderTextColor={c.textMuted}
              value={field.value}
              onChangeText={field.setter}
              textAlignVertical="top"
              accessibilityLabel={field.label}
            />
          </View>
        ))}

        <View style={{ paddingHorizontal: 18, marginTop: 8 }}>
          <Button label="Save Entry" onPress={saveEntry} icon="save-outline" variant="filled" size="lg" fullWidth />
        </View>

        <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 24, marginBottom: 10 }]}>
          Recent Entries
        </Text>
        {allEntries.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="No journal entries yet"
            message="Reflect on your prayers to start building a record of your spiritual journey"
            compact
          />
        ) : (
          allEntries.slice(0, 10).map((entry) => {
            const mood = MOODS.find(m => m.value === entry.mood);
            return (
              <View
                key={entry.id}
                style={[styles.entryCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, marginBottom: 10, padding: 16 }]}
                accessibilityLabel={`Journal entry for ${PRAYER_NAMES[entry.prayerId]} on ${entry.date}${mood ? `, mood ${mood.label}` : ''}`}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={[styles.entryPrayer, { backgroundColor: c.emeraldPale, borderRadius: 10 }]}>
                    <Text style={[type.caption, { color: c.emerald, fontWeight: '700' }]}>{PRAYER_NAMES[entry.prayerId]}</Text>
                  </View>
                  <Text style={[type.caption, { color: c.textMuted }]}>{entry.date}</Text>
                </View>
                {mood && (
                  <View style={[styles.moodBadge, { backgroundColor: mood.color + '12', borderRadius: 10 }]}>
                    <Ionicons name={mood.icon as any} size={12} color={mood.color} />
                    <Text style={[type.caption, { color: mood.color, fontWeight: '600' }]}>{mood.label}</Text>
                  </View>
                )}
                {entry.reflection && (
                  <Text style={[type.body, { color: c.textPrimary, lineHeight: 22, fontStyle: 'italic' }]}>
                    {entry.reflection}
                  </Text>
                )}
                {entry.gratitude && (
                  <View style={[styles.entryField, { borderTopColor: c.border }]}>
                    <Text style={[type.caption, { color: c.textMuted, marginBottom: 2, fontWeight: '600' }]}>Gratitude</Text>
                    <Text style={[type.body, { color: c.textSecondary, lineHeight: 20 }]}>{entry.gratitude}</Text>
                  </View>
                )}
                {entry.improvement && (
                  <View style={[styles.entryField, { borderTopColor: c.border }]}>
                    <Text style={[type.caption, { color: c.textMuted, marginBottom: 2, fontWeight: '600' }]}>Improvement</Text>
                    <Text style={[type.body, { color: c.textSecondary, lineHeight: 20 }]}>{entry.improvement}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Fab
        icon="add"
        label="New Entry"
        onPress={saveEntry}
        style={{ position: 'absolute', right: 16, bottom: 96 }}
        accessibilityLabel="Save new journal entry"
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { padding: 18 },
  summaryCard: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1 },
  moodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5 },
  inputCard: {},
  textInput: { fontSize: 14, lineHeight: 22, minHeight: 60, textAlignVertical: 'top' },
  entryCard: {},
  entryPrayer: { paddingHorizontal: 10, paddingVertical: 4 },
  moodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  entryField: { marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
});
