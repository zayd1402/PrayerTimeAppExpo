import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import { mmkv } from '../services/StorageService';

const HIFDH_LOG_KEY = '@prayertime:hifdh_log';

interface HifdhSession {
  date: string;
  type: 'sabaq' | 'sabaq-para' | 'manzil';
  surah: string;
  ayahStart: number;
  ayahEnd: number;
  juz: number;
  notes?: string;
}

const SURAH_NAMES = [
  'Al-Fatiha', 'Al-Baqarah', 'Aal-e-Imran', 'An-Nisa', 'Al-Ma\'idah', 'Al-An\'am',
  'Al-A\'raf', 'Al-Anfal', 'At-Tawbah', 'Yunus', 'Hud', 'Yusuf', 'Ar-Ra\'d',
  'Ibrahim', 'Al-Hijr', 'An-Nahl', 'Al-Isra', 'Al-Kahf', 'Maryam', 'Ta-Ha',
  'Al-Anbiya', 'Al-Hajj', 'Al-Mu\'minun', 'An-Nur', 'Al-Furqan', 'Ash-Shu\'ara',
  'An-Naml', 'Al-Qasas', 'Al-Ankabut', 'Ar-Rum', 'Luqman', 'As-Sajdah',
  'Al-Ahzab', 'Saba', 'Fatir', 'Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar',
  'Ghafir', 'Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah',
  'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf', 'Adh-Dhariyat',
  'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman', 'Al-Waqi\'ah', 'Al-Hadid',
  'Al-Mujadilah', 'Al-Hashr', 'Al-Mumtahanah', 'As-Saff', 'Al-Jumu\'ah',
  'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim', 'Al-Mulk',
  'Al-Qalam', 'Al-Haqqah', 'Al-Ma\'arij', 'Nuh', 'Al-Jinn', 'Al-Muzzammil',
  'Al-Muddaththir', 'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat', 'An-Naba\'',
  'An-Nazi\'at', 'Abasa', 'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin',
  'Al-Inshiqaq', 'Al-Buruj', 'At-Tariq', 'Al-A\'la', 'Al-Ghashiyah',
  'Al-Fajr', 'Al-Balad', 'Ash-Shams', 'Al-Layl', 'Ad-Duha', 'Ash-Sharh',
  'At-Tin', 'Al-Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-\'Adiyat',
  'Al-Qari\'ah', 'At-Takathur', 'Al-\'Asr', 'Al-Humazah', 'Al-Fil',
  'Quraysh', 'Al-Ma\'un', 'Al-Kawthar', 'Al-Kafirun', 'An-Nasr',
  'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas',
];

export default function HifdhScreen() {
  const [logs, setLogs] = useState<HifdhSession[]>([]);
  const [activeTab, setActiveTab] = useState<'sabaq' | 'sabaq-para' | 'manzil'>('sabaq');
  const [surah, setSurah] = useState('');
  const [ayahRange, setAyahRange] = useState('');
  const [juz, setJuz] = useState('');
  const [surahSearch, setSurahSearch] = useState('');

  useEffect(() => {
    const raw = mmkv.getString(HIFDH_LOG_KEY);
    if (raw) setLogs(JSON.parse(raw));
  }, []);

  const saveLog = (newLogs: HifdhSession[]) => {
    setLogs(newLogs);
    mmkv.set(HIFDH_LOG_KEY, JSON.stringify(newLogs));
  };

  const addSession = () => {
    if (!surah || !ayahRange) return;
    const [start, end] = ayahRange.split('-').map(s => parseInt(s.trim(), 10));
    if (isNaN(start)) return;
    const surahIndex = SURAH_NAMES.findIndex(s => s.toLowerCase().includes(surah.toLowerCase())) + 1;
    const session: HifdhSession = {
      date: new Date().toISOString().split('T')[0],
      type: activeTab,
      surah: SURAH_NAMES[surahIndex - 1] || surah,
      ayahStart: start,
      ayahEnd: end || start,
      juz: parseInt(juz, 10) || Math.ceil(surahIndex / 4),
    };
    saveLog([session, ...logs]);
    setSurah('');
    setAyahRange('');
    setJuz('');
  };

  const filteredLogs = logs.filter(l => l.type === activeTab);
  const totalAyahs = logs.reduce((s, l) => s + (l.ayahEnd - l.ayahStart + 1), 0);
  const todaySessions = logs.filter(l => l.date === new Date().toISOString().split('T')[0]);
  const filteredSurahs = SURAH_NAMES.filter(s =>
    s.toLowerCase().includes(surahSearch.toLowerCase())
  ).slice(0, 10);

  const tabs = [
    { id: 'sabaq' as const, label: 'New Memorization', icon: 'book-outline' },
    { id: 'sabaq-para' as const, label: 'Recent Revision', icon: 'refresh-outline' },
    { id: 'manzil' as const, label: 'Old Revision', icon: 'time-outline' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Quran Memorization</Text>
        <Text style={styles.subtitle}>Hifdh Tracker</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalAyahs}</Text>
          <Text style={styles.statLabel}>ayahs memorized</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{logs.length}</Text>
          <Text style={styles.statLabel}>total sessions</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{todaySessions.length}</Text>
          <Text style={styles.statLabel}>today</Text>
        </View>
      </View>

      {/* Mushaf Map — simplified 30-juz grid */}
      <View style={styles.mushafCard}>
        <Text style={styles.mushafTitle}>Juz Progress</Text>
        <View style={styles.mushafGrid}>
          {Array.from({ length: 30 }, (_, i) => {
            const juzAyahs = logs.filter(l => l.juz === i + 1).reduce((s, l) => s + (l.ayahEnd - l.ayahStart + 1), 0);
            return (
              <View key={i} style={[styles.juzBox, juzAyahs > 0 && styles.juzBoxActive]}>
                <Text style={[styles.juzBoxText, juzAyahs > 0 && styles.juzBoxTextActive]}>{i + 1}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon as any} size={14} color={activeTab === tab.id ? C.white : C.textSecondary} />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Session */}
      <View style={styles.inputCard}>
        <TextInput
          style={styles.surahInput}
          placeholder={activeTab === 'sabaq' ? 'Search surah...' : 'Surah name'}
          placeholderTextColor={C.textMuted}
          value={surahSearch || surah}
          onChangeText={t => { setSurahSearch(t); setSurah(t); }}
        />
        {surahSearch.length > 0 && surahSearch !== surah && (
          <View style={styles.suggestions}>
            {filteredSurahs.map(s => (
              <TouchableOpacity key={s} style={styles.suggestion} onPress={() => { setSurah(s); setSurahSearch(''); }}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.smallInput, { flex: 1 }]}
            placeholder="Ayah range (e.g. 1-10)"
            placeholderTextColor={C.textMuted}
            value={ayahRange}
            onChangeText={setAyahRange}
          />
          <TextInput
            style={[styles.smallInput, { width: 60 }]}
            placeholder="Juz"
            placeholderTextColor={C.textMuted}
            value={juz}
            onChangeText={setJuz}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addSession}>
            <Ionicons name="add" size={18} color={C.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Reminder */}
      <View style={styles.revisionCard}>
        <Ionicons name="alarm-outline" size={20} color={C.primary} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.revisionTitle}>Today's Revision</Text>
          <Text style={styles.revisionText}>
            {logs.length > 0
              ? `Review the last ${Math.min(logs.length, 3)} session(s) from today`
              : 'Add a memorization session to start tracking'}
          </Text>
        </View>
      </View>

      {/* Session History */}
      {filteredLogs.map((session, i) => (
        <View key={i} style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Ionicons name="book" size={16} color={C.primary} />
            <Text style={styles.sessionSurah}>{session.surah}</Text>
            <Text style={styles.sessionAyahs}>{session.ayahStart}:{session.ayahEnd}</Text>
          </View>
          <View style={styles.sessionMeta}>
            <Text style={styles.sessionDate}>{session.date}</Text>
            <Text style={styles.sessionJuz}>Juz {session.juz}</Text>
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
  header: { padding: 18, paddingTop: 60, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.goldPale },
  subtitle: { fontSize: 14, color: C.goldLight, fontFamily: 'Jost_400Regular', marginTop: 4 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', margin: 18, marginBottom: 10 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontFamily: 'Jost_700Bold', color: C.primary },
  statLabel: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  mushafCard: { backgroundColor: C.surfaceElevated, borderRadius: 18, margin: 18, marginBottom: 10, padding: 16 },
  mushafTitle: { fontSize: 14, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginBottom: 12 },
  mushafGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  juzBox: { width: `${100 / 10}%`, aspectRatio: 1, backgroundColor: C.bgCard, borderRadius: 6, justifyContent: 'center', alignItems: 'center', maxWidth: 32 },
  juzBoxActive: { backgroundColor: C.primary },
  juzBoxText: { fontSize: 10, fontFamily: 'Jost_600SemiBold', color: C.textMuted },
  juzBoxTextActive: { color: C.white },

  tabRow: { flexDirection: 'row', marginHorizontal: 18, marginBottom: 10, gap: 6 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 12, backgroundColor: C.bgSurface },
  tabActive: { backgroundColor: C.primary },
  tabLabel: { fontSize: 11, fontFamily: 'Jost_600SemiBold', color: C.textSecondary },
  tabLabelActive: { color: C.white },

  inputCard: { backgroundColor: C.surfaceElevated, borderRadius: 18, margin: 18, marginBottom: 10, padding: 16 },
  surahInput: { backgroundColor: C.bgBase, borderRadius: 10, padding: 12, fontSize: 14, color: C.textPrimary, marginBottom: 8 },
  suggestions: { backgroundColor: C.bgBase, borderRadius: 10, marginBottom: 8, maxHeight: 200 },
  suggestion: { padding: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  suggestionText: { fontSize: 14, color: C.textPrimary },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  smallInput: { backgroundColor: C.bgBase, borderRadius: 10, padding: 12, fontSize: 14, color: C.textPrimary },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },

  revisionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.goldPale, borderRadius: 16, margin: 18, marginBottom: 10, padding: 14 },
  revisionTitle: { fontSize: 14, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  revisionText: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  sessionCard: { backgroundColor: C.surfaceElevated, borderRadius: 14, marginHorizontal: 18, marginBottom: 8, padding: 14 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionSurah: { fontSize: 15, fontFamily: 'Jost_600SemiBold', color: C.textPrimary, flex: 1 },
  sessionAyahs: { fontSize: 13, color: C.primary, fontFamily: 'Jost_700Bold' },
  sessionMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sessionDate: { fontSize: 11, color: C.textMuted },
  sessionJuz: { fontSize: 11, color: C.textMuted },
});
