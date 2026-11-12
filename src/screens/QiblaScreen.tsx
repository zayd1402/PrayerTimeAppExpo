// Qibla compass. The dial turns with the phone so north on the dial matches real north, and the
// Kaaba marker sits at the Qibla bearing. When the phone points at it, the marker fills and it buzzes once.
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Vibration, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { calculateQiblaDirection, haversineDistance, bearingToCompassDirection } from '../services/PrayerService';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { Glyph } from '../design/Glyph';
import { F } from '../design/palette';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface QiblaScreenProps {
  coordinate: Coordinate;
  compact?: boolean;
  showHeader?: boolean;
}

type CompassState = 'starting' | 'live' | 'unavailable';

const DIRECTION_WORDS: Record<string, string> = {
  N: 'north', NE: 'north-east', E: 'east', SE: 'south-east', S: 'south', SW: 'south-west', W: 'west', NW: 'north-west',
};

export default function QiblaScreen({ coordinate, compact = false, showHeader = true }: QiblaScreenProps) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const size = Math.min(width - 72, 300);
  const qibla = calculateQiblaDirection(coordinate.latitude, coordinate.longitude);
  const distance = Math.round(haversineDistance(coordinate.latitude, coordinate.longitude, 21.4225, 39.8262));
  const [heading, setHeading] = useState<number | null>(null);
  const [state, setState] = useState<CompassState>('starting');
  const wasAligned = useRef(false);
  const dial = useSharedValue(0);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      activateKeepAwakeAsync().catch(() => {});
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setState('unavailable'); return; }
        sub = await Location.watchHeadingAsync(h => {
          if (cancelled) return;
          const value = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          setHeading(value);
          setState('live');
        });
      } catch {
        setState('unavailable');
      }
    })();
    const fallback = setTimeout(() => setState(s => (s === 'starting' ? 'unavailable' : s)), 4000);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
      sub?.remove();
      deactivateKeepAwake();
    };
  }, []);

  // Turn the dial the short way round so it never spins a full circle at 359° to 0°.
  useEffect(() => {
    if (heading === null) return;
    const target = -heading;
    const cur = dial.value;
    const delta = ((target - cur + 540) % 360) - 180;
    dial.value = withSpring(cur + delta, { damping: 18, stiffness: 120 });
  }, [heading, dial]);

  const offset = heading === null ? null : ((qibla - heading + 540) % 360) - 180;
  const aligned = offset !== null && Math.abs(offset) < 5;
  useEffect(() => {
    if (aligned && !wasAligned.current) Vibration.vibrate(40);
    wasAligned.current = aligned;
  }, [aligned]);

  const dialStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${dial.value}deg` }] }));

  const r = size / 2;
  const dirWord = DIRECTION_WORDS[bearingToCompassDirection(qibla)] ?? '';
  const hint = state === 'live'
    ? aligned ? 'You are facing the Qibla' : offset !== null ? `Turn ${offset > 0 ? 'right' : 'left'} ${Math.round(Math.abs(offset))}°` : ''
    : state === 'starting' ? 'Finding your heading…' : `Compass unavailable. Face ${Math.round(qibla)}° from north.`;

  return (
    <View style={[styles.container, !compact && { flex: 1 }]}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Qibla</Text>
        </View>
      )}

      <View style={styles.dialWrap} accessible accessibilityLabel={`Qibla is ${Math.round(qibla)} degrees ${dirWord}. ${hint}`}>
        {/* Fixed pointer at the top: where the phone is facing */}
        <View style={[styles.pointer, { borderBottomColor: aligned ? C.primary : C.textPrimary }]} />
        <Animated.View style={[{ width: size, height: size }, dialStyle]}>
          <Svg width={size} height={size}>
            <Circle cx={r} cy={r} r={r - 1} fill={C.bgSurface} stroke={C.border} strokeWidth={1} />
            <Circle cx={r} cy={r} r={r - 34} fill="none" stroke={C.border} strokeWidth={1} />
            {Array.from({ length: 72 }, (_, i) => {
              const major = i % 18 === 0;
              const mid = i % 6 === 0;
              const a = (i * 5 * Math.PI) / 180;
              const r1 = r - 8;
              const r2 = r - (major ? 22 : mid ? 18 : 13);
              return (
                <Line key={i}
                  x1={r + r1 * Math.sin(a)} y1={r - r1 * Math.cos(a)}
                  x2={r + r2 * Math.sin(a)} y2={r - r2 * Math.cos(a)}
                  stroke={major ? C.textSecondary : C.textMuted} strokeOpacity={major ? 1 : 0.5}
                  strokeWidth={major ? 2 : 1.2} strokeLinecap="round" />
              );
            })}
            {(['N', 'E', 'S', 'W'] as const).map((d, i) => {
              const a = (i * 90 * Math.PI) / 180;
              const rr = r - 48;
              return (
                <SvgText key={d} x={r + rr * Math.sin(a)} y={r - rr * Math.cos(a) + 6} fontSize={17}
                  fontFamily={F.semibold} fontWeight="600" textAnchor="middle" fill={d === 'N' ? C.red : C.textSecondary}>
                  {d}
                </SvgText>
              );
            })}
            {/* Qibla line and Kaaba marker */}
            <G>
              <Line
                x1={r} y1={r}
                x2={r + (r - 70) * Math.sin((qibla * Math.PI) / 180)} y2={r - (r - 70) * Math.cos((qibla * Math.PI) / 180)}
                stroke={C.primary} strokeWidth={3} strokeLinecap="round" />
              <Circle
                cx={r + (r - 70) * Math.sin((qibla * Math.PI) / 180)} cy={r - (r - 70) * Math.cos((qibla * Math.PI) / 180)}
                r={16} fill={aligned ? C.primary : C.bgBase} stroke={C.primary} strokeWidth={2.5} />
              <Circle cx={r} cy={r} r={6} fill={C.primary} />
            </G>
          </Svg>
          <View pointerEvents="none" style={[styles.kaaba, {
            left: r + (r - 70) * Math.sin((qibla * Math.PI) / 180) - 9,
            top: r - (r - 70) * Math.cos((qibla * Math.PI) / 180) - 9,
          }]}>
            <Glyph name="kaaba" size={18} color={aligned ? C.onPrimary : C.primaryDark} strokeWidth={2} />
          </View>
        </Animated.View>
      </View>

      <View style={styles.readout}>
        <Text style={styles.deg}>{Math.round(qibla)}°</Text>
        <Text style={styles.degSub}>from north, towards the {dirWord}</Text>
        <View style={[styles.hint, aligned && { backgroundColor: C.primary }]}>
          <Text style={[styles.hintText, aligned && { color: C.onPrimary }]}>{hint}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{distance.toLocaleString()} km</Text>
          <Text style={styles.statLbl}>to Makkah</Text>
        </View>
        {state === 'live' && heading !== null && (
          <View style={styles.stat}>
            <Text style={styles.statNum}>{Math.round(heading)}°</Text>
            <Text style={styles.statLbl}>you are facing</Text>
          </View>
        )}
      </View>

      {!compact && (
        <Text style={styles.howTo}>Hold your phone flat, away from metal. If the compass seems off, move it in a figure 8.</Text>
      )}
    </View>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  container: { backgroundColor: C.bgBase, gap: 14 },
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4 },
  title: { fontSize: 30, lineHeight: 36, fontFamily: F.display, color: C.textPrimary },
  dialWrap: { alignItems: 'center', paddingTop: 14 },
  pointer: {
    width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 14,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', marginBottom: 4,
  },
  kaaba: { position: 'absolute', width: 18, height: 18 },
  readout: { alignItems: 'center', gap: 2 },
  deg: { fontFamily: F.display, fontSize: 40, lineHeight: 46, color: C.textPrimary },
  degSub: { fontFamily: F.body, fontSize: 14, color: C.textMuted },
  hint: { marginTop: 10, backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  hintText: { fontFamily: F.medium, fontSize: 13.5, color: C.primaryDark, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: C.bgSurface, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  statNum: { fontFamily: F.semibold, fontSize: 16, color: C.textPrimary },
  statLbl: { fontFamily: F.body, fontSize: 12, color: C.textMuted },
  howTo: { fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.textMuted, textAlign: 'center', paddingHorizontal: 12 },
});
