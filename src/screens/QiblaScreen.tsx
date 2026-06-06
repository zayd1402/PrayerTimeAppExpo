import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { C } from '../types';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(width - 80, 300);

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface QiblaScreenProps {
  coordinate: Coordinate;
}

const MAKKAH_LAT = 21.4225;
const MAKKAH_LON = 39.8262;

function toRadians(deg: number): number { return deg * (Math.PI / 180); }
function toDegrees(rad: number): number { return rad * (180 / Math.PI); }

function calculateQibla(lat: number, lon: number): number {
  const lat1 = toRadians(lat);
  const lon1 = toRadians(lon);
  const lat2 = toRadians(MAKKAH_LAT);
  const lon2 = toRadians(MAKKAH_LON);
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let qibla = Math.atan2(y, x);
  qibla = toDegrees(qibla);
  return (qibla + 360) % 360;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function bearingToDirection(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

// ─── Accuracy Indicator ──────────────────────────────────────
function AccuracyBadge({ accuracy }: { accuracy: 'high' | 'medium' | 'low' | 'calibrating' }) {
  const colors = {
    high: { bg: '#FDE8E2', text: C.coral, icon: 'checkmark-circle' },
    medium: { bg: '#FFF8E7', text: C.gold, icon: 'alert-circle' },
    low: { bg: '#FEE2E2', text: C.red, icon: 'warning' },
    calibrating: { bg: '#EFF6FF', text: C.warmBlue, icon: 'refresh' }};
  const c = colors[accuracy];
  return (
    <View style={[accStyles.badge, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon as any} size={14} color={c.text} />
      <Text style={[accStyles.text, { color: c.text }]}>
        {accuracy === 'calibrating' ? 'Calibrating...' : `${accuracy.charAt(0).toUpperCase() + accuracy.slice(1)} Accuracy`}
      </Text>
    </View>
  );
}

const accStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'center', marginTop: 12 },
  text: { fontSize: 13, fontWeight: '600' }});

// ─── Calibration Overlay ─────────────────────────────────────
function CalibrationOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={calStyles.overlay}>
      <Animated.View style={[calStyles.phone, { transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '15deg'] }) }] }]}>
        <Ionicons name="phone-portrait-outline" size={48} color={C.gold} />
      </Animated.View>
      <Text style={calStyles.title}>Calibrate Compass</Text>
      <Text style={calStyles.desc}>Move your phone in a figure-8 motion</Text>
    </View>
  );
}

const calStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(250,246,239,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100, borderRadius: 24 },
  phone: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: C.textPrimary, marginBottom: 8 },
  desc: { fontSize: 14, color: C.textSecondary }});

// ─── Main Screen ─────────────────────────────────────────────
export default function QiblaScreen({ coordinate }: QiblaScreenProps) {
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low' | 'calibrating'>('calibrating');
  const [isAligned, setIsAligned] = useState(false);
  const [distance, setDistance] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const alignedAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const qibla = calculateQibla(coordinate.latitude, coordinate.longitude);
    setQiblaDirection(qibla);
    const dist = haversine(coordinate.latitude, coordinate.longitude, MAKKAH_LAT, MAKKAH_LON);
    setDistance(dist);
  }, [coordinate]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let headingHistory: number[] = [];

    async function startCompass() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setAccuracy('low');
          return;
        }

        // Calibrate for 2 seconds
        setAccuracy('calibrating');
        setTimeout(() => setAccuracy('high'), 2000);

        subscription = await Location.watchHeadingAsync((heading) => {
          const magHeading = heading.magHeading;
          setDeviceHeading(magHeading);

          // Track heading stability for accuracy
          headingHistory.push(magHeading);
          if (headingHistory.length > 10) headingHistory.shift();
          const variance = Math.max(...headingHistory) - Math.min(...headingHistory);
          if (variance > 15) setAccuracy('low');
          else if (variance > 5) setAccuracy('medium');
          else setAccuracy('high');

          const relative = (qiblaDirection - magHeading + 360) % 360;
          setRotation(relative);

          const aligned = relative < 8 || relative > 352;
          setIsAligned(aligned);
          if (aligned) {
            Vibration.vibrate(50);
            Animated.spring(alignedAnim, { toValue: 1, useNativeDriver: true, friction: 3 }).start();
          } else {
            Animated.timing(alignedAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          }
        });
      } catch (error) {
        console.log('Heading not available');
        setAccuracy('low');
      }
    }

    startCompass();
    return () => subscription?.remove();
  }, [qiblaDirection]);

  // Smooth rotation animation
  useEffect(() => {
    Animated.spring(rotationAnim, {
      toValue: rotation,
      useNativeDriver: true,
      friction: 8,
      tension: 40}).start();
  }, [rotation]);

  const spin = rotationAnim.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const alignedScale = alignedAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Qibla Direction</Text>
        <Text style={styles.subtitle}>{Math.round(qiblaDirection)}° {bearingToDirection(qiblaDirection)} from North</Text>
      </View>

      <View style={styles.compassContainer}>
        <View style={[styles.compass, isAligned && styles.compassAligned]}>
          <CalibrationOverlay visible={accuracy === 'calibrating'} />

          {/* Compass rings */}
          <View style={[styles.compassRing, styles.ring1]} />
          <View style={[styles.compassRing, styles.ring2]} />
          <View style={[styles.compassRing, styles.ring3]} />

          {/* Degree markers */}
          {Array.from({ length: 12 }, (_, i) => {
            const deg = i * 30;
            return (
              <View key={deg} style={[styles.degMarker, { transform: [{ rotate: `${deg}deg` }] }]}>
                <View style={styles.degTick} />
              </View>
            );
          })}

          {/* Direction markers */}
          {['N', 'E', 'S', 'W'].map((d, i) => {
            const angles: Record<string, number> = { N: 0, E: 90, S: 180, W: 270 };
            return (
              <View key={d} style={[styles.dirMarker, { transform: [{ rotate: `${angles[d]}deg` }] }]}>
                <Text style={[styles.dirText, d === 'N' && styles.dirNorth]}>{d}</Text>
              </View>
            );
          })}

          {/* Rotating needle */}
          <Animated.View style={[styles.needleWrap, { transform: [{ rotate: spin }] }]}>
            <Animated.View style={[styles.needle, { transform: [{ scale: alignedScale }] }]}>
              <View style={styles.needleTop} />
              <View style={styles.needleBottom} />
              <View style={styles.needleCenter}>
                <Ionicons name="location" size={20} color="#FFF" />
              </View>
            </Animated.View>
          </Animated.View>

          {/* Center info */}
          <View style={styles.centerInfo}>
            <Text style={styles.centerDeg}>{Math.round(qiblaDirection)}°</Text>
            <Text style={styles.centerLabel}>QIBLA</Text>
          </View>
        </View>

        <AccuracyBadge accuracy={accuracy} />

        {isAligned && (
          <Animated.View style={[styles.alignedBadge, { transform: [{ scale: alignedScale }] }]}>
            <Ionicons name="checkmark-circle" size={16} color="#FFF" />
            <Text style={styles.alignedText}>Aligned with Qibla</Text>
          </Animated.View>
        )}
      </View>

      {/* Info Cards */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <Ionicons name="navigate" size={20} color={C.gold} />
          <Text style={styles.infoValue}>{distance.toLocaleString()}</Text>
          <Text style={styles.infoLabel}>km to Makkah</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="location" size={20} color={C.coral} />
          <Text style={styles.infoValue}>{coordinate.latitude.toFixed(2)}°</Text>
          <Text style={styles.infoLabel}>Your Latitude</Text>
        </View>
      </View>

      <View style={styles.howToCard}>
        <Ionicons name="information-circle-outline" size={20} color={C.textSecondary} />
        <Text style={styles.howToText}>
          Hold your phone flat and rotate until the needle points to Qibla. The compass uses your device's magnetometer.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  header: { padding: 18, paddingTop: 60, backgroundColor: C.heroBg, alignItems: 'center' },
  title: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: C.textPrimary },
  subtitle: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 4 },

  compassContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  compass: {
    width: COMPASS_SIZE, height: COMPASS_SIZE, borderRadius: COMPASS_SIZE / 2,
    backgroundColor: C.bgSurface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: C.border
  },
  compassAligned: { borderColor: C.coral, shadowColor: C.coral, shadowOpacity: 0.2 },
  compassRing: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(232,130,107,0.08)' },
  ring1: { width: COMPASS_SIZE - 40, height: COMPASS_SIZE - 40 },
  ring2: { width: COMPASS_SIZE - 80, height: COMPASS_SIZE - 80 },
  ring3: { width: COMPASS_SIZE - 120, height: COMPASS_SIZE - 120 },

  degMarker: { position: 'absolute', width: COMPASS_SIZE - 30, height: 8, justifyContent: 'center', alignItems: 'flex-start' },
  degTick: { width: 6, height: 2, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1 },

  dirMarker: { position: 'absolute', width: COMPASS_SIZE - 50, height: 24, justifyContent: 'center', alignItems: 'flex-start' },
  dirText: { fontSize: 16, fontWeight: 'bold', color: C.textSecondary },
  dirNorth: { color: C.red, fontSize: 18 },

  needleWrap: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  needle: { width: 40, height: 160, justifyContent: 'center', alignItems: 'center' },
  needleTop: { position: 'absolute', top: 0, width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 70, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: C.coral },
  needleBottom: { position: 'absolute', bottom: 0, width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 70, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#DDD' },
  needleCenter: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.coral, justifyContent: 'center', alignItems: 'center', zIndex: 10 },

  centerInfo: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  centerDeg: { fontSize: 14, fontWeight: 'bold', color: C.textPrimary },
  centerLabel: { fontSize: 10, color: C.textMuted, letterSpacing: 2 },

  alignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.coral, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 16 },
  alignedText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  infoGrid: { flexDirection: 'row', paddingHorizontal: 18, gap: 12, marginBottom: 12 },
  infoCard: { flex: 1, backgroundColor: C.bgSurface, borderRadius: 16, padding: 16, alignItems: 'center'},
  infoValue: { fontSize: 18, fontWeight: 'bold', color: C.textPrimary, marginTop: 8 },
  infoLabel: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  howToCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.bgSurface, borderRadius: 16, padding: 16, marginHorizontal: 18, gap: 10 },
  howToText: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 20 }});
