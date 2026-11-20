// Building blocks for habits: the square habit tick, a habit under its prayer, the next-step and
// welcome-back cards, the person's intention, the 30-day meter, the ladder and the 40-day moment.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { Glyph, GlyphName } from './Glyph';
import { F, useHeatRamp } from './palette';
import { MiniRing, PrimaryButton, tapHaptic } from './ui';
import type { Habit, HabitCategory, Rung } from './journey';
import { CATEGORY_NAMES } from './journey';

export const CATEGORY_GLYPH: Record<HabitCategory, GlyphName> = { salah: 'mosque', quran: 'quran', dhikr: 'beads' };

/** Fill, disc ground and ink for a habit category. A category is never shown by colour alone. */
export function categoryColors(C: Tokens, cat: HabitCategory): { fill: string; pale: string; ink: string } {
  if (cat === 'quran') return { fill: C.habitQuran, pale: C.habitQuranPale, ink: C.habitQuran };
  if (cat === 'dhikr') return { fill: C.habitDhikr, pale: C.goldPale, ink: C.gold };
  return { fill: C.habitSalah, pale: C.primaryLight, ink: C.primaryDark };
}

/** The 22px square tick on a habit. Square on purpose, so a habit never reads as one of the five prayers. */
export function HabitTick({ done, category, label, onPress, onLongPress }: {
  done: boolean; category: HabitCategory; label: string; onPress: () => void; onLongPress?: () => void;
}) {
  const C = useTokens();
  const { fill } = categoryColors(C, category);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
      style={({ pressed }) => [{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, pressed && { opacity: 0.6 }]}
    >
      <View style={{
        width: 22, height: 22, borderRadius: 7, borderWidth: 1.8, alignItems: 'center', justifyContent: 'center',
        borderColor: done ? fill : C.textMuted, backgroundColor: done ? fill : 'transparent',
      }}>
        {done && <Glyph name="check" size={12} color={C.onHabit} strokeWidth={2.6} />}
      </View>
    </Pressable>
  );
}

/** One habit under its prayer: category disc, name, optional detail, square tick. */
export function HabitItem({ habit, done, onToggle, onOpen }: { habit: Habit; done: boolean; onToggle: () => void; onOpen: () => void }) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const cat = categoryColors(C, habit.category);
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${habit.title}, ${CATEGORY_NAMES[habit.category]}. Opens details`}
      style={({ pressed }) => [styles.habit, pressed && { backgroundColor: C.surfacePressed }]}
    >
      <View style={[styles.habitCat, { backgroundColor: cat.pale }]}>
        <Glyph name={CATEGORY_GLYPH[habit.category]} size={15} color={cat.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.habitTitle, done && { color: C.textSecondary }]}>{habit.title}</Text>
        {habit.detail ? <Text style={styles.habitDetail}>{habit.detail}</Text> : null}
      </View>
      <HabitTick
        done={done}
        category={habit.category}
        label={`${habit.title}, ${done ? 'done today' : 'not done yet'}`}
        onPress={() => { tapHaptic(); onToggle(); }}
      />
    </Pressable>
  );
}

/** The one suggestion on Today for growing the routine. */
export function NextStepCard({ kicker = 'Your next small step', title, detail, action = 'Add', icon = 'steps', onPress }: {
  kicker?: string; title: string; detail?: string; action?: string; icon?: GlyphName; onPress: () => void;
}) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.next}>
      <View style={styles.iconTile}><Glyph name={icon} size={19} color={C.primaryDark} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.nextK}>{kicker}</Text>
        <Text style={styles.nextTitle}>{title}</Text>
        {detail ? <Text style={styles.nextSub}>{detail}</Text> : null}
      </View>
      <PrimaryButton label={action} onPress={onPress} />
    </View>
  );
}

/** Shown after a few days without logging: a warm welcome and one small step. Never counts the gap. */
export function ReturnCard({ title, body, action, onAction, onDismiss }: {
  title: string; body: string; action?: string; onAction?: () => void; onDismiss: () => void;
}) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.ret}>
      <View style={styles.retK}>
        <Glyph name="redo" size={14} color={C.return} />
        <Text style={styles.retKText}>Welcome back</Text>
      </View>
      <Text style={styles.retTitle} accessibilityRole="header">{title}</Text>
      <Text style={styles.retBody}>{body}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {action && onAction ? <PrimaryButton label={action} onPress={onAction} /> : null}
        <Pressable onPress={onDismiss} accessibilityRole="button" hitSlop={8} style={styles.ghost}>
          <Text style={styles.ghostText}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** The person's own intention for a habit, in their words. */
export function IntentionCard({ intention, plan, kicker = 'Your intention' }: { intention: string; plan?: string; kicker?: string }) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.intent}>
      <View style={styles.intentRow}>
        <Glyph name="heart" size={14} color={C.gold} />
        <Text style={styles.intentK}>{kicker}</Text>
      </View>
      <Text style={styles.intentText}>{intention}</Text>
      {plan ? (
        <View style={styles.intentRow}>
          <Glyph name="clock" size={14} color={C.textSecondary} />
          <Text style={styles.intentPlan}>{plan}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** The 30-day rate in place of a streak. A missed day lowers it a little; it never resets. */
export function ConsistencyMeter({ label, rate, window = 'Last 30 days', trend = [], note, category = 'salah' }: {
  label: string; rate: number; window?: string; trend?: number[]; note?: string; category?: HabitCategory;
}) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const r = Math.max(0, Math.min(1, rate));
  const pct = Math.round(r * 100);
  const w = 120;
  const h = 28;
  // Scale the sparkline to its own range (at least 20 points), so a steady month still shows its shape.
  const lo = Math.min(...trend, 1);
  const hi = Math.max(...trend, 0);
  const span = Math.max(0.2, hi - lo);
  const base = Math.max(0, Math.min(lo, 1 - span));
  const pts = trend.map((v, i) => `${(i * (w / Math.max(1, trend.length - 1))).toFixed(1)},${(h - ((v - base) / span) * (h - 4) - 2).toFixed(1)}`).join(' ');
  return (
    <View style={styles.meter} accessible accessibilityLabel={`${label}, ${pct} percent, ${window}${note ? `. ${note}` : ''}`}>
      <View style={styles.meterHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.meterLabel}>{label}</Text>
          <Text style={styles.meterSub}>{window}</Text>
        </View>
        <Text style={styles.meterNum}>{pct}<Text style={styles.meterPct}>%</Text></Text>
      </View>
      <View style={styles.meterTrack}>
        <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: categoryColors(C, category).fill }} />
      </View>
      {(note || trend.length > 1) && (
        <View style={styles.meterFoot}>
          <Text style={styles.meterNote}>{note ?? ''}</Text>
          {trend.length > 1 && (
            <Svg width={w} height={h}>
              <Polyline points={pts} fill="none" stroke={C.primaryDark} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </View>
      )}
    </View>
  );
}

/** The path from the obligatory to the extra, one step at a time. */
export function Ladder({ rungs, onBegin }: { rungs: Rung[]; onBegin: (index: number) => void }) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const heat = useHeatRamp();
  return (
    <View style={{ gap: 6 }} accessibilityRole="list">
      {rungs.map((s, i) => {
        const step = Math.min(5, i + 2);
        const locked = s.state === 'locked';
        const current = s.state === 'current';
        const content = (
          <>
            <View style={[
              styles.rungMark,
              locked ? styles.rungMarkLocked : { backgroundColor: heat.fills[step] },
            ]}>
              {s.state === 'kept'
                ? <Glyph name="check" size={13} color={heat.inks[step]} strokeWidth={2.4} />
                : <Text style={[styles.rungNum, { color: locked ? C.textMuted : heat.inks[step] }]}>{i + 1}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rungTitle, current && { fontFamily: F.semibold }, locked && { color: C.textSecondary }]}>{s.title}</Text>
              <Text style={styles.rungSub}>{s.detail}</Text>
            </View>
            {current && !s.needsHabits && s.progress != null ? <MiniRing progress={s.progress} color={C.primary} size={32} stroke={4} /> : null}
            {current && s.needsHabits ? <Glyph name="right" size={16} color={C.textMuted} /> : null}
          </>
        );
        const label = `Step ${i + 1}, ${s.title}, ${s.state === 'kept' ? 'kept' : current ? 'current' : 'not open yet'}. ${s.detail}`;
        if (current && s.needsHabits) {
          return (
            <Pressable key={s.title} onPress={() => { tapHaptic(); onBegin(i); }} accessibilityRole="button" accessibilityLabel={label}
              style={({ pressed }) => [styles.rung, styles.rungCurrent, pressed && { opacity: 0.8 }]}>
              {content}
            </Pressable>
          );
        }
        return (
          <View key={s.title} style={[styles.rung, current && styles.rungCurrent]} accessible accessibilityLabel={label}>
            {content}
          </View>
        );
      })}
    </View>
  );
}

/** A still, gold moment at 40 days of a habit, then the next step. No confetti, no sharing. */
export function MilestoneMoment({ days, title, body, next, onClose }: { days: number; title: string; body: string; next?: string; onClose: () => void }) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.milestone} accessibilityRole="summary" accessibilityLiveRegion="polite">
      <View style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={88} height={88} style={StyleSheet.absoluteFill}>
          <Circle cx={44} cy={44} r={34} fill="none" stroke={C.goldLight} strokeWidth={12} />
        </Svg>
        <Text style={styles.milestoneNum}>{days}</Text>
      </View>
      <Text style={styles.milestoneTitle} accessibilityRole="header">{title}</Text>
      <Text style={styles.milestoneBody}>{body}</Text>
      {next ? <Text style={styles.milestoneNext}>{next}</Text> : null}
      <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8} style={styles.ghost}>
        <Text style={styles.ghostText}>Close</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  habit: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingLeft: 8, backgroundColor: C.bgSurface, borderRadius: 12 },
  habitCat: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  habitTitle: { fontFamily: F.medium, fontSize: 14.5, lineHeight: 20, color: C.textPrimary },
  habitDetail: { fontFamily: F.body, fontSize: 12, lineHeight: 16, color: C.textMuted },
  iconTile: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  next: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bgSurface, borderRadius: 18, paddingVertical: 12, paddingLeft: 14, paddingRight: 12 },
  nextK: { fontFamily: F.semibold, fontSize: 12, color: C.primaryDark },
  nextTitle: { fontFamily: F.medium, fontSize: 15, color: C.textPrimary },
  nextSub: { fontFamily: F.body, fontSize: 12, lineHeight: 16, color: C.textMuted, marginTop: 1 },
  ret: { backgroundColor: C.returnPale, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, gap: 4 },
  retK: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  retKText: { fontFamily: F.semibold, fontSize: 12.5, color: C.return },
  retTitle: { fontFamily: F.display, fontSize: 22, lineHeight: 28, color: C.textPrimary },
  retBody: { fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.textSecondary, marginBottom: 8 },
  ghost: { paddingVertical: 6, minHeight: 32, justifyContent: 'center' },
  ghostText: { fontFamily: F.medium, fontSize: 14, color: C.textSecondary },
  intent: { backgroundColor: C.goldPale, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, gap: 6 },
  intentRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  intentK: { fontFamily: F.semibold, fontSize: 12.5, color: C.gold },
  intentText: { fontFamily: F.displayMedium, fontSize: 21, lineHeight: 28, color: C.textPrimary },
  intentPlan: { flex: 1, fontFamily: F.medium, fontSize: 13, color: C.textSecondary },
  meter: { backgroundColor: C.bgSurface, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  meterLabel: { fontFamily: F.semibold, fontSize: 15, color: C.textPrimary },
  meterSub: { fontFamily: F.body, fontSize: 12, color: C.textMuted, marginTop: 1 },
  meterNum: { fontFamily: F.display, fontSize: 36, lineHeight: 40, color: C.textPrimary, fontVariant: ['tabular-nums'] },
  meterPct: { fontSize: 20, color: C.textSecondary },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: C.bgCard, overflow: 'hidden' },
  meterFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  meterNote: { flex: 1, fontFamily: F.body, fontSize: 13, color: C.textSecondary },
  rung: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: C.bgSurface },
  rungCurrent: { backgroundColor: C.primaryLight, borderWidth: 1.5, borderColor: C.primary },
  rungMark: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rungMarkLocked: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.textMuted },
  rungNum: { fontFamily: F.semibold, fontSize: 13 },
  rungTitle: { fontFamily: F.medium, fontSize: 15, color: C.textPrimary },
  rungSub: { fontFamily: F.body, fontSize: 12, color: C.textMuted, marginTop: 1 },
  milestone: { backgroundColor: C.goldPale, borderRadius: 24, paddingTop: 26, paddingHorizontal: 20, paddingBottom: 14, alignItems: 'center', gap: 6 },
  milestoneNum: { fontFamily: F.display, fontSize: 30, color: C.textPrimary },
  milestoneTitle: { fontFamily: F.display, fontSize: 24, lineHeight: 30, color: C.textPrimary, marginTop: 6, textAlign: 'center' },
  milestoneBody: { fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.textSecondary, textAlign: 'center', maxWidth: 300 },
  milestoneNext: { fontFamily: F.semibold, fontSize: 13, color: C.gold, marginTop: 6, textAlign: 'center' },
});
