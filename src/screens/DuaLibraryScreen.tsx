import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, Dua, DUA_CATEGORIES, DuaCategory } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { SearchBar } from '../components/SearchBar';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { getFavoriteDuas, toggleFavoriteDua } from '../services/StorageService';

const DUAS: Dua[] = [
  { id: 'morning-1', title: 'Morning Remembrance', arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكُ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', meaning: 'We have reached the morning and kingship belongs to Allah. Praise is to Allah.', category: 'morning', source: 'Muslim', repeatCount: 1 },
  { id: 'morning-2', title: 'Protection in the Morning', arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ', meaning: 'In the name of Allah, with whose name nothing can cause harm on earth or in the heavens.', category: 'morning', source: 'Tirmidhi', repeatCount: 3 },
  { id: 'morning-3', title: 'Gratitude for Safety', arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ', meaning: 'O Allah, by You we reach the morning, by You we reach the evening.', category: 'morning', source: 'Tirmidhi', repeatCount: 1 },
  { id: 'evening-1', title: 'Evening Remembrance', arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ', meaning: 'We have reached the evening and kingship belongs to Allah.', category: 'evening', source: 'Muslim', repeatCount: 1 },
  { id: 'sleep-1', title: 'Before Sleep', arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', meaning: 'In Your name, O Allah, I die and I live.', category: 'sleep', source: 'Bukhari', repeatCount: 1 },
  { id: 'protection-1', title: 'Ayat al-Kursi', arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...', meaning: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.', category: 'protection', source: 'Quran 2:255', repeatCount: 1 },
  { id: 'forgiveness-1', title: 'Sayyid al-Istighfar', arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ...', meaning: 'O Allah, You are my Lord. There is no god but You.', category: 'forgiveness', source: 'Bukhari', repeatCount: 1 },
  { id: 'general-1', title: 'Dua for Parents', arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', meaning: 'My Lord, have mercy upon them as they brought me up when I was small.', category: 'general', source: 'Quran 17:24', repeatCount: 1 },
  { id: 'general-2', title: 'Dua for Knowledge', arabic: 'رَبِّ زِدْنِي عِلْمًا', meaning: 'My Lord, increase me in knowledge.', category: 'general', source: 'Quran 20:114', repeatCount: 1 },
];

// ─── Dua Counter ─────────────────────────────────────────────
function DuaCounter({ target, onComplete }: { target: number; onComplete?: () => void }) {
  const { c, type, radius } = useTheme();
  const [count, setCount] = useState(0);
  const progress = count / target;

  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ height: 4, backgroundColor: c.border, borderRadius: 2, marginBottom: 8 }}>
        <View style={{ height: 4, backgroundColor: c.emerald, borderRadius: 2, width: `${progress * 100}%` }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[type.label, { color: c.textSecondary, fontWeight: '600' }]}>{count}/{target}</Text>
        <TouchableOpacity
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: count >= target ? c.textMuted : c.emerald,
            justifyContent: 'center', alignItems: 'center',
          }}
          onPress={() => {
            if (count < target) {
              setCount(c => c + 1);
              if (count + 1 >= target) onComplete?.();
            }
          }}
          disabled={count >= target}
          accessibilityRole="button"
          accessibilityLabel={`Increment counter, ${count} of ${target}`}
        >
          <Ionicons name="add" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Dua Card ────────────────────────────────────────────────
function DuaCard({ dua, isFav, onToggleFav }: { dua: Dua; isFav: boolean; onToggleFav: () => void }) {
  const { c, type, radius } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, { toValue: expanded ? 1 : 0, duration: 250, useNativeDriver: false }).start();
  }, [expanded]);

  return (
    <View
      style={[styles.card, { backgroundColor: c.bgSurface, borderRadius: radius.md, padding: 16, marginBottom: 10 }]}
      accessibilityLabel={`${dua.title}, ${dua.source}${dua.repeatCount && dua.repeatCount > 1 ? `, repeat ${dua.repeatCount} times` : ''}`}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${dua.title}, tap to ${expanded ? 'collapse' : 'expand'}`}
        accessibilityState={{ expanded }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={[type.title, { color: c.textPrimary, fontSize: 15, fontWeight: '600' }]}>{dua.title}</Text>
            <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>
              {dua.source} {dua.repeatCount && dua.repeatCount > 1 ? `• ${dua.repeatCount}x` : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onToggleFav(); }}
              accessibilityRole="button"
              accessibilityLabel={isFav ? `Remove ${dua.title} from favorites` : `Add ${dua.title} to favorites`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? c.red : c.textMuted} />
            </TouchableOpacity>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={c.textMuted}
              style={{ marginLeft: 8 }}
            />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border }}>
          <Text style={[type.title, { color: c.emerald, textAlign: 'right', lineHeight: 30, marginBottom: 10, fontSize: 18 }]}>
            {dua.arabic}
          </Text>
          <Text style={[type.body, { color: c.textSecondary, lineHeight: 20, fontStyle: 'italic' }]}>
            {dua.meaning}
          </Text>
          {dua.repeatCount && dua.repeatCount > 1 && <DuaCounter target={dua.repeatCount} />}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function DuaLibraryScreen() {
  const { c, type, radius } = useTheme();
  const [activeCategory, setActiveCategory] = useState<DuaCategory | 'all' | 'favorites'>('all');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadFavorites(); }, []);

  const loadFavorites = async () => {
    const favs = await getFavoriteDuas();
    setFavorites(new Set(favs));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const toggleFav = async (duaId: string) => {
    const favs = await toggleFavoriteDua(duaId);
    setFavorites(new Set(favs));
  };

  const filteredDuas = DUAS.filter(dua => {
    const matchesCategory = activeCategory === 'all' ? true :
      activeCategory === 'favorites' ? favorites.has(dua.id) :
      dua.category === activeCategory;
    const matchesSearch = search === '' ||
      dua.title.toLowerCase().includes(search.toLowerCase()) ||
      dua.meaning.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const dayIndex = new Date().getDate() % DUAS.length;
  const featuredDua = DUAS[dayIndex];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bgBase }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} colors={[c.emerald]} />}
    >
      <View style={[styles.header, { backgroundColor: c.heroBg, paddingTop: 60, padding: 18 }]}>
        <Text style={[type.headline, { color: c.onHero, fontSize: 22, fontWeight: '700' }]}>Dua Library</Text>
        <Text style={[type.body, { color: c.onDarkMuted, marginTop: 4 }]}>{DUAS.length}+ authentic supplications</Text>
      </View>

      <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search duas..."
        />
      </View>

      {/* Featured Dua */}
      <View style={[styles.featuredCard, { backgroundColor: c.bgFeatured, borderRadius: radius.lg, padding: 18, marginHorizontal: 18, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: c.gold }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Ionicons name="star" size={14} color={c.gold} />
          <Text style={[type.label, { color: c.gold, fontWeight: '700' }]}>Dua of the Day</Text>
        </View>
        <Text style={[type.body, { color: c.textPrimary, textAlign: 'right', lineHeight: 26, marginBottom: 10, fontSize: 16 }]}>
          {featuredDua.arabic}
        </Text>
        <Text style={[type.caption, { color: c.textSecondary, lineHeight: 20, fontStyle: 'italic' }]}>
          {featuredDua.meaning}
        </Text>
        <Text style={[type.caption, { color: c.textMuted, marginTop: 8, textAlign: 'right' }]}>— {featuredDua.source}</Text>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8, gap: 8, flexDirection: 'row' }}>
        <Chip label="All" icon="apps-outline" selected={activeCategory === 'all'} onPress={() => setActiveCategory('all')} />
        <Chip label="Favorites" icon="heart-outline" selected={activeCategory === 'favorites'} onPress={() => setActiveCategory('favorites')} />
        {DUA_CATEGORIES.map(cat => (
          <Chip
            key={cat.value}
            label={cat.label}
            icon={cat.icon}
            selected={activeCategory === cat.value}
            onPress={() => setActiveCategory(cat.value)}
          />
        ))}
      </ScrollView>

      {/* Dua List */}
      <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginBottom: 10, marginTop: 4 }]}>
        {filteredDuas.length} {filteredDuas.length === 1 ? 'Dua' : 'Duas'}
      </Text>
      {filteredDuas.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title={activeCategory === 'favorites' ? 'No favorite duas yet' : 'No duas found'}
          message={activeCategory === 'favorites' ? 'Tap the heart icon on any dua to save it here' : 'Try a different category or search term'}
        />
      ) : (
        <View style={{ paddingHorizontal: 18 }}>
          {filteredDuas.map(dua => (
            <DuaCard
              key={dua.id}
              dua={dua}
              isFav={favorites.has(dua.id)}
              onToggleFav={() => toggleFav(dua.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {},
  featuredCard: {},
  card: {},
});
