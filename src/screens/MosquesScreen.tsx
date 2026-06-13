import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Linking, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import { AppLocation } from '../types';
import { getNearbyMosques, searchLocalMosques, NearbyMosque } from '../services/LocalMosqueService';

interface MosquesScreenProps {
  coordinate: Pick<AppLocation, 'latitude' | 'longitude'>;
  embedded?: boolean;
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export default function MosquesScreen({ coordinate, embedded = false }: MosquesScreenProps) {
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
    <View style={[styles.container, embedded && styles.embeddedContainer]}>
      <View style={[styles.header, embedded && styles.embeddedHeader]}>
        <View>
          <Text style={styles.title}>Mosques</Text>
          <Text style={styles.subtitle}>Global seed list with distance from your selected city. Add your local mosque in Settings if it is missing.</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={() => setQuery('')}>
          <Ionicons name="refresh-outline" size={18} color={C.primary} />
        </TouchableOpacity>
      </View>

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
        <FlatList
          data={mosques}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.mosqueCard}
              onPress={() => openInMaps(item)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${formatDistance(item.distanceKm)} away`}
            >
              <View style={styles.mosqueIcon}>
                <Ionicons name="business" size={24} color={C.primary} />
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
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgSurface, borderRadius: 22, marginHorizontal: 18, padding: 16 },
  embeddedContainer: { backgroundColor: C.bgSurface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  embeddedHeader: { paddingTop: 0 },
  title: { fontSize: 18, fontFamily: 'BodoniModa_700Bold', color: C.textPrimary },
  subtitle: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  refreshButton: { width: 36, height: 36, borderRadius: 14, backgroundColor: C.goldPale, justifyContent: 'center', alignItems: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgBase,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.textPrimary },
  list: { gap: 10 },
  mosqueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgBase,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  mosqueIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: C.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mosqueInfo: { flex: 1 },
  mosqueName: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  mosqueAddress: { fontSize: 12, color: C.textMuted, marginTop: 2, lineHeight: 16 },
  mosqueMeta: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  distanceTag: { backgroundColor: C.goldPale, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  distanceText: { fontSize: 11, color: C.gold, fontFamily: 'Jost_700Bold' },
  emptyState: { paddingVertical: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginTop: 8 },
  emptyText: { fontSize: 13, color: C.textMuted, marginTop: 4 },
});
