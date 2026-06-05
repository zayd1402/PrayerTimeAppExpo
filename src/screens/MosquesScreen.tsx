import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Linking, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useSnackbar } from '../components/Snackbar';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';

interface Coordinate { latitude: number; longitude: number; }
interface Mosque { id: string; name: string; address: string; distance?: string; }
interface MosquesScreenProps { coordinate: Coordinate; }

// Demo data; in production this would query a Places API
const DEMO_MOSQUES: Mosque[] = [
  { id: '1', name: 'Masjid Al-Hussein',  address: '123 William St, Sydney NSW',     distance: '0.5 km' },
  { id: '2', name: 'Sydney Mosque',      address: '200 George St, Sydney NSW',     distance: '1.2 km' },
  { id: '3', name: 'Lakemba Mosque',     address: '45 Railway St, Lakemba NSW',    distance: '8.5 km' },
  { id: '4', name: 'Five Dock Mosque',   address: '100 Great North Rd, Five Dock NSW', distance: '12 km' },
  { id: '5', name: 'Auburn Mosque',      address: '88 Burwood Rd, Auburn NSW',     distance: '15 km' },
];

export default function MosquesScreen({ coordinate }: MosquesScreenProps) {
  const { c, type, radius } = useTheme();
  const { show } = useSnackbar();
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const searchMosques = useCallback(async () => {
    try {
      setLoading(true);
      // Simulated network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setMosques(DEMO_MOSQUES);
    } catch {
      show({ message: 'Unable to search mosques', variant: 'error', icon: 'alert-circle' });
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => { searchMosques(); }, [searchMosques]);

  const onRefresh = async () => {
    setRefreshing(true);
    await searchMosques();
    setRefreshing(false);
  };

  const openInMaps = async (mosque: Mosque) => {
    const query = encodeURIComponent(mosque.name);
    const lat = coordinate.latitude;
    const lng = coordinate.longitude;
    const url = Platform.select({
      ios: `https://maps.apple.com/?q=${query}`,
      android: `geo:${lat},${lng}?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    })!;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        show({ message: 'No maps app installed', variant: 'error' });
      }
    } catch {
      show({ message: 'Could not open maps', variant: 'error' });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgBase }}>
      <View style={[styles.header, { backgroundColor: c.heroBg, paddingTop: 60 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[type.headline, { color: c.onHero, fontSize: 22, fontWeight: '700' }]}>Nearby Mosques</Text>
          <Text style={[type.body, { color: c.onDarkMuted, marginTop: 4 }]}>Find a place to pray</Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh mosque list"
          style={[styles.refreshBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
        >
          <Ionicons name="refresh" size={20} color={c.onHero} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[type.body, { color: c.textSecondary }]}>Searching nearby...</Text>
        </View>
      ) : mosques.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="No mosques found nearby"
          message="Try expanding your search or check back later"
        />
      ) : (
        <FlatList
          data={mosques}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 18, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} colors={[c.emerald]} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.mosqueCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, padding: 16 }]}
              onPress={() => openInMaps(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.address}, ${item.distance || 'distance unknown'}, tap to open in maps`}
            >
              <View style={[styles.mosqueIcon, { backgroundColor: c.emeraldPale, borderRadius: 25 }]}>
                <Ionicons name="location" size={24} color={c.emerald} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.body, { color: c.textPrimary, fontWeight: '600' }]}>{item.name}</Text>
                <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
              {item.distance && (
                <View style={[styles.distanceTag, { backgroundColor: c.emeraldPale, borderRadius: 12 }]}>
                  <Text style={[type.caption, { color: c.emerald, fontWeight: '600' }]}>{item.distance}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mosqueCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mosqueIcon: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  distanceTag: { paddingHorizontal: 10, paddingVertical: 5 },
});
