import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Modal, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, PrayerId, KhushuLevel, DistractionType, KhushuEntry } from '../types';
import { addKhushuEntry } from '../services/StorageService';

const LEVELS: { value: KhushuLevel; label: string }[] = [
  { value: 1, label: 'Scattered' },
  { value: 2, label: 'Distracted' },
  { value: 3, label: 'Present' },
  { value: 4, label: 'Focused' },
  { value: 5, label: 'Deep khushu' },
];

const DISTRACTIONS: { value: DistractionType; label: string; icon: string }[] = [
  { value: 'phone', label: 'Phone', icon: 'phone-portrait-outline' },
  { value: 'noise', label: 'Noise', icon: 'volume-high-outline' },
  { value: 'thoughts', label: 'Wandering thoughts', icon: 'bulb-outline' },
  { value: 'tired', label: 'Tired', icon: 'bed-outline' },
  { value: 'rushed', label: 'Rushed', icon: 'time-outline' },
  { value: 'none', label: 'None alhamdulillah', icon: 'happy-outline' },
];

interface Props {
  visible: boolean;
  prayerId: PrayerId;
  prayerName: string;
  onClose: () => void;
}

export default function KhushuModal({ visible, prayerId, prayerName, onClose }: Props) {
  const [level, setLevel] = useState<KhushuLevel>(3);
  const [distractions, setDistractions] = useState<DistractionType[]>([]);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const toggleDistraction = (d: DistractionType) => {
    setDistractions(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d],
    );
  };

  const handleSave = async () => {
    const date = new Date().toISOString().split('T')[0];
    const entry: KhushuEntry = {
      date,
      prayerId,
      level,
      distractions,
      prePrayerPrep: { wuduPresence: true, arrivedEarly: false, recitedAdhkar: false },
      note: note || undefined,
    };
    await addKhushuEntry(entry);
    setSaved(true);
  };

  if (saved) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Ionicons name="checkmark-circle" size={48} color={C.primary} />
            <Text style={styles.savedTitle}>JazakAllah Khair</Text>
            <Text style={styles.savedText}>Your khushu' rating helps track your spiritual journey</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => { setSaved(false); setLevel(3); setDistractions([]); setNote(''); onClose(); }}>
              <Text style={styles.closeBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.xBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={C.textMuted} />
          </TouchableOpacity>

          <Text style={styles.title}>Rate your {prayerName}</Text>
          <Text style={styles.subtitle}>How was your concentration?</Text>

          <View style={styles.stars}>
            {LEVELS.map(l => (
              <TouchableOpacity
                key={l.value}
                style={[styles.starBtn, level >= l.value && styles.starActive]}
                onPress={() => setLevel(l.value)}
              >
                <Text style={[styles.starEmoji, level >= l.value && styles.starEmojiActive]}>
                  {l.value === 1 ? '😐' : l.value === 2 ? '🙂' : l.value === 3 ? '😊' : l.value === 4 ? '😌' : '🤲'}
                </Text>
                <Text style={[styles.starLabel, level >= l.value && styles.starLabelActive]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>What distracted you? (tap all that apply)</Text>
          <View style={styles.distractions}>
            {DISTRACTIONS.map(d => {
              const selected = distractions.includes(d.value);
              return (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.distractionChip, selected && styles.distractionChipActive]}
                  onPress={() => toggleDistraction(d.value)}
                >
                  <Ionicons name={d.icon as any} size={14} color={selected ? C.white : C.textSecondary} />
                  <Text style={[styles.distractionText, selected && styles.distractionTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.noteInput}
            placeholder="Optional note..."
            placeholderTextColor={C.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="save-outline" size={18} color={C.white} />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: C.bgBase, borderRadius: 24, padding: 24, alignItems: 'center' },
  xBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  title: { fontSize: 20, fontFamily: 'BodoniModa_700Bold', color: C.textPrimary, marginTop: 8 },
  subtitle: { fontSize: 14, color: C.textSecondary, marginTop: 4, marginBottom: 20 },

  stars: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  starBtn: { alignItems: 'center', padding: 8, borderRadius: 12, backgroundColor: C.bgSurface, width: 56 },
  starActive: { backgroundColor: C.primaryLight },
  starEmoji: { fontSize: 22 },
  starEmojiActive: {},
  starLabel: { fontSize: 9, color: C.textMuted, marginTop: 4, textAlign: 'center' },
  starLabelActive: { color: C.textPrimary, fontFamily: 'Jost_600SemiBold' },

  sectionLabel: { fontSize: 13, color: C.textSecondary, fontFamily: 'Jost_600SemiBold', alignSelf: 'flex-start', marginBottom: 8 },
  distractions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  distractionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: C.bgSurface },
  distractionChipActive: { backgroundColor: C.primary },
  distractionText: { fontSize: 12, color: C.textSecondary, fontFamily: 'Jost_500Medium' },
  distractionTextActive: { color: C.white },

  noteInput: { backgroundColor: C.bgSurface, borderRadius: 12, padding: 12, fontSize: 14, color: C.textPrimary, width: '100%', minHeight: 50, marginBottom: 16 },

  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  saveBtnText: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.white },

  savedTitle: { fontSize: 18, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginTop: 12 },
  savedText: { fontSize: 13, color: C.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  closeBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32 },
  closeBtnText: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.white },
});
