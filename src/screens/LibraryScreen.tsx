// Library: search first, one suggestion in the colour of the current sky, then twelve items in three groups.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { usePrayerApp } from '../context/PrayerAppContext';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { PrayerId } from '../types';
import { Glyph, GlyphName } from '../design/Glyph';
import { F, useSky } from '../design/palette';
import { computeDayState, minutesOf } from '../design/dayState';
import { getSpecialMoment } from '../design/moment';
import { PageTitle, SectionLabel } from '../design/ui';
import { getLessonForDate } from '../data/knowledge';
import type { RootStackParamList, SubPage } from '../navigation/routes';

type Item = { id: SubPage; title: string; icon: GlyphName; keywords: string };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Daily practice',
    items: [
      { id: 'duas', title: 'Duas', icon: 'hands', keywords: 'supplication dua prayer morning evening travel' },
      { id: 'hadith', title: 'Hadith', icon: 'scroll', keywords: 'hadith prophet sayings bukhari muslim' },
      { id: 'sunnah', title: 'Morning and evening adhkar', icon: 'sun', keywords: 'adhkar dhikr sunnah routine morning evening night' },
      { id: 'weekly', title: 'Weekly Sunnah', icon: 'calendar', keywords: 'weekly monday thursday fast sunnah' },
    ],
  },
  {
    title: 'Seasons',
    items: [
      { id: 'friday', title: "Jumu'ah", icon: 'star', keywords: 'friday jumuah kahf khutbah' },
      { id: 'ramadan', title: 'Ramadan', icon: 'moon', keywords: 'ramadan fasting taraweeh laylat qadr suhoor iftar' },
      { id: 'hajj', title: 'Hajj and Umrah', icon: 'kaaba', keywords: 'hajj umrah pilgrimage makkah ihram' },
      { id: 'calendar', title: 'Islamic dates', icon: 'calendar', keywords: 'calendar hijri events eid ashura dates' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { id: 'hifdh', title: 'Hifdh', icon: 'brain', keywords: 'hifdh memorise quran revision surah' },
      { id: 'zakat', title: 'Zakat', icon: 'wallet', keywords: 'zakat charity nisab gold silver sadaqah' },
      { id: 'journal', title: 'Journal', icon: 'pen', keywords: 'journal reflection gratitude notes' },
      { id: 'tazkiyah', title: 'Tazkiyah', icon: 'leaf', keywords: 'tazkiyah character heart self reflection' },
    ],
  },
];

export default function LibraryScreen() {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { prayerTimes, prayerStatuses } = usePrayerApp();
  const [query, setQuery] = useState('');

  const skyState = useMemo(() => {
    if (prayerTimes.length < 6) return 'day' as const;
    const m: Record<string, number> = {};
    prayerTimes.forEach(p => { m[p.id] = p.minutes; });
    return computeDayState(m as Record<PrayerId, number>, minutesOf(new Date()), prayerStatuses).sky;
  }, [prayerTimes, prayerStatuses]);
  const sky = useSky(skyState);

  const special = useMemo(() => getSpecialMoment(), []);
  const lesson = useMemo(() => getLessonForDate(), []);
  const suggestion = special
    ? { kicker: special.kicker, title: special.title, onPress: () => special.route && navigation.navigate(special.route) }
    : { kicker: 'Today I learned', title: lesson.title, onPress: () => navigation.navigate('hadith') };

  const q = query.trim().toLowerCase();
  const groups = q
    ? GROUPS.map(g => ({ ...g, items: g.items.filter(i => `${i.title} ${i.keywords}`.toLowerCase().includes(q)) })).filter(g => g.items.length)
    : GROUPS;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <PageTitle title="Library" />

        <View style={styles.search}>
          <Glyph name="search" size={18} color={C.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search duas, hadith and guides"
            placeholderTextColor={C.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search the library"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
              <Glyph name="close" size={16} color={C.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {!q && (
          <Pressable onPress={suggestion.onPress} accessibilityRole="button" accessibilityLabel={`${suggestion.kicker}: ${suggestion.title}`}>
            <LinearGradient colors={[sky.top, sky.bottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nowcard}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nowK, { color: sky.fg2 }]}>{suggestion.kicker}</Text>
                <Text style={[styles.nowTitle, { color: sky.fg }]} numberOfLines={2}>{suggestion.title}</Text>
              </View>
              <View style={[styles.go, { backgroundColor: sky.wash }]}>
                <Glyph name="arrow" size={18} color={sky.fg} />
              </View>
            </LinearGradient>
          </Pressable>
        )}

        {groups.map(g => (
          <View key={g.title} style={{ gap: 8 }}>
            <SectionLabel>{g.title}</SectionLabel>
            <View style={styles.grid}>
              {g.items.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => navigation.navigate(item.id)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.tile, pressed && { backgroundColor: C.surfacePressed }]}
                >
                  <Glyph name={item.icon} size={20} color={C.primaryDark} />
                  <Text style={styles.tileText} numberOfLines={2}>{item.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {q && groups.length === 0 && (
          <Text style={styles.empty}>Nothing matches "{query}". Try a word like dua, fast or Kahf.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 16 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bgSurface, borderRadius: 14, minHeight: 48, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.textPrimary, paddingVertical: 10 },
  nowcard: { borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nowK: { fontFamily: F.medium, fontSize: 12.5 },
  nowTitle: { fontFamily: F.semibold, fontSize: 16, marginTop: 1 },
  go: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48.8%', flexGrow: 1, flexBasis: '45%', minHeight: 54, backgroundColor: C.bgSurface, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tileText: { flex: 1, fontFamily: F.medium, fontSize: 14.5, lineHeight: 18, color: C.textPrimary },
  empty: { fontFamily: F.body, fontSize: 14, color: C.textMuted, textAlign: 'center', marginTop: 12 },
});
