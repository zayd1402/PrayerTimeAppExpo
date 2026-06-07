import React, { useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';

type HajjTab = 'purpose' | 'ihram' | 'tawaf' | 'sai' | 'arafah' | 'jamarat' | 'hajj';

const TABS: { id: HajjTab; label: string; icon: string }[] = [
  { id: 'purpose', label: 'Intention', icon: 'heart-outline' },
  { id: 'ihram', label: 'Ihram', icon: 'shirt-outline' },
  { id: 'tawaf', label: 'Tawaf', icon: 'refresh-outline' },
  { id: 'sai', label: 'Sa\'i', icon: 'walk-outline' },
  { id: 'arafah', label: 'Arafah', icon: 'sunny-outline' },
  { id: 'jamarat', label: 'Jamarat', icon: 'layers-outline' },
  { id: 'hajj', label: 'Summary', icon: 'checkmark-circle-outline' },
];

export default function HajjScreen() {
  const [activeTab, setActiveTab] = useState<HajjTab>('purpose');
  const [tawafCount, setTawafCount] = useState(0);
  const [saiCount, setSaiCount] = useState(0);
  const [jamarat1, setJamarat1] = useState(0);
  const [jamarat2, setJamarat2] = useState(0);
  const [jamarat3, setJamarat3] = useState(0);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => setChecklist(prev => ({ ...prev, [id]: !prev[id] }));

  const renderContent = () => {
    switch (activeTab) {
      case 'purpose':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Intention & Preparation</Text>
            <Text style={styles.highlightText}>"Labbaik Allahumma Hajj" — Here I am, O Allah, for Hajj</Text>
            <View style={styles.checklist}>
              {[
                { id: 'niyyah', label: 'Sincere intention for Allah alone' },
                { id: 'knowledge', label: 'Learn the rituals before going' },
                { id: 'mahram', label: 'Mahram arrangement (for women)' },
                { id: 'vaccination', label: 'Required vaccinations taken' },
                { id: 'packing', label: 'Ihram clothes + essentials packed' },
                { id: 'finances', label: 'Halal funds set aside' },
              ].map(item => (
                <TouchableOpacity key={item.id} style={styles.checkRow} onPress={() => toggleCheck(item.id)}>
                  <Ionicons name={checklist[item.id] ? 'checkbox' : 'square-outline'} size={20} color={checklist[item.id] ? C.primary : C.textMuted} />
                  <Text style={[styles.checkLabel, checklist[item.id] && styles.checkLabelDone]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'ihram':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ihram — Entering Sacred State</Text>
            <View style={styles.ihramBox}>
              <Text style={styles.ihramLabel}>⚠️ Restricted (Haram) in Ihram</Text>
              {['Clothing with stitches (men)', 'Perfume/Scents', 'Cutting hair/nails', 'Hunting or harming animals', 'Sexual relations', 'Fighting or arguing'].map((item, i) => (
                <View key={i} style={styles.ihramItem}>
                  <Ionicons name="close-circle" size={14} color={C.red} />
                  <Text style={styles.ihramItemText}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.ihramBoxAlt}>
              <Text style={styles.ihramLabel}>✅ Permitted</Text>
              {['Shower before ihram', 'Use unscented soap', 'Wear sandals', 'Carry umbrella', 'Use medication'].map((item, i) => (
                <View key={i} style={styles.ihramItem}>
                  <Ionicons name="checkmark-circle" size={14} color={C.primary} />
                  <Text style={styles.ihramItemText}>{item}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.ihramDua}>Talbiyah:</Text>
            <Text style={styles.duaArabic}>لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ</Text>
            <Text style={styles.duaTrans}>Labbaik Allahumma labbaik, labbaik la sharika laka labbaik, innal-hamda wan-ni\'mata laka wal-mulk, la sharika lak</Text>
          </View>
        );

      case 'tawaf':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tawaf — 7 Circuits Around the Ka'bah</Text>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setTawafCount(prev => Math.min(prev + 1, 7))}>
              <Ionicons name="add-circle" size={32} color={C.primary} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{tawafCount}/7</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(tawafCount / 7) * 100}%` }]} />
            </View>
            {tawafCount < 7 && (
              <TouchableOpacity style={styles.resetBtn} onPress={() => setTawafCount(0)}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            )}
            {tawafCount === 7 && <Text style={styles.completeText}>✅ Tawaf complete! Now pray 2 rakahs at Maqam Ibrahim.</Text>}
            <View style={styles.duaSection}>
              <Text style={styles.duaSectionTitle}>Dua between the Yemeni Corner and Black Stone:</Text>
              <Text style={styles.duaArabic}>رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ</Text>
              <Text style={styles.duaTrans}>Rabbana atina fid-dunya hasanah wa fil-akhirati hasanah wa qina adhaban-nar</Text>
            </View>
          </View>
        );

      case 'sai':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sa'i — 7 Walks Between Safa and Marwah</Text>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setSaiCount(prev => Math.min(prev + 1, 7))}>
              <Ionicons name="add-circle" size={32} color={C.primary} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{saiCount}/7</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(saiCount / 7) * 100}%` }]} />
            </View>
            {saiCount < 7 && (
              <TouchableOpacity style={styles.resetBtn} onPress={() => setSaiCount(0)}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            )}
            {saiCount === 7 && <Text style={styles.completeText}>✅ Sa'i complete! Men: trim hair or shave. Women: trim a fingertip's length.</Text>}
            <Text style={styles.duaSectionTitle}>On Safa, recite:</Text>
            <Text style={styles.duaArabic}>إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ</Text>
            <Text style={styles.duaTrans}>Innas-safa wal-marwata min sha\'airillah</Text>
          </View>
        );

      case 'arafah':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>The Day of Arafah — The Best Day</Text>
            <Text style={styles.highlightText}>"Hajj is Arafah" — The Prophet ﷺ</Text>
            <View style={styles.arafahChecklist}>
              {[
                { id: 'wuquf', label: 'Stand at Arafah (wuquf) — the essential act' },
                { id: 'dua', label: 'Make abundant dua — it is the best day for dua' },
                { id: 'dhikr', label: 'Recite talbiyah, tahleel, and takbeer' },
                { id: 'qibla', label: 'Face qiblah with raised hands' },
                { id: 'humble', label: 'Be humble, repent, and ask sincerely' },
              ].map(item => (
                <TouchableOpacity key={item.id} style={styles.checkRow} onPress={() => toggleCheck(item.id)}>
                  <Ionicons name={checklist[item.id] ? 'checkbox' : 'square-outline'} size={20} color={checklist[item.id] ? C.primary : C.textMuted} />
                  <Text style={[styles.checkLabel, checklist[item.id] && styles.checkLabelDone]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.duaSectionTitle}>The Prophet's ﷺ dua at Arafah:</Text>
            <Text style={styles.duaArabic}>لَا إِلٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ</Text>
            <Text style={styles.duaTrans}>La ilaha illallah wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa \'ala kulli shay\'in qadir</Text>
          </View>
        );

      case 'jamarat':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Jamarat — Stoning the Pillars</Text>
            <Text style={styles.jamaratDay}>Day 1 (10th Dhul Hijjah): Stoning the Great Jamarah (Al-Aqaba) — 7 pebbles</Text>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setJamarat1(prev => Math.min(prev + 1, 7))}>
              <Ionicons name="add-circle" size={28} color={C.primary} />
            </TouchableOpacity>
            <Text style={styles.jamaratCount}>Al-Aqaba: {jamarat1}/7</Text>
            <Text style={styles.jamaratDay}>Days 2-3: Stoning all 3 Jamarat (Small, Middle, Large) — 21 pebbles each day</Text>
            <View style={styles.jamaratRow}>
              <TouchableOpacity style={styles.jamaratBtn} onPress={() => setJamarat1(prev => Math.min(prev + 1, 7))}>
                <Text style={styles.jamaratLabel}>Small</Text>
                <Text style={styles.jamaratCount}>{jamarat1}/7</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.jamaratBtn} onPress={() => setJamarat2(prev => Math.min(prev + 1, 7))}>
                <Text style={styles.jamaratLabel}>Middle</Text>
                <Text style={styles.jamaratCount}>{jamarat2}/7</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.jamaratBtn} onPress={() => setJamarat3(prev => Math.min(prev + 1, 7))}>
                <Text style={styles.jamaratLabel}>Large</Text>
                <Text style={styles.jamaratCount}>{jamarat3}/7</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'hajj':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hajj Completion Checklist</Text>
            {[
              'Tawaf al-Qudum (Arrival Tawaf)',
              'Sa\'i between Safa and Marwah',
              'Stay in Mina (8th Dhul Hijjah)',
              'Day of Arafah — Wuquf (9th)',
              'Stay in Muzdalifah (night of 10th)',
              'Stoning of Al-Aqaba (10th)',
              'Sacrifice (Hady/Adhiyah)',
              'Shaving/Trimming hair (Tahallul)',
              'Tawaf al-Ifadah (10th)',
              'Days of Tashreeq in Mina (11th-13th)',
              'Farewell Tawaf (Tawaf al-Wada\')',
              'Visit Madinah (optional — highly recommended)',
            ].map((item, i) => {
              const checked = checklist[`hajj-${i}`];
              return (
                <TouchableOpacity key={i} style={styles.checkRow} onPress={() => toggleCheck(`hajj-${i}`)}>
                  <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={20} color={checked ? C.primary : C.textMuted} />
                  <Text style={[styles.checkLabel, checked && styles.checkLabelDone]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Hajj & Umrah</Text>
        <Text style={styles.subtitle}>Complete Ritual Guide</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabStrip}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.id ? C.white : C.textSecondary} />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {renderContent()}
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

  tabStrip: { margin: 18, marginBottom: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: C.bgSurface, marginRight: 8 },
  tabActive: { backgroundColor: C.primary },
  tabLabel: { fontSize: 13, fontFamily: 'Jost_600SemiBold', color: C.textSecondary },
  tabLabelActive: { color: C.white },

  card: { backgroundColor: C.surfaceElevated, borderRadius: 18, margin: 18, marginBottom: 10, padding: 18 },
  cardTitle: { fontSize: 17, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginBottom: 8 },
  highlightText: { fontSize: 14, color: C.primary, fontFamily: 'Jost_600SemiBold', fontStyle: 'italic', marginBottom: 12 },

  checklist: { marginTop: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkLabel: { fontSize: 14, color: C.textSecondary, fontFamily: 'Jost_500Medium', flex: 1 },
  checkLabelDone: { color: C.textMuted, textDecorationLine: 'line-through' },

  counterBtn: { alignSelf: 'center', marginVertical: 8 },
  counterValue: { fontSize: 48, fontFamily: 'BodoniModa_700Bold', color: C.primary, textAlign: 'center' },
  progressBar: { height: 6, backgroundColor: C.border, borderRadius: 3, marginVertical: 12 },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  resetBtn: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 20, borderRadius: 10, backgroundColor: C.bgSurface, marginTop: 8 },
  resetBtnText: { fontSize: 13, color: C.textMuted, fontFamily: 'Jost_600SemiBold' },
  completeText: { fontSize: 14, color: C.primary, fontFamily: 'Jost_600SemiBold', textAlign: 'center', marginTop: 12 },

  ihramBox: { backgroundColor: 'rgba(196,85,59,0.08)', borderRadius: 12, padding: 14, marginBottom: 10 },
  ihramBoxAlt: { backgroundColor: 'rgba(194,122,45,0.08)', borderRadius: 12, padding: 14, marginBottom: 10 },
  ihramLabel: { fontSize: 13, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginBottom: 8 },
  ihramItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ihramItemText: { fontSize: 13, color: C.textSecondary },
  ihramDua: { fontSize: 14, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginTop: 12, marginBottom: 8 },

  duaSection: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  duaSectionTitle: { fontSize: 13, fontFamily: 'Jost_600SemiBold', color: C.textSecondary, marginBottom: 8 },
  duaArabic: { fontSize: 15, color: C.textPrimary, textAlign: 'right', lineHeight: 26, marginBottom: 6 },
  duaTrans: { fontSize: 13, color: C.textMuted, fontStyle: 'italic', marginBottom: 12 },

  arafahChecklist: { marginBottom: 16 },

  jamaratDay: { fontSize: 13, color: C.textSecondary, fontFamily: 'Jost_600SemiBold', marginBottom: 8 },
  jamaratRow: { flexDirection: 'row', gap: 10 },
  jamaratBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: C.bgCard },
  jamaratLabel: { fontSize: 12, fontFamily: 'Jost_600SemiBold', color: C.textMuted },
  jamaratCount: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.primary, marginTop: 4 },
});
