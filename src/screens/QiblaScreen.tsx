import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Vibration } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withRepeat, withSequence, Easing, runOnJS
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { iconName } from '../components/Icon';
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { C } from '../types';
import { calculateQiblaDirection, haversineDistance, bearingToCompassDirection } from '../services/PrayerService';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(width - 80, 300);

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface QiblaScreenProps {
  coordinate: Coordinate;
  compact?: boolean;
  showHeader?: boolean;
}

// ─── Accuracy Indicator ──────────────────────────────────────
function AccuracyBadge({ accuracy }: { accuracy: 'high' | 'medium' | 'low' | 'calibrating' }) {
  const colors = {
    high: { bg: C.primaryLight, text: C.primary, icon: 'checkmark-circle' },
    medium: { bg: C.goldPale, text: C.gold, icon: 'alert-circle' },
    low: { bg: C.primaryLight, text: C.red, icon: 'warning' },
    calibrating: { bg: C.goldPale, text: C.textSecondary, icon: 'refresh' }};
  const c = colors[accuracy];
  return (
    <View style={[accStyles.badge, { backgroundColor: c.bg }]}>
      <Ionicons name={iconName(c.icon)} size={14} color={c.text} />
      <Text style={[accStyles.text, { color: c.text }]}>
        {accuracy === 'calibrating' ? 'Calibrating...' : `${accuracy.charAt(0).toUpperCase() + accuracy.slice(1)} Accuracy`}
      </Text>
    </View>
  );
}

const accStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'center', marginTop: 12 },
  text: { fontSize: 13, fontFamily: 'Jost_600SemiBold' }});

// ─── Calibration Overlay ─────────────────────────────────────
function CalibrationOverlay({ visible }: { visible: boolean }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) })
        ),
        -1, // infinite
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [visible]);

  const animatedPhoneStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 30 - 15}deg` }]
  }));

  if (!visible) return null;

  return (
    <View style={calStyles.overlay}>
      <Animated.View style={[calStyles.phone, animatedPhoneStyle]}>
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
  title: { fontSize: 18, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginBottom: 8 },
  desc: { fontSize: 14, color: C.textSecondary }});

// ─── Main Screen ─────────────────────────────────────────────
export default function QiblaScreen({ coordinate, compact = false, showHeader = true }: QiblaScreenProps) {
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low' | 'calibrating'>('calibrating');
  const [isAligned, setIsAligned] = useState(false);
  const [distance, setDistance] = useState(0);

  const rotationAnim = useSharedValue(0);
  const alignedAnim = useSharedValue(0);

  // JS-thread wrappers for state updates from heading callback
  const updateAccuracy = (a: typeof accuracy) => setAccuracy(a);
  const updateRotation = (r: number) => setRotation(r);
  const updateIsAligned = (a: boolean) => setIsAligned(a);

  useEffect(() => {
    const qibla = calculateQiblaDirection(coordinate.latitude, coordinate.longitude);
    setQiblaDirection(qibla);
    const dist = haversineDistance(coordinate.latitude, coordinate.longitude, 21.4225, 39.8262);
    setDistance(dist);
  }, [coordinate]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let headingHistory: number[] = [];

    async function startCompass() {
      await activateKeepAwakeAsync();
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setAccuracy('low');
          return;
        }

        setAccuracy('calibrating');
        setTimeout(() => setAccuracy('high'), 2000);

        subscription = await Location.watchHeadingAsync((heading) => {
          const magHeading = heading.magHeading;

          headingHistory.push(magHeading);
          if (headingHistory.length > 10) headingHistory.shift();
          const variance = Math.max(...headingHistory) - Math.min(...headingHistory);
          let newAccuracy: typeof accuracy = 'high';
          if (variance > 15) newAccuracy = 'low';
          else if (variance > 5) newAccuracy = 'medium';
          runOnJS(updateAccuracy)(newAccuracy);

          const relative = (qiblaDirection - magHeading + 360) % 360;
          runOnJS(updateRotation)(relative);

          const aligned = relative < 8 || relative > 352;
          runOnJS(updateIsAligned)(aligned);
          if (aligned) {
            Vibration.vibrate(50);
            alignedAnim.value = withSpring(1, { damping: 15 });
          } else {
            alignedAnim.value = withTiming(0, { duration: 200 });
          }
        });
      } catch {
        setAccuracy('low');
      }
    }

    startCompass();
    return () => {
      subscription?.remove();
      deactivateKeepAwake();
    };
  }, [qiblaDirection]);

  // Smooth rotation animation
  useEffect(() => {
    rotationAnim.value = withSpring(rotation, { damping: 15, stiffness: 100 });
  }, [rotation]);

  const animatedNeedleStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotationAnim.value}deg` },
      { scale: 1 + alignedAnim.value * 0.15 }
    ]
  }));

  const animatedAlignedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + alignedAnim.value * 0.15 }]
  }));

  return (
    <View style={[styles.container, compact && { flex: 0 }]}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Qibla Direction</Text>
          <Text style={styles.subtitle}>{Math.round(qiblaDirection)}° {bearingToCompassDirection(qiblaDirection)} from North</Text>
        </View>
      )}

      <View style={[styles.compassContainer, compact && { flex: 0, paddingVertical: 10 }]}>
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
          {['N', 'E', 'S', 'W'].map((d) => {
            const angles: Record<string, number> = { N: 0, E: 90, S: 180, W: 270 };
            return (
              <View key={d} style={[styles.dirMarker, { transform: [{ rotate: `${angles[d]}deg` }] }]}>
                <Text style={[styles.dirText, d === 'N' && styles.dirNorth]}>{d}</Text>
              </View>
            );
          })}

          {/* Rotating needle */}
          <Animated.View style={[styles.needleWrap, animatedNeedleStyle]}>
            <View style={styles.needle}>
              <View style={styles.needleTop} />
              <View style={styles.needleBottom} />
            </View>
            <View style={styles.needleCenter}>
              <Ionicons name="location" size={20} color="#FFF" />
            </View>
          </Animated.View>

          {/* Center info */}
          <View style={styles.centerInfo}>
            <Text style={styles.centerDeg}>{Math.round(qiblaDirection)}°</Text>
            <Text style={styles.centerLabel}>QIBLA</Text>
          </View>
        </View>

        <AccuracyBadge accuracy={accuracy} />

        {isAligned && (
          <Animated.View style={[styles.alignedBadge, animatedAlignedStyle]}>
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
          <Ionicons name="location" size={20} color={C.primary} />
          <Text style={styles.infoValue}>{coordinate.latitude.toFixed(2)}°</Text>
          <Text style={styles.infoLabel}>Your Latitude</Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.howToCard}>
          <Ionicons name="information-circle-outline" size={20} color={C.textSecondary} />
          <Text style={styles.howToText}>
            Hold your phone flat and rotate until the needle points to Qibla. The compass uses your device's magnetometer.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  header: { padding: 18, backgroundColor: C.heroBg, alignItems: 'center' },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.goldPale },
  subtitle: { fontSize: 14, color: C.goldLight, fontFamily: 'Jost_400Regular', marginTop: 4 },

  compassContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  compass: {
    width: COMPASS_SIZE, height: COMPASS_SIZE, borderRadius: COMPASS_SIZE / 2,
    backgroundColor: C.bgSurface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: C.border
  },
  compassAligned: { borderColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.2 },
  compassRing: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(232,130,107,0.08)' },
  ring1: { width: COMPASS_SIZE - 40, height: COMPASS_SIZE - 40 },
  ring2: { width: COMPASS_SIZE - 80, height: COMPASS_SIZE - 80 },
  ring3: { width: COMPASS_SIZE - 120, height: COMPASS_SIZE - 120 },

  degMarker: { position: 'absolute', width: COMPASS_SIZE - 30, height: 8, justifyContent: 'center', alignItems: 'flex-start' },
  degTick: { width: 6, height: 2, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1 },

  dirMarker: { position: 'absolute', width: COMPASS_SIZE - 50, height: 24, justifyContent: 'center', alignItems: 'flex-start' },
  dirText: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textSecondary },
  dirNorth: { color: C.red, fontSize: 18 },

  needleWrap: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  needle: { width: 40, height: 160, justifyContent: 'center', alignItems: 'center' },
  needleTop: { position: 'absolute', top: 0, width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 70, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: C.primary },
  needleBottom: { position: 'absolute', bottom: 0, width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 70, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: C.border },
  needleCenter: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', zIndex: 10 },

  centerInfo: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  centerDeg: { fontSize: 14, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  centerLabel: { fontSize: 10, color: C.textMuted, letterSpacing: 2 },

  alignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 16 },
  alignedText: { color: '#FFF', fontSize: 14, fontFamily: 'Jost_600SemiBold' },

  infoGrid: { flexDirection: 'row', paddingHorizontal: 18, gap: 12, marginBottom: 12 },
  infoCard: { flex: 1, backgroundColor: C.bgSurface, borderRadius: 16, padding: 16, alignItems: 'center'},
  infoValue: { fontSize: 18, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginTop: 8 },
  infoLabel: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  howToCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.bgSurface, borderRadius: 16, padding: 16, marginHorizontal: 18, gap: 10 },
  howToText: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 20 }
});