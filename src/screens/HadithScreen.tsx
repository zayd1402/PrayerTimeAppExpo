import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Share, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, Hadith } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { HADITHS, getDailyHadith, getHadithCategories, getHadithByCategory } from '../data/hadiths';
import { getFavoriteHadiths, toggleFavoriteHadith, setLastHadithIndex, getLastHadithIndex } from '../services/StorageService';
import { Chip } from '../components/Chip';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';

function HadithCard({ hadith, isFav, onToggleFav }: { hadith: Hadith; isFav: boolean; onToggleFav: () => void }) {
  const { c, type, radius } = useTheme();
  const handleShare = async () => {
    await Share.share({
      message: `"${hadith.english}"\n— ${hadith.source}\n\n${hadith.arabic}`,
    });
  };

  const gradeColor = hadith.grade === 'sahih' ? c.emerald : hadith.grade === 'hasan' ? c.gold : c.textMuted;

  return (
    <View
      style={[styles.card, { backgroundColor: c.bgSurface, borderRadius: radius.lg, padding: 18, marginBottom: 12 }]}
      accessibilityLabel={`${hadith.grade.toUpperCase()} hadith from ${hadith.source}, narrated by ${hadith.narrator}`}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.gradeBadge, { backgroundColor: gradeColor + '18' }]}>
          <Text style={[type.caption, { color: gradeColor, fontWeight: '700' }]}>{hadith.grade.toUpperCase()}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={onToggleFav}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? c.red : c.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Share hadith"
          >
            <Ionicons name="share-outline" size={20} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[type.title, { color: c.emerald, fontSize: 18, lineHeight: 30, textAlign: 'right', marginBottom: 12 }]}>
        {hadith.arabic}
      </Text>
      <Text style={[type.body, { color: c.textPrimary, lineHeight: 22 }]}>
        {hadith.english}
      </Text>

      <View style={[styles.meta, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border }]}>
        <Ionicons name="person-outline" size={12} color={c.textMuted} />
        <Text style={[type.caption, { color: c.textMuted, marginLeft: 4 }]}>{hadith.narrator}</Text>
        <Text style={[type.caption, { color: c.textMuted, marginHorizontal: 6 }]}>•</Text>
        <Text style={[type.caption, { color: c.textMuted }]}>{hadith.source}</Text>
        {hadith.book && (
          <>
            <Text style={[type.caption, { color: c.textMuted, marginHorizontal: 6 }]}>•</Text>
            <Text style={[type.caption, { color: c.textMuted }]}>{hadith.book}</Text>
          </>
        )}
      </View>
    </View>
  );
}

export default function HadithScreen() {
  const { c, type } = useTheme();
  const [dailyHadith, setDailyHadith] = useState<Hadith | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    const favs = await getFavoriteHadiths();
    setFavorites(new Set(favs));
  }, []);

  useEffect(() => {
    const dh = getDailyHadith();
    setDailyHadith(dh);
    loadFavorites();
  }, [loadFavorites]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const toggleFav = async (id: string) => {
    const favs = await toggleFavoriteHadith(id);
    setFavorites(new Set(favs));
  };

  const categories = getHadithCategories();
  const displayedHadiths = (activeCategory ? getHadithByCategory(activeCategory) : HADITHS)
    .filter(h => search === '' ||
      h.english.toLowerCase().includes(search.toLowerCase()) ||
      h.narrator.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bgBase }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} colors={[c.emerald]} />}
    >
      <View style={{ padding: 18, paddingTop: 60, backgroundColor: c.heroBg }}>
        <Text style={[type.headline, { color: c.onHero, fontSize: 22, fontWeight: '700' }]}>Hadith Collection</Text>
        <Text style={[type.body, { color: c.onDarkMuted, marginTop: 4 }]}>{HADITHS.length} authentic hadiths</Text>
      </View>

      {dailyHadith && (
        <View style={{ padding: 18, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Ionicons name="sunny" size={16} color={c.gold} />
            <Text style={[type.label, { color: c.gold, fontWeight: '700' }]}>Hadith of the Day</Text>
          </View>
          <HadithCard hadith={dailyHadith} isFav={favorites.has(dailyHadith.id)} onToggleFav={() => toggleFav(dailyHadith.id)} />
        </View>
      )}

      <View style={{ paddingHorizontal: 18, marginBottom: 12 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search hadiths..." />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8, gap: 8, flexDirection: 'row' }}>
        <Chip label="All" selected={!activeCategory} onPress={() => setActiveCategory(null)} />
        {categories.map(cat => (
          <Chip
            key={cat}
            label={cat.charAt(0).toUpperCase() + cat.slice(1)}
            selected={activeCategory === cat}
            onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
          />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 18, marginTop: 8 }}>
        {displayedHadiths.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No hadiths found"
            message="Try a different search term or category"
          />
        ) : (
          displayedHadiths.map(hadith => (
            <HadithCard
              key={hadith.id}
              hadith={hadith}
              isFav={favorites.has(hadith.id)}
              onToggleFav={() => toggleFav(hadith.id)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {},
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  cardActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
});
