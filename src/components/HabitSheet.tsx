// Adding a habit (or a ladder step's habits) and looking at one later. Every habit is tied to a
// prayer and starts with the person's own intention.
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { useHabits } from '../context/HabitsContext';
import { Glyph } from '../design/Glyph';
import { F } from '../design/palette';
import { PrimaryButton, Segmented, tapHaptic } from '../design/ui';
import { CATEGORY_GLYPH, ConsistencyMeter, IntentionCard, categoryColors } from '../design/habitsUi';
import {
  ANCHOR_NAMES, AnchorPrayer, CATEGORY_NAMES, Habit, HabitCategory, HabitDraft, MAX_PER_PRAYER, MIN_METER_DAYS, habitKept,
} from '../design/journey';
import { Field, GhostButton, Sheet } from './Sheet';

const ANCHORS: AnchorPrayer[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type HabitSheetState =
  | { mode: 'add'; drafts: HabitDraft[]; title?: string }
  | { mode: 'view'; habitId: string }
  | null;

export default function HabitSheet({ state, onClose }: { state: HabitSheetState; onClose: () => void }) {
  if (!state) return null;
  return state.mode === 'add'
    ? <AddHabit drafts={state.drafts} heading={state.title} onClose={onClose} />
    : <ViewHabit habitId={state.habitId} onClose={onClose} />;
}

function AddHabit({ drafts, heading, onClose }: { drafts: HabitDraft[]; heading?: string; onClose: () => void }) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const { habits, addHabits } = useHabits();
  const single = drafts.length <= 1;
  const base = drafts[0] ?? { title: '', anchor: 'fajr' as AnchorPrayer, category: 'dhikr' as HabitCategory };
  const [title, setTitle] = useState(base.title);
  const [detail, setDetail] = useState(base.detail ?? '');
  const [category, setCategory] = useState<HabitCategory>(base.category);
  const [anchor, setAnchor] = useState<AnchorPrayer>(base.anchor);
  const [intention, setIntention] = useState('');
  const [plan, setPlan] = useState('');

  const count = (a: AnchorPrayer) => habits.filter(h => h.anchor === a).length;
  useEffect(() => {
    // Start on a prayer with room, so the default choice can always be saved.
    if (single && count(anchor) >= MAX_PER_PRAYER) {
      const free = ANCHORS.find(a => count(a) < MAX_PER_PRAYER);
      if (free) setAnchor(free);
    }
  }, []);

  const full = single && count(anchor) >= MAX_PER_PRAYER;
  const skipped = single ? [] : drafts.filter(d => count(d.anchor) >= MAX_PER_PRAYER);
  const canSave = single ? title.trim().length > 0 && !full : skipped.length < drafts.length;

  const save = () => {
    if (!canSave) return;
    tapHaptic();
    const extra = { intention: intention.trim() || undefined, plan: plan.trim() || undefined };
    if (single) addHabits([{ ...base, title: title.trim(), detail: detail.trim() || undefined, category, anchor, ...extra }]);
    else addHabits(drafts.map(d => ({ ...d, ...extra })));
    onClose();
  };

  return (
    <Sheet visible title={heading ?? (single ? 'New habit' : 'Your next step')} subtitle="Tied to a prayer you already pray" onClose={onClose}>
      {single ? (
        <>
          <Field label="What will you do?" value={title} onChangeText={setTitle} placeholder="One page of Quran" maxLength={48} returnKeyType="next" />
          <Field label="How much" optional value={detail} onChangeText={setDetail} placeholder="5 minutes" maxLength={40} />
          <View style={{ gap: 8 }}>
            <Text style={styles.q}>After which prayer?</Text>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {ANCHORS.map(a => {
                const on = a === anchor;
                const disabled = count(a) >= MAX_PER_PRAYER;
                return (
                  <Pressable
                    key={a}
                    disabled={disabled}
                    onPress={() => { tapHaptic(); setAnchor(a); }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on, disabled }}
                    accessibilityLabel={`${ANCHOR_NAMES[a]}${disabled ? ', already has three habits' : ''}`}
                    style={[styles.chip, on && styles.chipOn, disabled && { opacity: 0.45 }]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{ANCHOR_NAMES[a]}</Text>
                  </Pressable>
                );
              })}
            </View>
            {full ? <Text style={styles.hint}>Three habits is the most for one prayer. Try another prayer.</Text> : null}
          </View>
          <View style={{ gap: 8 }}>
            <Text style={styles.q}>Kind</Text>
            <Segmented<HabitCategory>
              value={category}
              onChange={setCategory}
              options={(['salah', 'quran', 'dhikr'] as HabitCategory[]).map(c => ({ value: c, label: CATEGORY_NAMES[c] }))}
            />
          </View>
        </>
      ) : (
        <View style={{ gap: 6 }}>
          {drafts.map((d, i) => {
            const cat = categoryColors(C, d.category);
            const skip = count(d.anchor) >= MAX_PER_PRAYER;
            return (
              <View key={i} style={[styles.preview, skip && { opacity: 0.5 }]}>
                <View style={[styles.disc, { backgroundColor: cat.pale }]}><Glyph name={CATEGORY_GLYPH[d.category]} size={15} color={cat.ink} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewTitle}>{d.title}</Text>
                  <Text style={styles.hint}>{skip ? `${ANCHOR_NAMES[d.anchor]} already has three habits` : `After ${ANCHOR_NAMES[d.anchor]}`}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <Field
        label="Your intention"
        optional
        value={intention}
        onChangeText={setIntention}
        placeholder="Why you want to keep this, in your own words"
        multiline
        maxLength={160}
      />
      <Field label="When exactly" optional value={plan} onChangeText={setPlan} placeholder="Straight after the salam, before my phone" maxLength={80} />
      <PrimaryButton label={single ? 'Add habit' : 'Add these habits'} onPress={save} large style={!canSave && { opacity: 0.5 }} />
      <GhostButton label="Not now" onPress={onClose} />
    </Sheet>
  );
}

function ViewHabit({ habitId, onClose }: { habitId: string; onClose: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { habits, log, updateHabit, removeHabit } = useHabits();
  const habit: Habit | undefined = habits.find(h => h.id === habitId);
  const [intention, setIntention] = useState(habit?.intention ?? '');
  const [confirm, setConfirm] = useState(false);
  if (!habit) return null;
  const stats = habitKept(habit, log);
  const edited = intention.trim() !== (habit.intention ?? '');

  return (
    <Sheet visible title={habit.title} subtitle={`After ${ANCHOR_NAMES[habit.anchor]} · ${CATEGORY_NAMES[habit.category]}${habit.detail ? ` · ${habit.detail}` : ''}`} onClose={onClose}>
      {habit.intention && !edited ? <IntentionCard intention={habit.intention} plan={habit.plan} /> : null}
      {stats.days >= MIN_METER_DAYS ? (
        <ConsistencyMeter label="Kept" rate={stats.days ? stats.kept / stats.days : 0} window={`${stats.kept} of the last ${stats.days} days`} category={habit.category} />
      ) : (
        <Text style={styles.hint}>{stats.kept ? `Kept ${stats.kept} of ${Math.max(stats.days, 1)} days so far.` : 'Tick it on Today when you have done it.'} Your 30-day rate shows after a week.</Text>
      )}
      <Field
        label={habit.intention ? 'Change your intention' : 'Your intention'}
        optional
        value={intention}
        onChangeText={setIntention}
        placeholder="Why you want to keep this, in your own words"
        multiline
        maxLength={160}
      />
      {edited ? <PrimaryButton label="Save" large onPress={() => { updateHabit(habit.id, { intention: intention.trim() || undefined }); onClose(); }} /> : null}
      {confirm ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.hint}>Remove this habit? What you kept stays in your history.</Text>
          <PrimaryButton label="Remove habit" large onPress={() => { removeHabit(habit.id); onClose(); }} />
          <GhostButton label="Keep it" onPress={() => setConfirm(false)} />
        </View>
      ) : (
        <GhostButton label="Remove habit" onPress={() => setConfirm(true)} />
      )}
    </Sheet>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  q: { fontFamily: F.semibold, fontSize: 14, color: C.textPrimary },
  hint: { fontFamily: F.body, fontSize: 12.5, lineHeight: 18, color: C.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 999, backgroundColor: C.bgSurface, borderWidth: 1.5, borderColor: 'transparent', justifyContent: 'center' },
  chipOn: { backgroundColor: C.primaryLight, borderColor: C.primary },
  chipText: { fontFamily: F.medium, fontSize: 14, color: C.textSecondary },
  chipTextOn: { fontFamily: F.semibold, color: C.textPrimary },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bgSurface, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 },
  disc: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontFamily: F.medium, fontSize: 14.5, color: C.textPrimary },
});
