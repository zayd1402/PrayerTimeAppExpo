import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, Hadith } from '../types';
import { HADITHS, getDailyHadith, getHadithCategories, getHadithByCategory } from '../data/hadiths';
import { getFavoriteHadiths, toggleFavoriteHadith, setLastHadithIndex, getLastHadithIndex } from '../services/StorageService';

function HadithCard({ hadith, isFav, onToggleFav }: { hadith: Hadith; isFav: boolean; onToggleFav: () => void }) {
  const handleShare = async () => {
    await Share.share({
      message: `"${hadith.english}"\n— ${hadith.source}\n\n${hadith.arabic}`});
  };

  const gradeColor = hadith.grade === 'sahih' ? C.primary : hadith.grade === 'hasan' ? C.gold : C.textMuted;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.gradeBadge, { backgroundColor: gradeColor + '15' }]}>
          <Text style={[styles.gradeText, { color: gradeColor }]}>{hadith.grade.toUpperCase()}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={onToggleFav} style={styles.actionBtn}>
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? C.red : C.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
            <Ionicons name="share-outline" size={20} color={C.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.arabic}>{hadith.arabic}</Text>
      <Text style={styles.english}>{hadith.english}</Text>

      <View style={styles.meta}>
        <Ionicons name="person-outline" size={12} color={C.textMuted} />
        <Text style={styles.metaText}>{hadith.narrator}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>{hadith.source}</Text>
        {hadith.book && (
          <>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{hadith.book}</Text>
          </>
        )}
      </View>
    </View>
  );
}

export default function HadithScreen() {
  const [dailyHadith, setDailyHadith] = useState<Hadith | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const dh = getDailyHadith();
    setDailyHadith(dh);
    loadFavorites();
    loadLastIndex();
  }, []);

  const loadFavorites = async () => {
    const favs = await getFavoriteHadiths();
    setFavorites(new Set(favs));
  };

  const loadLastIndex = async () => {
    const idx = await getLastHadithIndex();
    setCurrentIndex(idx);
  };

  const toggleFav = async (id: string) => {
    const favs = await toggleFavoriteHadith(id);
    setFavorites(new Set(favs));
  };

  const categories = getHadithCategories();
  const displayedHadiths = activeCategory
    ? getHadithByCategory(activeCategory)
    : HADITHS;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Hadith Collection</Text>
        <Text style={styles.subtitle}>{HADITHS.length} authentic hadiths</Text>
      </View>

      {/* Daily Hadith */}
      {dailyHadith && (
        <View style={styles.dailySection}>
          <View style={styles.dailyHeader}>
            <Ionicons name="sunny" size={16} color={C.gold} />
            <Text style={styles.dailyTitle}>Hadith of the Day</Text>
          </View>
          <HadithCard hadith={dailyHadith} isFav={favorites.has(dailyHadith.id)} onToggleFav={() => toggleFav(dailyHadith.id)} />
        </View>
      )}

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        <TouchableOpacity
          style={[styles.catChip, !activeCategory && styles.catChipActive]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[styles.catLabel, !activeCategory && styles.catLabelActive]}>All</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
            onPress={() => setActiveCategory(cat === activeCategory ? null : cat)}
          >
            <Text style={[styles.catLabel, activeCategory === cat && styles.catLabelActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Hadith List */}
      <Text style={styles.listTitle}>{displayedHadiths.length} Hadiths</Text>
      {displayedHadiths.map(hadith => (
        <HadithCard
          key={hadith.id}
          hadith={hadith}
          isFav={favorites.has(hadith.id)}
          onToggleFav={() => toggleFav(hadith.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingBottom: 120 },
  header: { padding: 18, paddingTop: 60, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.textPrimary },
  subtitle: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 4 },

  dailySection: { margin: 18, marginBottom: 8 },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dailyTitle: { fontSize: 14, fontFamily: 'Jost_700Bold', color: C.gold },

  categories: { paddingHorizontal: 18, paddingBottom: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bgSurface, marginRight: 8},
  catChipActive: { backgroundColor: C.primary },
  catLabel: { fontSize: 12, color: C.textSecondary, fontFamily: 'Jost_500Medium' },
  catLabelActive: { color: '#FFF', fontFamily: 'Jost_600SemiBold' },

  listTitle: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginHorizontal: 18, marginBottom: 10, marginTop: 4 },

  card: { backgroundColor: C.bgSurface, borderRadius: 18, padding: 18, marginHorizontal: 18, marginBottom: 12},
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  gradeText: { fontSize: 10, fontFamily: 'Jost_700Bold' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  arabic: { fontSize: 16, color: C.primary, textAlign: 'right', lineHeight: 26, marginBottom: 10 },
  english: { fontSize: 14, color: C.textPrimary, lineHeight: 22, fontStyle: 'italic' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 4 },
  metaText: { fontSize: 11, color: C.textMuted },
  metaDot: { fontSize: 11, color: C.textMuted, marginHorizontal: 2 }});
