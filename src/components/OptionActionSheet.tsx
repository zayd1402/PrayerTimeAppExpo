import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { C } from '../types';

export type OptionSheetItem<T extends string> = {
  label: string;
  value: T;
  description?: string;
};

export function OptionActionSheet<T extends string>({
  visible,
  title,
  subtitle,
  options,
  selectedValue,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: OptionSheetItem<T>[];
  selectedValue: T;
  onClose: () => void;
  onSelect: (value: T) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.72}>
              <Ionicons name="close" size={18} color={C.navy} />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            {options.map(option => {
              const selected = option.value === selectedValue;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                  onPress={() => onSelect(option.value)}
                  activeOpacity={0.72}
                >
                  <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                    <Ionicons name={selected ? 'checkmark' : 'ellipse-outline'} size={16} color={selected ? C.bgSurface : C.textMuted} />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text>
                    {option.description ? <Text style={styles.optionDescription}>{option.description}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,26,53,0.28)', padding: 14 },
  sheet: { borderRadius: 28, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)', padding: 16, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.14, shadowRadius: 26 }, android: { elevation: 10 } }) },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(7,26,53,0.14)', marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '900', color: C.navy },
  subtitle: { fontSize: 12, fontWeight: '600', color: C.textMuted, marginTop: 4 },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.goldPale },
  options: { gap: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(7,26,53,0.02)', padding: 12 },
  optionRowSelected: { backgroundColor: C.emeraldPale, borderColor: 'rgba(11,122,83,0.18)' },
  optionIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,26,53,0.05)' },
  optionIconSelected: { backgroundColor: C.emerald },
  optionCopy: { flex: 1 },
  optionLabel: { fontSize: 14, fontWeight: '800', color: C.navy },
  optionLabelSelected: { color: C.emerald },
  optionDescription: { fontSize: 11, fontWeight: '600', color: C.textMuted, marginTop: 3 },
});
