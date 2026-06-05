import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Vibration, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { C } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from '../components/Button';

const COMPASS_SIZE_DEFAULT = 300;

interface Coordinate { latitude: number; longitude: number; }
interface QiblaScreenProps { coordinate: Coordinate; }

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
  const dLon = toRadians(lat2 - lon1);
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
  const { c, type } = useTheme();
  const colors = {
    high:        { bg: c.emeraldPale, text: c.emerald, icon: 'checkmark-circle' },
    medium:      { bg: c.goldPale,   text: c.gold,   icon: 'alert-circle' },
    low:         { bg: '#FEE2E2',    text: c.red,    icon: 'warning' },
    calibrating: { bg: c.bgSurfaceVariant, text: c.blue, icon: 'refresh' },
  };
  const col = colors[accuracy];
  return (
    <View
      style={[styles.badge, { backgroundColor: col.bg }]}
      accessibilityRole="text"
      accessibilityLabel={`Compass accuracy: ${accuracy}`}
    >
      <Ionicons name={col.icon as any} size={14} color={col.text} />
      <Text style={[type.label, { color: col.text, fontWeight: '600' }]}>
        {accuracy === 'calibrating' ? 'Calibrating...' : `${accuracy.charAt(0).toUpperCase() + accuracy.slice(1)} Accuracy`}
      </Text>
    </View>
  );
}

// ─── Calibration Overlay ─────────────────────────────────────
function CalibrationOverlay({ visible }: { visible: boolean }) {
  const { c, type } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  if (!visible) return null;
  return (
    <View style={[styles.overlay, { backgroundColor: c.bgBase + 'F0' }]}>
      <Animated.View
        style={{
          transform: [{
            rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '15deg'] }),
          }],
          marginBottom: 20,
        }}
      >
        <Ionicons name="phone-portrait-outline" size={48} color={c.gold} />
      </Animated.View>
      <Text style={[type.headline, { color: c.textPrimary }]}>Calibrate Compass</Text>
      <Text style={[type.body, { color: c.textSecondary, marginTop: 8, textAlign: 'center', maxWidth: 280 }]}>
        Move your phone in a figure-8 motion to calibrate the magnetometer.
      </Text>
    </View>
  );
}

export default function QiblaScreen({ coordinate }: QiblaScreenProps) {
  const { c, type, radius, elevation } = useTheme();
  const { width } = useWindowDimensions();
  const COMPASS_SIZE = Math.min(width - 80, COMPASS_SIZE_DEFAULT);

  const [heading, setHeading] = useState(0);
  const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low' | 'calibrating'>('calibrating');
  const [aligned, setAligned] = useState(false);
  const lastHaptic = useRef<number>(0);
  const rotation = useRef(new Animated.Value(0)).current;

  const qiblaBearing = calculateQibla(coordinate.latitude, coordinate.longitude);
  const distance = haversine(coordinate.latitude, coordinate.longitude, MAKKAH_LAT, MAKKAH_LON);

  useEffect(() => {
    let sub: any;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchHeadingAsync(h => {
        setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading);
        if (h.accuracy <= 5) setAccuracy('high');
        else if (h.accuracy <= 15) setAccuracy('medium');
        else setAccuracy('low');
      });
    })();
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    // Smooth rotation animation
    Animated.spring(rotation, {
      toValue: -heading,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
    }).start();
  }, [heading]);

  useEffect(() => {
    // Haptic feedback when within ±5° of Qibla
    const diff = Math.abs(((heading - qiblaBearing + 540) % 360) - 180);
    if (diff < 5 && !aligned) {
      setAligned(true);
      Vibration.vibrate([0, 60, 60, 60]);
    } else if (diff >= 5 && aligned) {
      setAligned(false);
    }
  }, [heading, qiblaBearing]);

  return (
    <View style={[styles.container, { backgroundColor: c.bgBase }]}>
      <AccuracyBadge accuracy={accuracy} />

      <View
        style={[
          styles.compassWrap,
          { width: COMPASS_SIZE, height: COMPASS_SIZE, borderRadius: COMPASS_SIZE / 2 },
          elevation.level2,
        ]}
        accessibilityLabel={`Qibla compass. Qibla is at ${Math.round(qiblaBearing)} degrees, ${bearingToDirection(qiblaBearing)}. Current heading ${Math.round(heading)} degrees. Distance to Makkah ${distance} kilometers.${aligned ? ' Aligned with Qibla.' : ''}`}
        accessibilityRole="image"
      >
        {/* Outer dial */}
        <View style={[styles.outerDial, {
          width: COMPASS_SIZE,
          height: COMPASS_SIZE,
          borderRadius: COMPASS_SIZE / 2,
          backgroundColor: c.bgSurface,
          borderColor: c.border,
        }]}>
          {/* Cardinal letters */}
          {(['N', 'E', 'S', 'W'] as const).map((d, i) => {
            const angle = i * 90;
            return (
              <Text
                key={d}
                style={[
                  styles.cardinal,
                  {
                    color: c.textMuted,
                    transform: [
                      { rotate: `${angle}deg` },
                      { translateY: -COMPASS_SIZE / 2 + 18 },
                    ],
                  },
                ]}
              >
                {d}
              </Text>
            );
          })}

          {/* Rotating dial with Qibla arrow */}
          <Animated.View
            style={[
              styles.dial,
              {
                width: COMPASS_SIZE - 24,
                height: COMPASS_SIZE - 24,
                borderRadius: (COMPASS_SIZE - 24) / 2,
                transform: [
                  { rotate: `${-heading}deg` },
                  { rotate: `${qiblaBearing}deg` },
                ],
              },
            ]}
          >
            <View style={[styles.qiblaArrow, { borderBottomColor: aligned ? c.emerald : c.gold }]}>
              <Ionicons
                name="navigate"
                size={COMPASS_SIZE * 0.18}
                color={aligned ? c.emerald : c.gold}
              />
            </View>
            <Text
              style={[
                styles.qiblaLabel,
                {
                  color: aligned ? c.emerald : c.gold,
                  top: COMPASS_SIZE * 0.32,
                },
              ]}
            >
              Qibla
            </Text>
          </Animated.View>
        </View>

        {/* Center dot */}
        <View style={[styles.centerDot, { backgroundColor: c.textPrimary }]} />

        <CalibrationOverlay visible={accuracy === 'low'} />
      </View>

      <View style={styles.infoRow}>
        <View style={[styles.infoCard, { backgroundColor: c.bgSurface, borderRadius: radius.md }]}>
          <Text style={[type.caption, { color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
            Direction
          </Text>
          <Text style={[type.headline, { color: c.textPrimary, fontVariant: ['tabular-nums'] }]}>
            {Math.round(qiblaBearing)}°
          </Text>
          <Text style={[type.label, { color: c.textSecondary }]}>{bearingToDirection(qiblaBearing)}</Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: c.bgSurface, borderRadius: radius.md }]}>
          <Text style={[type.caption, { color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
            Distance
          </Text>
          <Text style={[type.headline, { color: c.textPrimary, fontVariant: ['tabular-nums'] }]}>
            {distance.toLocaleString()}
          </Text>
          <Text style={[type.label, { color: c.textSecondary }]}>km to Makkah</Text>
        </View>
      </View>

      {aligned && (
        <View style={[styles.alignedBanner, { backgroundColor: c.emerald }]}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={[type.label, { color: '#FFF', fontWeight: '700' }]}>
            You're facing the Qibla
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'center', marginBottom: 24 },
  compassWrap: { alignItems: 'center', justifyContent: 'center' },
  outerDial: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, position: 'relative' },
  cardinal: { position: 'absolute', fontSize: 14, fontWeight: '700' },
  dial: { alignItems: 'center', justifyContent: 'flex-start', position: 'relative' },
  qiblaArrow: { paddingTop: 8, alignItems: 'center' },
  qiblaLabel: { position: 'absolute', fontSize: 12, fontWeight: '700' },
  centerDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 100, borderRadius: 999 },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 32, width: '100%' },
  infoCard: { flex: 1, padding: 16, alignItems: 'center' },
  alignedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, marginTop: 24 },
});
