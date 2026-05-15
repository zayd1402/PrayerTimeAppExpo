import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Magnetometer } from 'expo-sensors';

import { Card } from '../components/Card';
import { C } from '../types';
import { bearingToCompassDirection, calculateQiblaDirection } from '../services/PrayerService';

type Location = { latitude: number; longitude: number; name: string };

export function QiblaScreen({ location }: { location: Location }) {
  const [rotation, setRotation] = useState(0);

  const qiblaDir = calculateQiblaDirection(location.latitude, location.longitude);
  const bearingStr = bearingToCompassDirection(qiblaDir);
  const distance = Math.round(
    6371 * 2 * Math.atan2(
      Math.sqrt(Math.abs(Math.sin((location.latitude - 21.4225) * Math.PI / 360) ** 2 +
        Math.cos(location.latitude * Math.PI / 180) * Math.cos(21.4225 * Math.PI / 180) *
        Math.sin((location.longitude - 39.8264) * Math.PI / 360) ** 2)),
      Math.sqrt(1 - (Math.abs(Math.sin((location.latitude - 21.4225) * Math.PI / 360) ** 2 +
        Math.cos(location.latitude * Math.PI / 180) * Math.cos(21.4225 * Math.PI / 180) *
        Math.sin((location.longitude - 39.8264) * Math.PI / 360) ** 2))
      )
    )
  );

  useEffect(() => {
    const subscription = Magnetometer.addListener((data: { x: number; y: number; z: number }) => {
      const { x, y } = data;
      const angle = Math.atan2(y, x) * (180 / Math.PI);
      const corrected = (angle + 360) % 360;
      const relative = (qiblaDir - corrected + 360) % 360;
      setRotation(relative);
    });
    return () => subscription.remove();
  }, [qiblaDir]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Qibla direction</Text>
        <Text style={styles.title}>Face Makkah</Text>
        <Text style={styles.subtitle}>{location.name}</Text>
      </View>

      <View style={styles.qiblaWrap}>
        <View style={styles.compassGlow}>
          <View style={styles.compassOrbit} />
          <View style={[styles.compassRing, { transform: [{ rotate: `${rotation}deg` }] }]}>
            {['N', 'E', 'S', 'W'].map(d => {
              const angles: Record<string, number> = { N: 0, E: 90, S: 180, W: 270 };
              const angle = angles[d];
              const offset = (angle - rotation + 360) % 360;
              return (
                <View
                  key={d}
                  style={[
                    styles.compassMarker,
                    { transform: [{ rotate: `${angle}deg` }, { translateY: -85 }], opacity: offset < 45 || offset > 315 ? 1 : 0.3 },
                  ]}
                >
                  <Text style={styles.compassMarkerText}>{d}</Text>
                </View>
              );
            })}
            <View style={styles.compassInner}>
              <Ionicons name="location" size={24} color={C.gold} />
              <Text style={styles.compassDeg}>{Math.round(qiblaDir)}°</Text>
              <Text style={styles.compassBearing}>{bearingStr}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.qiblaStats}>
        <View style={styles.qiblaStat}>
          <Text style={styles.qiblaStatValue}>{Math.round(qiblaDir)}°</Text>
          <Text style={styles.qiblaStatLabel}>Bearing</Text>
        </View>
        <View style={[styles.qiblaStat, styles.qiblaStatFeatured]}>
          <Ionicons name="business-outline" size={18} color={C.gold} />
          <Text style={styles.qiblaStatValueSmall}>Makkah</Text>
          <Text style={styles.qiblaStatLabel}>Destination</Text>
        </View>
        <View style={styles.qiblaStat}>
          <Text style={styles.qiblaStatValue}>{distance.toLocaleString()}</Text>
          <Text style={styles.qiblaStatLabel}>km away</Text>
        </View>
      </View>

      <Card style={styles.qiblaInfoCard}>
        <View style={styles.qiblaInfoRow}>
          <Ionicons name="navigate" size={18} color={C.gold} />
          <Text style={styles.qiblaInfoText}>
            Point your device in the direction of the arrow. The compass shows the relative direction to Makkah.
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bgBase },
  screenPadding: { paddingHorizontal: 20, paddingBottom: 16 },
  header: { paddingTop: 10, paddingBottom: 10 },
  eyebrow: { fontSize: 11, fontWeight: '900', color: C.gold, letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 30, fontWeight: '900', color: C.navy, marginTop: 4 },
  subtitle: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginTop: 4 },
  qiblaWrap: { alignItems: 'center', paddingVertical: 24 },
  compassGlow: { width: 286, height: 286, borderRadius: 143, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(184,132,32,0.08)', borderWidth: 1, borderColor: 'rgba(184,132,32,0.12)' },
  compassOrbit: { position: 'absolute', width: 246, height: 246, borderRadius: 123, borderWidth: 1, borderColor: 'rgba(184,132,32,0.22)' },
  compassRing: { width: 224, height: 224, borderRadius: 112, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgSurface, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.11, shadowRadius: 24 }, android: { elevation: 5 } }) },
  compassMarker: { position: 'absolute', alignItems: 'center' },
  compassMarkerText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  compassInner: { width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgSurface },
  compassDeg: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 34, fontWeight: '900', color: C.navy, lineHeight: 38 },
  compassBearing: { fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 1, marginTop: 4 },
  qiblaStats: { flexDirection: 'row', gap: 9, marginBottom: 12 },
  qiblaStat: { flex: 1, minHeight: 78, borderRadius: 18, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', padding: 10 },
  qiblaStatFeatured: { backgroundColor: '#FFF8E9', borderColor: 'rgba(184,132,32,0.18)' },
  qiblaStatValue: { fontSize: 20, fontWeight: '900', color: C.navy },
  qiblaStatValueSmall: { fontSize: 14, fontWeight: '900', color: C.navy, marginTop: 4 },
  qiblaStatLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, marginTop: 4, textAlign: 'center' },
  qiblaInfoCard: { padding: 16 },
  qiblaInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  qiblaInfoText: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 20 },
});
