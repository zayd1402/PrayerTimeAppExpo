// Shared building blocks for every screen, so titles, ticks, pills and cards look the same everywhere.
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, StyleProp, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { Glyph, GlyphName } from './Glyph';
import { F } from './palette';
import type { RootStackParamList } from '../navigation/routes';

export function tapHaptic() {
  Haptics.selectionAsync().catch(() => {});
}

/** Round button that opens Settings. Sits at the top right of every tab. */
export function ProfileButton({ background, color }: { background?: string; color?: string }) {
  const C = useTokens();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Pressable
      onPress={() => navigation.navigate('settings')}
      accessibilityRole="button"
      accessibilityLabel="Profile and settings"
      hitSlop={6}
      style={({ pressed }) => [
        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: background ?? C.bgSurface },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Glyph name="user" size={19} color={color ?? C.textSecondary} />
    </Pressable>
  );
}

/** Large serif page title with the profile button, as on Habits, Qibla and Library. */
export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.pageTitle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitleText} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? <ProfileButton />}
    </View>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={[styles.sectionLabel, style]} accessibilityRole="header">{children}</Text>;
}

export function Surface({ children, style, tone = 'surface' }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: 'surface' | 'primary' | 'gold' }) {
  const C = useTokens();
  const bg = tone === 'primary' ? C.primaryLight : tone === 'gold' ? C.goldPale : C.bgSurface;
  return <View style={[{ backgroundColor: bg, borderRadius: 18, padding: 14 }, style]}>{children}</View>;
}

export type TickState = 'done' | 'qaza' | 'open' | 'future';

/** The circle at the end of each prayer row. 44px target, 28px circle. */
export function TickButton({ state, highlight, onPress, onLongPress, label }: {
  state: TickState; highlight?: boolean; onPress?: () => void; onLongPress?: () => void; label: string;
}) {
  const C = useTokens();
  const filled = state === 'done';
  const qaza = state === 'qaza';
  const future = state === 'future';
  return (
    <Pressable
      onPress={future ? undefined : onPress}
      onLongPress={future ? undefined : onLongPress}
      disabled={future}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: filled || qaza, disabled: future }}
      accessibilityLabel={label}
      accessibilityHint={future ? undefined : 'Long press for on time, qaza and khushu'}
      style={({ pressed }) => [{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, pressed && { opacity: 0.6 }]}
    >
      <View style={{
        width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        backgroundColor: filled ? C.primary : 'transparent',
        borderWidth: 1.8,
        borderStyle: future ? 'dashed' : 'solid',
        borderColor: filled ? C.primary : qaza ? C.qaza : highlight ? C.primary : C.textMuted + '99',
        opacity: future ? 0.6 : 1,
      }}>
        {filled && <Glyph name="check" size={14} color={C.onPrimary} strokeWidth={2.6} />}
        {qaza && <Glyph name="redo" size={13} color={C.qaza} strokeWidth={2.4} />}
      </View>
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, style, large }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle>; large?: boolean }) {
  const C = useTokens();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [{
        backgroundColor: C.primary, borderRadius: large ? 14 : 999, height: large ? 50 : 40,
        paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
      }, pressed && { opacity: 0.85 }, style]}
    >
      <Text style={{ color: C.onPrimary, fontFamily: F.semibold, fontSize: large ? 15 : 13.5 }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({ options, value, onChange, style }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.seg, style]} accessibilityRole="tablist">
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => { tapHaptic(); onChange(o.value); }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segBtn, on && styles.segBtnOn]}
          >
            <Text style={[styles.segText, on && styles.segTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Small donut used for tracker rows. */
export function MiniRing({ progress, color, size = 36, stroke = 5 }: { progress: number; color: string; size?: number; stroke?: number }) {
  const C = useTokens();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.bgCard} strokeWidth={stroke} fill="none" />
      {p > 0 && (
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - p)} strokeLinecap="round" />
      )}
    </Svg>
  );
}

/** A list row with an icon tile, title and chevron. */
export function LinkRow({ icon, title, subtitle, onPress }: { icon: GlyphName; title: string; subtitle?: string; onPress: () => void }) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.linkRow, pressed && { backgroundColor: C.surfacePressed }]}>
      <View style={styles.linkIcon}><Glyph name={icon} size={19} color={C.primaryDark} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.linkTitle}>{title}</Text>
        {subtitle ? <Text style={styles.linkSub}>{subtitle}</Text> : null}
      </View>
      <Glyph name="right" size={16} color={C.textMuted} />
    </Pressable>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  pageTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  pageTitleText: { fontFamily: F.display, fontSize: 30, lineHeight: 36, color: C.textPrimary },
  pageSubtitle: { fontFamily: F.body, fontSize: 13, color: C.textMuted, marginTop: 1 },
  sectionLabel: { fontFamily: F.semibold, fontSize: 13, color: C.textSecondary },
  seg: { flexDirection: 'row', backgroundColor: C.bgSurface, borderRadius: 999, padding: 3 },
  segBtn: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segBtnOn: { backgroundColor: C.bgBase, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segText: { fontFamily: F.medium, fontSize: 13, color: C.textSecondary },
  segTextOn: { fontFamily: F.semibold, color: C.textPrimary },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bgSurface, borderRadius: 14, paddingHorizontal: 12, minHeight: 56 },
  linkIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontFamily: F.medium, fontSize: 15, color: C.textPrimary },
  linkSub: { fontFamily: F.body, fontSize: 12, color: C.textMuted, marginTop: 1 },
});
