import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, Animated, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useSnackbar } from '../components/Snackbar';
import { Chip } from '../components/Chip';

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
  const { c, type, radius } = useTheme();
  const { show } = useSnackbar();
  const [kahfProgress, setKahfProgress] = useState(0);
  const [khutbahNotes, setKhutbahNotes] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<'kahf' | 'checklist' | 'dua'>('checklist');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [kahf, khutbah, checks] = await Promise.all([
      AsyncStorage.getItem(KAHF_KEY),
      AsyncStorage.getItem(KHUTBAH_KEY),
      AsyncStorage.getItem(CHECKLIST_KEY),
    ]);
    if (kahf) setKahfProgress(parseInt(kahf, 10));
    if (khutbah) setKhutbahNotes(khutbah);
    if (checks) setChecklist(JSON.parse(checks));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleCheck = async (id: string) => {
    const next = { ...checklist, [id]: !checklist[id] };
    setChecklist(next);
    await AsyncStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
  };

  const updateKahfProgress = async (section: number) => {
    setKahfProgress(section);
    await AsyncStorage.setItem(KAHF_KEY, String(section));
    show({ message: `Marked section ${section} of ${KAHF_SECTIONS.length}`, variant: 'success', icon: 'book' });
  };

  const saveKhutbah = async (text: string) => {
    setKhutbahNotes(text);
    await AsyncStorage.setItem(KHUTBAH_KEY, text);
  };

  const isFriday = new Date().getDay() === 5;
  const completedChecks = Object.values(checklist).filter(Boolean).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bgBase }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} colors={[c.emerald]} />}
    >
      <View style={[styles.header, { backgroundColor: c.heroBg, paddingTop: 60 }]}>
        <Text style={[type.headline, { color: c.onHero, fontSize: 22, fontWeight: '700' }]}>Friday</Text>
        <Text style={[type.body, { color: c.onDarkMuted, marginTop: 4 }]}>
          {isFriday ? "Jumu'ah Mubarakah!" : 'Prepare for Friday'}
        </Text>
      </View>

      {/* Tab Bar */}
      <View
        style={[styles.tabBar, { backgroundColor: c.bgSurface, borderRadius: radius.lg, margin: 18, marginBottom: 12, padding: 4 }]}
        accessibilityRole="tablist"
      >
        {([
          { id: 'checklist' as const, label: 'Checklist', icon: 'checkbox-outline' },
          { id: 'kahf' as const, label: 'Al-Kahf', icon: 'book-outline' },
          { id: 'dua' as const, label: 'Dua Times', icon: 'time-outline' },
        ]).map(tab => {
          const isActive = activeSection === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && { backgroundColor: c.emerald, borderRadius: 12 }]}
              onPress={() => setActiveSection(tab.id)}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons name={tab.icon as any} size={16} color={isActive ? '#FFF' : c.textSecondary} />
              <Text style={[type.label, { color: isActive ? '#FFF' : c.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress Summary */}
      <View style={[styles.progressCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, padding: 16, marginBottom: 16 }]}>
        <View style={styles.progressItem}>
          <Ionicons name="checkbox" size={20} color={c.emerald} />
          <Text style={[type.title, { color: c.textPrimary, marginTop: 6, fontWeight: '700' }]}>{completedChecks}/{FRIDAY_CHECKLIST.length}</Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>Checklist</Text>
        </View>
        <View style={[styles.progressDivider, { backgroundColor: c.border }]} />
        <View style={styles.progressItem}>
          <Ionicons name="book" size={20} color={c.gold} />
          <Text style={[type.title, { color: c.textPrimary, marginTop: 6, fontWeight: '700' }]}>{kahfProgress}/{KAHF_SECTIONS.length}</Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>Al-Kahf</Text>
        </View>
      </View>

      {/* Checklist Tab */}
      {activeSection === 'checklist' && (
        <>
          <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 8, marginBottom: 10 }]}>
            Friday Preparation
          </Text>
          {FRIDAY_CHECKLIST.map(item => {
            const done = checklist[item.id];
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.checkItem,
                  {
                    backgroundColor: done ? c.emeraldPale : c.bgSurface,
                    borderRadius: radius.md,
                    marginHorizontal: 18,
                    marginBottom: 8,
                  },
                ]}
                onPress={() => toggleCheck(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !!done }}
                accessibilityLabel={`${item.label}${done ? ', completed' : ''}`}
              >
                <View
                  style={[
                    styles.checkBox,
                    {
                      borderColor: done ? c.emerald : c.borderStrong,
                      backgroundColor: done ? c.emerald : 'transparent',
                    },
                  ]}
                >
                  {done && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Ionicons name={item.icon as any} size={18} color={done ? c.emerald : c.textSecondary} style={{ marginHorizontal: 12 }} />
                <Text
                  style={[
                    type.body,
                    {
                      flex: 1,
                      color: done ? c.emerald : c.textPrimary,
                      fontWeight: '500',
                      textDecorationLine: done ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Text style={[type.title, { color: c.textPrimary, marginTop: 24, marginBottom: 10, marginHorizontal: 18 }]}>
            Khutbah Notes
          </Text>
          <View style={[styles.notesCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, padding: 16, minHeight: 120 }]}>
            <TextInput
              style={[styles.notesInput, { color: c.textPrimary }]}
              multiline
              placeholder="Jot down insights from today's khutbah..."
              placeholderTextColor={c.textMuted}
              value={khutbahNotes}
              onChangeText={saveKhutbah}
              textAlignVertical="top"
              accessibilityLabel="Khutbah notes"
            />
          </View>
        </>
      )}

      {/* Al-Kahf Tab */}
      {activeSection === 'kahf' && (
        <>
          <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 8, marginBottom: 10 }]}>
            Surah Al-Kahf Reader
          </Text>
          <Text style={[type.body, { color: c.textSecondary, fontStyle: 'italic', lineHeight: 22, marginHorizontal: 18, marginBottom: 4 }]}>
            "Whoever reads Surah Al-Kahf on Friday, a light will shine for him between the two Fridays."
          </Text>
          <Text style={[type.caption, { color: c.textMuted, marginHorizontal: 18, marginBottom: 16 }]}>
            — Prophet Muhammad ﷺ
          </Text>

          {KAHF_SECTIONS.map((section, index) => {
            const isRead = kahfProgress > index;
            const isCurrent = kahfProgress === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.kahfSection,
                  {
                    backgroundColor: isRead ? c.emeraldPale : c.bgSurface,
                    borderRadius: radius.md,
                    borderWidth: isCurrent ? 1.5 : 0,
                    borderColor: isCurrent ? c.gold : 'transparent',
                    opacity: isRead ? 0.8 : 1,
                    marginHorizontal: 18,
                    marginBottom: 8,
                  },
                ]}
                onPress={() => updateKahfProgress(index + 1)}
                accessibilityRole="button"
                accessibilityLabel={`Section ${index + 1}, Ayahs ${section.ayah}, ${section.desc}${isRead ? ', read' : isCurrent ? ', current' : ''}`}
              >
                <View
                  style={[
                    styles.kahfNumWrap,
                    {
                      backgroundColor: isRead ? c.emerald : c.bgMuted,
                      borderRadius: 10,
                    },
                  ]}
                >
                  <Text style={[type.label, { color: isRead ? '#FFF' : c.textSecondary, fontWeight: '700' }]}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[
                    type.body,
                    {
                      color: isRead ? c.emerald : c.textPrimary,
                      fontWeight: '600',
                      textDecorationLine: isRead ? 'line-through' : 'none',
                    },
                  ]}>
                    Ayahs {section.ayah}
                  </Text>
                  <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{section.desc}</Text>
                </View>
                {isRead && <Ionicons name="checkmark-circle" size={22} color={c.emerald} />}
                {isCurrent && <Ionicons name="play-circle" size={22} color={c.gold} />}
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Dua Times Tab */}
      {activeSection === 'dua' && (
        <>
          <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 8, marginBottom: 10 }]}>
            Best Times for Dua on Friday
          </Text>

          <View style={[styles.duaCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, padding: 18, marginHorizontal: 18, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Ionicons name="sunny" size={20} color={c.gold} />
              <Text style={[type.body, { color: c.textPrimary, fontWeight: '700' }]}>Last Hour Before Maghrib</Text>
            </View>
            <Text style={[type.body, { color: c.textSecondary, lineHeight: 20 }]}>
              This is the most virtuous time for dua on Friday. The Prophet ﷺ said: "There is no day more virtuous than Friday. In it is an hour when no Muslim servant asks Allah for something good except that He gives it to him."
            </Text>
            <View style={[styles.duaTimeBadge, { backgroundColor: c.goldPale }]}>
              <Ionicons name="time" size={14} color={c.gold} />
              <Text style={[type.label, { color: c.gold, fontWeight: '600' }]}>Between Asr and Maghrib</Text>
            </View>
          </View>

          <View style={[styles.duaCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, padding: 18, marginHorizontal: 18, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Ionicons name="arrow-up" size={20} color={c.emerald} />
              <Text style={[type.body, { color: c.textPrimary, fontWeight: '700' }]}>While the Imam is on the Minbar</Text>
            </View>
            <Text style={[type.body, { color: c.textSecondary, lineHeight: 20 }]}>
              The Prophet ﷺ said: "The hour of answered dua on Friday is from when the Imam sits on the minbar until the prayer is concluded."
            </Text>
          </View>

          <View style={[styles.duaCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, padding: 18, marginHorizontal: 18, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Ionicons name="moon" size={20} color={c.navySoft} />
              <Text style={[type.body, { color: c.textPrimary, fontWeight: '700' }]}>After Fajr until Sunrise</Text>
            </View>
            <Text style={[type.body, { color: c.textSecondary, lineHeight: 20 }]}>
              Blessings descend upon those who are in the mosque from the time of Fajr on Friday.
            </Text>
          </View>

          <View style={[styles.duaCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, padding: 18, marginHorizontal: 18, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Ionicons name="heart" size={20} color={c.red} />
              <Text style={[type.body, { color: c.textPrimary, fontWeight: '700' }]}>Recommended Duas</Text>
            </View>
            {[
              'Recite Surah Al-Kahf (verses 1-10)',
              'Send abundant salawat upon the Prophet ﷺ',
              'Ask for forgiveness (istighfar) repeatedly',
              'Ask Allah for good in this life and the Hereafter',
              'Pray for your parents, family, and the Ummah',
            ].map((dua, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <Ionicons name="ellipse" size={6} color={c.emerald} style={{ marginTop: 6 }} />
                <Text style={[type.body, { flex: 1, color: c.textSecondary, lineHeight: 20 }]}>{dua}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 18 },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  progressCard: { flexDirection: 'row' },
  progressItem: { flex: 1, alignItems: 'center' },
  progressDivider: { width: 1 },
  sectionTitle: {},
  checkItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  checkBox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  notesCard: {},
  notesInput: { flex: 1, fontSize: 14, lineHeight: 22, minHeight: 100 },
  kahfSection: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  kahfNumWrap: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  duaCard: {},
  duaTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginTop: 12 },
});
