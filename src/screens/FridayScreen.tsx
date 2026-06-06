import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KAHF_KEY = '@prayertime:kahf_last_read';
const KHUTBAH_KEY = '@prayertime:khutbah_notes';
const CHECKLIST_KEY = '@prayertime:friday_checklist';

const FRIDAY_CHECKLIST = [
  { id: 'ghusl', label: 'Perform Ghusl (ritual bath)', icon: 'water-outline' },
  { id: 'nails', label: 'Trim nails & clean up', icon: 'cut-outline' },
  { id: 'clothes', label: 'Wear best clothes', icon: 'shirt-outline' },
  { id: 'perfume', label: 'Apply perfume (men)', icon: 'flower-outline' },
  { id: 'kahf', label: 'Read Surah Al-Kahf', icon: 'book-outline' },
  { id: 'early', label: 'Go to mosque early', icon: 'time-outline' },
  { id: 'dua', label: 'Make lots of dua', icon: 'hand-left-outline' },
  { id: 'salat', label: 'Send blessings on the Prophet', icon: 'heart-outline' },
];

const KAHF_SECTIONS = [
  { ayah: '1-10', desc: 'The People of the Cave' },
  { ayah: '11-26', desc: 'The Story of the Cave' },
  { ayah: '27-31', desc: 'The parable of two men' },
  { ayah: '32-44', desc: 'The parable of the gardens' },
  { ayah: '45-59', desc: 'The similitude of life' },
  { ayah: '60-82', desc: 'Musa and Khidr' },
  { ayah: '83-98', desc: 'Dhul-Qarnayn' },
  { ayah: '99-110', desc: 'Warning and glad tidings' },
];

export default function FridayScreen() {
  const [kahfProgress, setKahfProgress] = useState(0);
  const [khutbahNotes, setKhutbahNotes] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<'kahf' | 'checklist' | 'dua'>('checklist');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [kahf, khutbah, checks] = await Promise.all([
      AsyncStorage.getItem(KAHF_KEY),
      AsyncStorage.getItem(KHUTBAH_KEY),
      AsyncStorage.getItem(CHECKLIST_KEY),
    ]);
    if (kahf) setKahfProgress(parseInt(kahf, 10));
    if (khutbah) setKhutbahNotes(khutbah);
    if (checks) setChecklist(JSON.parse(checks));
  };

  const toggleCheck = async (id: string) => {
    const next = { ...checklist, [id]: !checklist[id] };
    setChecklist(next);
    await AsyncStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
  };

  const updateKahfProgress = async (section: number) => {
    setKahfProgress(section);
    await AsyncStorage.setItem(KAHF_KEY, String(section));
  };

  const saveKhutbah = async (text: string) => {
    setKhutbahNotes(text);
    await AsyncStorage.setItem(KHUTBAH_KEY, text);
  };

  const isFriday = new Date().getDay() === 5;
  const completedChecks = Object.values(checklist).filter(Boolean).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Friday</Text>
        <Text style={styles.subtitle}>{isFriday ? 'Jumu\'ah Mubarakah!' : 'Prepare for Friday'}</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {([
          { id: 'checklist' as const, label: 'Checklist', icon: 'checkbox-outline' },
          { id: 'kahf' as const, label: 'Al-Kahf', icon: 'book-outline' },
          { id: 'dua' as const, label: 'Dua Times', icon: 'time-outline' },
        ]).map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeSection === tab.id && styles.tabActive]}
            onPress={() => setActiveSection(tab.id)}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeSection === tab.id ? '#FFF' : C.textSecondary} />
            <Text style={[styles.tabLabel, activeSection === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress Summary */}
      <View style={styles.progressCard}>
        <View style={styles.progressItem}>
          <Ionicons name="checkbox" size={20} color={C.coral} />
          <Text style={styles.progressValue}>{completedChecks}/{FRIDAY_CHECKLIST.length}</Text>
          <Text style={styles.progressLabel}>Checklist</Text>
        </View>
        <View style={styles.progressDivider} />
        <View style={styles.progressItem}>
          <Ionicons name="book" size={20} color={C.gold} />
          <Text style={styles.progressValue}>{kahfProgress}/{KAHF_SECTIONS.length}</Text>
          <Text style={styles.progressLabel}>Al-Kahf</Text>
        </View>
      </View>

      {/* Checklist Tab */}
      {activeSection === 'checklist' && (
        <>
          <Text style={styles.sectionTitle}>Friday Preparation</Text>
          {FRIDAY_CHECKLIST.map(item => {
            const done = checklist[item.id];
            return (
              <TouchableOpacity key={item.id} style={[styles.checkItem, done && styles.checkItemDone]} onPress={() => toggleCheck(item.id)}>
                <View style={[styles.checkBox, done && styles.checkBoxDone]}>
                  {done && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Ionicons name={item.icon as any} size={18} color={done ? C.coral : C.textSecondary} style={{ marginHorizontal: 12 }} />
                <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Khutbah Notes */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Khutbah Notes</Text>
          <View style={styles.notesCard}>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Jot down insights from today's khutbah..."
              placeholderTextColor={C.textMuted}
              value={khutbahNotes}
              onChangeText={saveKhutbah}
              textAlignVertical="top"
            />
          </View>
        </>
      )}

      {/* Al-Kahf Tab */}
      {activeSection === 'kahf' && (
        <>
          <Text style={styles.sectionTitle}>Surah Al-Kahf Reader</Text>
          <Text style={styles.kahfIntro}>
            "Whoever reads Surah Al-Kahf on Friday, a light will shine for him between the two Fridays."
          </Text>
          <Text style={styles.kahfSource}>— Prophet Muhammad ﷺ</Text>

          {KAHF_SECTIONS.map((section, index) => {
            const isRead = kahfProgress > index;
            const isCurrent = kahfProgress === index;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.kahfSection, isRead && styles.kahfSectionRead, isCurrent && styles.kahfSectionCurrent]}
                onPress={() => updateKahfProgress(index + 1)}
              >
                <View style={[styles.kahfNumWrap, isRead && styles.kahfNumWrapDone]}>
                  <Text style={[styles.kahfNum, isRead && styles.kahfNumDone]}>{index + 1}</Text>
                </View>
                <View style={styles.kahfInfo}>
                  <Text style={[styles.kahfAyah, isRead && styles.kahfTextDone]}>Ayahs {section.ayah}</Text>
                  <Text style={styles.kahfDesc}>{section.desc}</Text>
                </View>
                {isRead && <Ionicons name="checkmark-circle" size={22} color={C.coral} />}
                {isCurrent && <Ionicons name="play-circle" size={22} color={C.gold} />}
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Dua Times Tab */}
      {activeSection === 'dua' && (
        <>
          <Text style={styles.sectionTitle}>Best Times for Dua on Friday</Text>

          <View style={styles.duaCard}>
            <View style={styles.duaTimeHeader}>
              <Ionicons name="sunny" size={20} color={C.gold} />
              <Text style={styles.duaTimeTitle}>Last Hour Before Maghrib</Text>
            </View>
            <Text style={styles.duaTimeDesc}>
              This is the most virtuous time for dua on Friday. The Prophet ﷺ said: "There is no day more virtuous than Friday. In it is an hour when no Muslim servant asks Allah for something good except that He gives it to him."
            </Text>
            <View style={styles.duaTimeBadge}>
              <Ionicons name="time" size={14} color={C.gold} />
              <Text style={styles.duaTimeBadgeText}>Between Asr and Maghrib</Text>
            </View>
          </View>

          <View style={styles.duaCard}>
            <View style={styles.duaTimeHeader}>
              <Ionicons name="arrow-up" size={20} color={C.coral} />
              <Text style={styles.duaTimeTitle}>While the Imam is on the Minbar</Text>
            </View>
            <Text style={styles.duaTimeDesc}>
              The Prophet ﷺ said: "The hour of answered dua on Friday is from when the Imam sits on the minbar until the prayer is concluded."
            </Text>
          </View>

          <View style={styles.duaCard}>
            <View style={styles.duaTimeHeader}>
              <Ionicons name="moon" size={20} color={C.warmBlue} />
              <Text style={styles.duaTimeTitle}>After Fajr until Sunrise</Text>
            </View>
            <Text style={styles.duaTimeDesc}>
              Blessings descend upon those who are in the mosque from the time of Fajr on Friday.
            </Text>
          </View>

          <View style={styles.duaCard}>
            <View style={styles.duaTimeHeader}>
              <Ionicons name="heart" size={20} color={C.coral} />
              <Text style={styles.duaTimeTitle}>Recommended Duas</Text>
            </View>
            {[
              'Recite Surah Al-Kahf (verses 1-10)',
              'Send abundant salawat upon the Prophet ﷺ',
              'Ask for forgiveness (istighfar) repeatedly',
              'Ask Allah for good in this life and the Hereafter',
              'Pray for your parents, family, and the Ummah',
            ].map((dua, i) => (
              <View key={i} style={styles.recommendedDua}>
                <Ionicons name="ellipse" size={6} color={C.coral} style={{ marginTop: 6 }} />
                <Text style={styles.recommendedDuaText}>{dua}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingBottom: 120 },
  header: { padding: 18, paddingTop: 60, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.textPrimary },
  subtitle: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 4 },

  tabBar: { flexDirection: 'row', backgroundColor: C.bgSurface, borderRadius: 16, margin: 18, marginBottom: 12, padding: 4},
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabActive: { backgroundColor: C.coral },
  tabLabel: { fontSize: 11, color: C.textSecondary, fontFamily: 'Jost_500Medium' },
  tabLabelActive: { color: '#FFF', fontFamily: 'Jost_700Bold' },

  progressCard: { flexDirection: 'row', backgroundColor: C.bgSurface, borderRadius: 18, marginHorizontal: 18, padding: 16, marginBottom: 16},
  progressItem: { flex: 1, alignItems: 'center' },
  progressDivider: { width: 1, backgroundColor: C.border },
  progressValue: { fontSize: 20, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginTop: 6 },
  progressLabel: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  sectionTitle: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginHorizontal: 18, marginTop: 8, marginBottom: 10 },

  checkItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSurface, borderRadius: 14, padding: 14, marginHorizontal: 18, marginBottom: 8 },
  checkItemDone: { backgroundColor: C.primaryLight },
  checkBox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.borderStrong, justifyContent: 'center', alignItems: 'center' },
  checkBoxDone: { backgroundColor: C.coral, borderColor: C.coral },
  checkLabel: { flex: 1, fontSize: 14, fontFamily: 'Jost_500Medium', color: C.textPrimary },
  checkLabelDone: { color: C.coral, textDecorationLine: 'line-through' },

  notesCard: { backgroundColor: C.bgSurface, borderRadius: 18, marginHorizontal: 18, padding: 16, minHeight: 120 },
  notesInput: { flex: 1, fontSize: 14, color: C.textPrimary, lineHeight: 22, minHeight: 100 },

  kahfIntro: { fontSize: 14, color: C.textSecondary, fontStyle: 'italic', lineHeight: 22, marginHorizontal: 18, marginBottom: 4 },
  kahfSource: { fontSize: 12, color: C.textMuted, marginHorizontal: 18, marginBottom: 16 },
  kahfSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSurface, borderRadius: 14, padding: 14, marginHorizontal: 18, marginBottom: 8 },
  kahfSectionRead: { backgroundColor: C.primaryLight, opacity: 0.8 },
  kahfSectionCurrent: { borderWidth: 1.5, borderColor: C.gold },
  kahfNumWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F5F0', justifyContent: 'center', alignItems: 'center' },
  kahfNumWrapDone: { backgroundColor: C.coral },
  kahfNum: { fontSize: 13, fontFamily: 'Jost_700Bold', color: C.textSecondary },
  kahfNumDone: { color: '#FFF' },
  kahfInfo: { flex: 1, marginLeft: 12 },
  kahfAyah: { fontSize: 14, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  kahfTextDone: { color: C.coral, textDecorationLine: 'line-through' },
  kahfDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  duaCard: { backgroundColor: C.bgSurface, borderRadius: 18, padding: 18, marginHorizontal: 18, marginBottom: 12},
  duaTimeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  duaTimeTitle: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  duaTimeDesc: { fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  duaTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.goldPale, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginTop: 12 },
  duaTimeBadgeText: { fontSize: 12, color: C.gold, fontFamily: 'Jost_600SemiBold' },
  recommendedDua: { flexDirection: 'row', gap: 10, marginTop: 8 },
  recommendedDuaText: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 20 }});
