// Bottom sheet for marking one prayer: on time or qaza, plus an optional khushu' rating.
// Opens on a long press, or when a prayer that's already ticked is tapped.
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KhushuLevel, PrayerId } from '../types';
import { addKhushuEntry } from '../services/StorageService';
import { getLocalDateKey } from '../utils/date';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { F } from '../design/palette';
import { PrimaryButton, tapHaptic } from '../design/ui';

type Mark = 'prayed' | 'qaza';

interface MarkSheetProps {
  prayer: { id: PrayerId; name: string } | null;
  /** "Started 12:41 PM, open until 4:23 PM" */
  window?: string;
  current?: Mark | 'missed';
  onSave: (id: PrayerId, status: Mark) => void;
  onClear: (id: PrayerId) => void;
  onClose: () => void;
}

const SCALE: KhushuLevel[] = [1, 2, 3, 4, 5];

export default function MarkSheet({ prayer, window, current, onSave, onClear, onClose }: MarkSheetProps) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [mark, setMark] = useState<Mark>('prayed');
  const [level, setLevel] = useState<KhushuLevel | null>(null);

  useEffect(() => {
    if (prayer) {
      setMark(current === 'qaza' || current === 'missed' ? 'qaza' : 'prayed');
      setLevel(null);
    }
  }, [prayer, current]);

  if (!prayer) return null;

  const save = () => {
    onSave(prayer.id, mark);
    if (level) {
      addKhushuEntry({
        date: getLocalDateKey(), prayerId: prayer.id, level, distractions: [],
        prePrayerPrep: { wuduPresence: false, arrivedEarly: false, recitedAdhkar: false },
      }).catch(() => {});
    }
    onClose();
  };

  const logged = current === 'prayed' || current === 'qaza';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]} accessibilityViewIsModal>
        <View style={styles.grab} />
        <View>
          <Text style={styles.title} accessibilityRole="header">{prayer.name}</Text>
          {window ? <Text style={styles.sub}>{window}</Text> : null}
        </View>

        <View style={styles.opts} accessibilityRole="radiogroup">
          {([
            { v: 'prayed' as const, title: 'On time', sub: 'Within its time' },
            { v: 'qaza' as const, title: 'Qaza', sub: 'Made up later' },
          ]).map(o => {
            const on = mark === o.v;
            return (
              <Pressable
                key={o.v}
                onPress={() => { tapHaptic(); setMark(o.v); }}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={[styles.opt, on && styles.optOn]}
              >
                <Text style={styles.optTitle}>{o.title}</Text>
                <Text style={styles.optSub}>{o.sub}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={styles.q}>How present did you feel? <Text style={styles.qMuted}>Optional</Text></Text>
          <View style={styles.scale}>
            {SCALE.map(n => {
              const on = level === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => { tapHaptic(); setLevel(on ? null : n); }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`Khushu ${n} of 5`}
                  style={[styles.scaleBtn, on && { backgroundColor: C.goldPale, borderColor: C.gold }]}
                >
                  <Text style={[styles.scaleText, on && { color: C.gold, fontFamily: F.semibold }]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabel}>Distracted</Text>
            <Text style={styles.scaleLabel}>Fully present</Text>
          </View>
        </View>

        <PrimaryButton label="Save" onPress={save} large />
        {logged ? (
          <Pressable onPress={() => { onClear(prayer.id); onClose(); }} accessibilityRole="button" style={styles.ghost}>
            <Text style={styles.ghostText}>Clear this prayer</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.ghost}>
            <Text style={styles.ghostText}>Not now</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,10,6,0.5)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.bgBase,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, gap: 16,
  },
  grab: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.textMuted + '80', alignSelf: 'center' },
  title: { fontFamily: F.display, fontSize: 28, color: C.textPrimary },
  sub: { fontFamily: F.body, fontSize: 13, color: C.textMuted, marginTop: 2 },
  opts: { flexDirection: 'row', gap: 8 },
  opt: { flex: 1, borderRadius: 14, padding: 12, backgroundColor: C.bgSurface, borderWidth: 1.5, borderColor: 'transparent', minHeight: 60 },
  optOn: { borderColor: C.primary, backgroundColor: C.primaryLight },
  optTitle: { fontFamily: F.semibold, fontSize: 15, color: C.textPrimary },
  optSub: { fontFamily: F.body, fontSize: 12, color: C.textMuted, marginTop: 2 },
  q: { fontFamily: F.semibold, fontSize: 14, color: C.textPrimary },
  qMuted: { fontFamily: F.body, color: C.textMuted },
  scale: { flexDirection: 'row', gap: 6 },
  scaleBtn: { flex: 1, height: 46, borderRadius: 12, backgroundColor: C.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  scaleText: { fontFamily: F.medium, fontSize: 14, color: C.textSecondary },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleLabel: { fontFamily: F.body, fontSize: 11.5, color: C.textMuted },
  ghost: { alignItems: 'center', paddingVertical: 6 },
  ghostText: { fontFamily: F.medium, fontSize: 14, color: C.textSecondary },
});
