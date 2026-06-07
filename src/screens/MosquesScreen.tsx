import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { C } from '../types';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Mosque {
  id: string;
  name: string;
  address: string;
  distance?: string;
}

interface MosquesScreenProps {
  coordinate: Coordinate;
}

export default function MosquesScreen({ coordinate }: MosquesScreenProps) {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchMosques();
  }, []);

  async function searchMosques() {
    try {
      setLoading(true);
      // Using foursquare API placeholder - in production, use Places API
      const demoMosques: Mosque[] = [
        { id: '1', name: 'Masjid Al-Hussein', address: '123 William St, Sydney NSW', distance: '0.5 km' },
        { id: '2', name: 'Sydney Mosque', address: '200 George St, Sydney NSW', distance: '1.2 km' },
        { id: '3', name: 'Lakemba Mosque', address: '45 Railway St, Lakemba NSW', distance: '8.5 km' },
        { id: '4', name: 'Fivedock Mosque', address: '100 Great North Rd, Five Dock NSW', distance: '12 km' },
        { id: '5', name: ' Aubury Mosque', address: '88 Burwood Rd, Auburn NSW', distance: '15 km' },
      ];
      setMosques(demoMosques);
    } catch (error) {
      Alert.alert('Error', 'Unable to search mosques');
    } finally {
      setLoading(false);
    }
  }

  function openInMaps(mosque: Mosque) {
    const url = `https://maps.apple.com/?q=${encodeURIComponent(mosque.name)}&ll=${coordinate.latitude},${coordinate.longitude}`;
    Linking.openURL(url).catch(() => {});
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Mosques</Text>
        <TouchableOpacity onPress={searchMosques}>
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Searching nearby...</Text>
        </View>
      ) : (
        <FlatList
          data={mosques}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.mosqueCard} onPress={() => openInMaps(item)}>
              <View style={styles.mosqueIcon}>
                <Text style={styles.mosqueIconText}>🕌</Text>
              </View>
              <View style={styles.mosqueInfo}>
                <Text style={styles.mosqueName}>{item.name}</Text>
                <Text style={styles.mosqueAddress}>{item.address}</Text>
              </View>
              {item.distance && (
                <View style={styles.distanceTag}>
                  <Text style={styles.distanceText}>{item.distance}</Text>
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
  container: {
    flex: 1,
    backgroundColor: C.bgSurface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    paddingTop: 60,
    backgroundColor: C.heroBg,
  },
  title: {
    fontSize: 24,
    fontFamily: 'BodoniModa_700Bold',
    color: C.goldPale,
  },
  refreshText: {
    fontSize: 14,
    color: C.textSecondary,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: C.textSecondary,
  },
  list: {
    padding: 18,
    gap: 12,
  },
  mosqueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSurface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  mosqueIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mosqueIconText: {
    fontSize: 24,
  },
  mosqueInfo: {
    flex: 1,
  },
  mosqueName: {
    fontSize: 16,
    fontFamily: 'Jost_600SemiBold',
    color: C.textPrimary,
  },
  mosqueAddress: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  distanceTag: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    color: C.textSecondary,
    fontFamily: 'Jost_600SemiBold',
  },
});