import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppLocation } from '../types';
import { getNearbyMosques, searchLocalMosques, NearbyMosque } from '../services/LocalMosqueService';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { Glyph } from '../design/Glyph';
import { F } from '../design/palette';

interface MosquesScreenProps {
  coordinate: Pick<AppLocation, 'latitude' | 'longitude'>;
  embedded?: boolean;
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export default function MosquesScreen({ coordinate, embedded = false }: MosquesScreenProps) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const [query, setQuery] = useState('');
  const [mosques, setMosques] = useState<NearbyMosque[]>([]);

  useEffect(() => {
    const normalized = query.trim().toLowerCase();
    const nearby = getNearbyMosques(coordinate, 100);
    const filtered = normalized
      ? searchLocalMosques(query)
          .map(mosque => ({
            ...mosque,
            distanceKm: nearby.find(item => item.id === mosque.id)?.distanceKm ?? Number.POSITIVE_INFINITY,
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
      : nearby;

    setMosques(filtered);
  }, [coordinate, query]);

  function openInMaps(mosque: NearbyMosque) {
    const label = encodeURIComponent(mosque.name);
    const lat = mosque.latitude;
    const lng = mosque.longitude;

    Linking.canOpenURL('comgooglemaps://')
      .then(supported => {
        const url = supported
          ? `comgooglemaps://?q=${label}&center=${lat},${lng}`
          : `https://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
        return Linking.openURL(url);
      })
      .catch(() => {});
  }

  return (
    <View style={[styles.container, !embedded && styles.pageContainer]}>
      {!embedded && (
        <View style={styles.header}>
          <Text style={styles.title}>Mosques</Text>
          <Text style={styles.subtitle}>Distances from your city. Your local mosque may not be listed yet.</Text>
        </View>
      )}

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search city, name, or address"
          placeholderTextColor={C.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {mosques.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={36} color={C.textMuted} />
          <Text style={styles.emptyTitle}>No mosques found</Text>
          <Text style={styles.emptyText}>Try another city or clear the search.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {mosques.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.mosqueCard}
              onPress={() => openInMaps(item)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${formatDistance(item.distanceKm)} away`}
            >
              <View style={styles.mosqueIcon}>
                <Glyph name="mosque" size={22} color={C.primaryDark} />
              </View>
              <View style={styles.mosqueInfo}>
                <Text style={styles.mosqueName}>{item.name}</Text>
                <Text style={styles.mosqueAddress}>{item.address}</Text>
                {item.phone && <Text style={styles.mosqueMeta}>{item.phone}</Text>}
              </View>
              <View style={styles.distanceTag}>
                <Text style={styles.distanceText}>{formatDistance(item.distanceKm)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  container: { backgroundColor: C.bgBase },
  pageContainer: { flex: 1, paddingHorizontal: 16 },
  header: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 14 },
  title: { fontSize: 30, lineHeight: 36, fontFamily: F.display, color: C.textPrimary },
  subtitle: { fontSize: 14, fontFamily: F.body, color: C.textMuted, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSurface, borderRadius: 14,
    paddingHorizontal: 14, minHeight: 48, gap: 10, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: F.body, color: C.textPrimary, paddingVertical: 10 },
  list: { gap: 8 },
  mosqueCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSurface, borderRadius: 16, padding: 12, gap: 12 },
  mosqueIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  mosqueInfo: { flex: 1 },
  mosqueName: { fontSize: 15, fontFamily: F.semibold, color: C.textPrimary },
  mosqueAddress: { fontSize: 12.5, fontFamily: F.body, color: C.textMuted, marginTop: 2, lineHeight: 17 },
  mosqueMeta: { fontSize: 12, fontFamily: F.body, color: C.textMuted, marginTop: 1 },
  distanceTag: { paddingHorizontal: 4 },
  distanceText: { fontSize: 13, color: C.primaryDark, fontFamily: F.semibold },
  emptyState: { paddingVertical: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontFamily: F.semibold, color: C.textPrimary, marginTop: 8 },
  emptyText: { fontSize: 13, fontFamily: F.body, color: C.textMuted, marginTop: 4 },
});
