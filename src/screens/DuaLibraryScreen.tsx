import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolate
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { iconName } from '../components/Icon';
import { logger } from '../utils/logger';
import { C, Dua, DUA_CATEGORIES, DuaCategory } from '../types';
type CategoryFilter = DuaCategory | 'all' | 'favorites';
import { getFavoriteDuas, toggleFavoriteDua } from '../services/StorageService';

// ─── Dua Database ────────────────────────────────────────────
const DUAS: Dua[] = [
  // Morning
  { id: 'morning-1', title: 'Morning Remembrance', arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', meaning: 'We have reached the morning and kingship belongs to Allah. Praise is to Allah. There is no god but Allah alone, with no partner. To Him belongs dominion and praise, and He is over all things competent.', category: 'morning', source: 'Muslim', repeatCount: 1 },
  { id: 'morning-2', title: 'Protection in the Morning', arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ', meaning: 'In the name of Allah, with whose name nothing can cause harm on earth or in the heavens, and He is the All-Hearing, All-Knowing.', category: 'morning', source: 'Tirmidhi', repeatCount: 3 },
  { id: 'morning-3', title: 'Gratitude for Safety', arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ', meaning: 'O Allah, by You we reach the morning, by You we reach the evening, by You we live, by You we die, and to You is the resurrection.', category: 'morning', source: 'Tirmidhi', repeatCount: 1 },

  // Evening
  { id: 'evening-1', title: 'Evening Remembrance', arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', meaning: 'We have reached the evening and kingship belongs to Allah. Praise is to Allah. There is no god but Allah alone, with no partner. To Him belongs dominion and praise, and He is over all things competent.', category: 'evening', source: 'Muslim', repeatCount: 1 },
  { id: 'evening-2', title: 'Seeking Forgiveness', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', meaning: 'O Allah, I ask You for forgiveness and well-being in this world and the Hereafter.', category: 'evening', source: 'Ibn Majah', repeatCount: 1 },

  // Sleep
  { id: 'sleep-1', title: 'Before Sleep', arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', meaning: 'In Your name, O Allah, I die and I live.', category: 'sleep', source: 'Bukhari', repeatCount: 1 },
  { id: 'sleep-2', title: 'Seeking Protection', arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ غَضَبِهِ وَعِقَابِهِ، وَشَرِّ عِبَادِهِ، وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ', meaning: 'I seek refuge in the perfect words of Allah from His anger and punishment, from the evil of His servants, from the whispers of devils, and from their presence.', category: 'sleep', source: 'Tirmidhi', repeatCount: 3 },
  { id: 'sleep-3', title: 'Gratitude for the Day', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا، وَكَفَانَا، وَآوَانَا، فَكَمْ مِمَّنْ لَا كَافِيَ لَهُ وَلَا مُؤْوِيَ', meaning: 'Praise is to Allah who fed us, gave us drink, sufficed us, and sheltered us. How many are there with no one to suffice them or shelter them.', category: 'sleep', source: 'Muslim', repeatCount: 1 },

  // Waking
  { id: 'waking-1', title: 'Upon Waking', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', meaning: 'Praise is to Allah who gives us life after He has caused us to die, and to Him is the resurrection.', category: 'waking', source: 'Bukhari', repeatCount: 1 },

  // Mosque
  { id: 'mosque-1', title: 'Entering Mosque', arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', meaning: 'O Allah, open for me the doors of Your mercy.', category: 'mosque', source: 'Muslim', repeatCount: 1 },
  { id: 'mosque-2', title: 'Leaving Mosque', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', meaning: 'O Allah, I ask You of Your bounty.', category: 'mosque', source: 'Muslim', repeatCount: 1 },

  // Travel
  { id: 'travel-1', title: 'Before Traveling', arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى', meaning: 'O Allah, we ask You on this journey righteousness and piety, and deeds that are pleasing to You.', category: 'travel', source: 'Muslim', repeatCount: 1 },

  // Eating
  { id: 'eating-1', title: 'Before Eating', arabic: 'بِسْمِ اللَّهِ', meaning: 'In the name of Allah.', category: 'eating', source: 'Bukhari', repeatCount: 1 },
  { id: 'eating-2', title: 'After Eating', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', meaning: 'Praise is to Allah who has fed me this and provided it for me without any might or power from me.', category: 'eating', source: 'Tirmidhi', repeatCount: 1 },

  // Home
  { id: 'home-1', title: 'Entering Home', arabic: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا', meaning: 'In the name of Allah we enter, and in the name of Allah we leave, and upon our Lord we rely.', category: 'home', source: 'Abu Dawud', repeatCount: 1 },

  // Prayer
  { id: 'prayer-1', title: 'After Adhan', arabic: 'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ', meaning: 'O Allah, Lord of this perfect call and established prayer, grant Muhammad the intercession and favor, and raise him to the praised station You promised him.', category: 'prayer', source: 'Bukhari', repeatCount: 1 },
  { id: 'prayer-2', title: 'Dua After Prayer', arabic: 'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ', meaning: 'I seek forgiveness from Allah (3 times).', category: 'prayer', source: 'Muslim', repeatCount: 3 },

  // Protection
  { id: 'protection-1', title: 'Ayat al-Kursi', arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ', meaning: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.', category: 'protection', source: 'Quran 2:255', repeatCount: 1 },
  { id: 'protection-2', title: 'Three Quls', arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ... قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ... قُلْ أَعُوذُ بِرَبِّ النَّاسِ', meaning: 'Say: He is Allah, the One... Say: I seek refuge in the Lord of daybreak... Say: I seek refuge in the Lord of mankind.', category: 'protection', source: 'Quran 112, 113, 114', repeatCount: 3 },

  // Forgiveness
  { id: 'forgiveness-1', title: 'Sayyid al-Istighfar', arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ', meaning: 'O Allah, You are my Lord. There is no god but You. You created me, and I am Your servant, and I am faithful to Your covenant and promise to You to the best of my ability. I seek refuge in You from the evil of what I have done. I acknowledge before You Your blessings bestowed upon me, and I confess to You my sins; so forgive me, for none forgives sins but You.', category: 'forgiveness', source: 'Bukhari', repeatCount: 1 },

  // Gratitude
  { id: 'gratitude-1', title: 'Thanking Allah', arabic: 'اللَّهُمَّ لَكَ الْحَمْدُ كَمَا يَنْبَغِي لِجَلَالِ وَجْهِكَ وَعَظِيمِ سُلْطَانِكَ', meaning: 'O Allah, to You belongs praise as befits the majesty of Your face and the greatness of Your sovereignty.', category: 'gratitude', source: 'Ibn Majah', repeatCount: 1 },

  // Sickness
  { id: 'sickness-1', title: 'For the Sick', arabic: 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا', meaning: 'O Allah, Lord of mankind, remove the harm, heal — You are the Healer. There is no healing but Your healing, a healing that leaves no trace of sickness.', category: 'sickness', source: 'Bukhari', repeatCount: 1 },

  // Distress
  { id: 'distress-1', title: 'In Distress', arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', meaning: 'There is no god but You, glory to You, indeed I was among the wrongdoers.', category: 'distress', source: 'Quran 21:87', repeatCount: 1 },

  // General
  { id: 'general-1', title: 'Dua for Parents', arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', meaning: 'My Lord, have mercy upon them as they brought me up when I was small.', category: 'general', source: 'Quran 17:24', repeatCount: 1 },
  { id: 'general-2', title: 'Dua for Knowledge', arabic: 'رَبِّ زِدْنِي عِلْمًا', meaning: 'My Lord, increase me in knowledge.', category: 'general', source: 'Quran 20:114', repeatCount: 1 },
  { id: 'general-3', title: 'Dua for Guidance', arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', meaning: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.', category: 'general', source: 'Quran 2:201', repeatCount: 1 },
];

// ─── Dua Counter ─────────────────────────────────────────────
function DuaCounter({ target, onComplete }: { target: number; onComplete?: () => void }) {
  const [count, setCount] = useState(0);
  const progress = count / target;

  return (
    <View style={counterStyles.container}>
      <View style={counterStyles.track}>
        <View style={[counterStyles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={counterStyles.row}>
        <Text style={counterStyles.count}>{count}/{target}</Text>
        <TouchableOpacity
          style={[counterStyles.btn, count >= target && counterStyles.btnDone]}
          onPress={() => {
            if (count < target) {
              setCount(c => c + 1);
              if (count + 1 >= target) onComplete?.();
            }
          }}
        >
          <Ionicons name="add" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const counterStyles = StyleSheet.create({
  container: { marginTop: 12 },
  track: { height: 4, backgroundColor: C.border, borderRadius: 2, marginBottom: 8 },
  fill: { height: 4, backgroundColor: C.primary, borderRadius: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { fontSize: 13, color: C.textSecondary, fontFamily: 'Jost_600SemiBold' },
  btn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  btnDone: { backgroundColor: C.textMuted }});

// ─── Dua Card ────────────────────────────────────────────────
function DuaCard({ dua, isFav, onToggleFav }: { dua: Dua; isFav: boolean; onToggleFav: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useSharedValue(0);

  useEffect(() => {
    heightAnim.value = withTiming(expanded ? 1 : 0, { duration: 250 });
  }, [expanded]);

  const animatedBodyStyle = useAnimatedStyle(() => ({
    height: interpolate(heightAnim.value, [0, 1], [0, 280]),
    opacity: heightAnim.value,
  }));

  return (
    <View style={duaStyles.card}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={duaStyles.header}>
          <View style={duaStyles.headerLeft}>
            <Text style={duaStyles.title}>{dua.title}</Text>
            <Text style={duaStyles.source}>{dua.source} {dua.repeatCount && dua.repeatCount > 1 ? `• ${dua.repeatCount}x` : ''}</Text>
          </View>
          <View style={duaStyles.headerRight}>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onToggleFav(); }}>
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? C.primary : C.textMuted} />
            </TouchableOpacity>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMuted} style={{ marginLeft: 8 }} />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View style={[duaStyles.body, animatedBodyStyle]}>
          <Text style={duaStyles.arabic}>{dua.arabic}</Text>
          <Text style={duaStyles.meaning}>{dua.meaning}</Text>
          {dua.repeatCount && dua.repeatCount > 1 && (
            <DuaCounter target={dua.repeatCount} />
          )}
        </Animated.View>
      )}
    </View>
  );
}

const duaStyles = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceElevated, borderRadius: 16, padding: 16, marginBottom: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 15, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  source: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  body: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  arabic: { fontSize: 18, color: C.primary, textAlign: 'right', lineHeight: 30, marginBottom: 10 },
  meaning: { fontSize: 13, color: C.textSecondary, lineHeight: 20, fontStyle: 'italic' }});

// ─── Category Chip ───────────────────────────────────────────
function CategoryChip({ cat, active, onPress }: { cat: { value: CategoryFilter; label: string; icon: string }; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[catStyles.chip, active && catStyles.chipActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${cat.label}`}
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={iconName(cat.icon)} size={14} color={active ? '#FFF' : C.textSecondary} />
      <Text style={[catStyles.label, active && catStyles.labelActive]}>{cat.label}</Text>
    </TouchableOpacity>
  );
}

const catStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.surfaceElevated, marginRight: 8, marginBottom: 8,
  },
  chipActive: { backgroundColor: C.primary },
  label: { fontSize: 12, color: C.textSecondary, fontFamily: 'Jost_500Medium' },
  labelActive: { color: '#FFF', fontFamily: 'Jost_600SemiBold' }});

// ─── Main Screen ─────────────────────────────────────────────
export default function DuaLibraryScreen() {
  const [activeCategory, setActiveCategory] = useState<DuaCategory | 'all' | 'favorites'>('all');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const favs = await getFavoriteDuas();
      setFavorites(new Set(favs));
    } catch (error) {
      logger.warn('DuaLibrary: failed to load favorites', error);
    }
  };

  const toggleFav = async (duaId: string) => {
    try {
      const favs = await toggleFavoriteDua(duaId);
      setFavorites(new Set(favs));
    } catch (error) {
      logger.warn('DuaLibrary: failed to toggle favorite', error);
    }
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

  // Daily featured dua
  const dayIndex = new Date().getDate() % DUAS.length;
  const featuredDua = DUAS[dayIndex];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Dua Library</Text>
        <Text style={styles.subtitle}>{DUAS.length} authentic supplications</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search duas..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={C.textMuted}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Featured Dua */}
      <View style={styles.featuredCard}>
        <View style={styles.featuredHeader}>
          <Ionicons name="star" size={14} color={C.gold} />
          <Text style={styles.featuredTitle}>Dua of the Day</Text>
        </View>
        <Text style={styles.featuredArabic}>{featuredDua.arabic}</Text>
        <Text style={styles.featuredMeaning}>{featuredDua.meaning}</Text>
        <Text style={styles.featuredSource}>— {featuredDua.source}</Text>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        <CategoryChip
          cat={{ value: 'all', label: 'All', icon: 'apps-outline' }}
          active={activeCategory === 'all'}
          onPress={() => setActiveCategory('all')}
        />
        <CategoryChip
          cat={{ value: 'favorites', label: 'Favorites', icon: 'heart-outline' }}
          active={activeCategory === 'favorites'}
          onPress={() => setActiveCategory('favorites')}
        />
        {DUA_CATEGORIES.map(cat => (
          <CategoryChip
            key={cat.value}
            cat={cat}
            active={activeCategory === cat.value}
            onPress={() => setActiveCategory(cat.value)}
          />
        ))}
      </ScrollView>

      {/* Dua List */}
      <Text style={styles.listTitle}>{filteredDuas.length} Duas</Text>
      {filteredDuas.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={36} color={C.textMuted} />
          <Text style={styles.emptyTitle}>No duas found</Text>
          <Text style={styles.emptyText}>Try a different search or category.</Text>
        </View>
      ) : (
        filteredDuas.map(dua => (
          <DuaCard
            key={dua.id}
            dua={dua}
            isFav={favorites.has(dua.id)}
            onToggleFav={() => toggleFav(dua.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingBottom: 120 },
  header: { padding: 18, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.goldPale },
  subtitle: { fontSize: 14, color: C.goldLight, fontFamily: "Jost_400Regular", marginTop: 4 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceElevated, borderRadius: 14,
    margin: 18, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.textPrimary },

  featuredCard: {
    backgroundColor: C.goldPale, borderRadius: 18, padding: 18, marginHorizontal: 18, marginBottom: 16,
  },
  featuredHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  featuredTitle: { fontSize: 14, fontFamily: 'Jost_700Bold', color: C.gold },
  featuredArabic: { fontSize: 16, color: C.textPrimary, textAlign: 'right', lineHeight: 26, marginBottom: 10 },
  featuredMeaning: { fontSize: 13, color: C.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  featuredSource: { fontSize: 12, color: C.textMuted, marginTop: 8, textAlign: 'right' },

  categories: { paddingHorizontal: 18, paddingBottom: 8 },
  listTitle: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginHorizontal: 18, marginBottom: 10, marginTop: 4 },
  emptyState: { paddingVertical: 28, alignItems: 'center', marginHorizontal: 18 },
  emptyTitle: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginTop: 8 },
  emptyText: { fontSize: 13, color: C.textMuted, marginTop: 4, textAlign: 'center' },
});
