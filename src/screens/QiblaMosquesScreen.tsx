import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { usePrayerApp } from '../context/PrayerAppContext';
import QiblaScreen from './QiblaScreen';
import MosquesScreen from './MosquesScreen';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { Glyph } from '../design/Glyph';
import { F } from '../design/palette';
import { PageTitle, PrimaryButton, SectionLabel } from '../design/ui';
import type { RootStackParamList } from '../navigation/routes';

export default function QiblaMosquesScreen() {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { location } = usePrayerApp();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageTitle title="Qibla" subtitle={location?.name} />
        {!location ? (
          <View style={styles.empty}>
            <Glyph name="pin" size={30} color={C.primaryDark} />
            <Text style={styles.emptyTitle}>Location needed</Text>
            <Text style={styles.emptyText}>Choose your city so the Qibla direction and nearby mosques are accurate.</Text>
            <PrimaryButton label="Choose city" onPress={() => navigation.navigate('settings')} />
          </View>
        ) : (
          <>
            <QiblaScreen coordinate={location} compact showHeader={false} />
            <SectionLabel>Nearby mosques</SectionLabel>
            <MosquesScreen coordinate={location} embedded />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 16 },
  empty: { backgroundColor: C.bgSurface, borderRadius: 18, padding: 20, alignItems: 'center', gap: 10 },
  emptyTitle: { fontFamily: F.semibold, fontSize: 17, color: C.textPrimary },
  emptyText: { fontFamily: F.body, fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 4 },
});
