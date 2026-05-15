import React from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { C, PrayerTime } from '../types';

export function PrayerActionSheet({
  prayer,
  visible,
  context,
  onClose,
  onDone,
  onQaza,
}: {
  prayer: PrayerTime | null;
  visible: boolean;
  context: string;
  onClose: () => void;
  onDone: () => void;
  onQaza: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissLayer} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="checkmark-circle-outline" size={22} color={C.gold} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{prayer ? `Mark ${prayer.name}` : 'Mark prayer'}</Text>
              <Text style={styles.subtitle}>{context}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.doneButton]} activeOpacity={0.76} onPress={onDone}>
              <Ionicons name="checkmark-circle" size={19} color={C.bgSurface} />
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.76} onPress={onQaza}>
              <Ionicons name="time-outline" size={19} color={C.navy} />
              <Text style={styles.actionText}>Qaza</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.76} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,26,53,0.28)' },
  dismissLayer: { ...StyleSheet.absoluteFillObject },
  sheet: { margin: 14, borderRadius: 28, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)', padding: 18, paddingBottom: Platform.OS === 'ios' ? 24 : 18, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 30 }, android: { elevation: 10 } }) },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(7,26,53,0.14)', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8E9', borderWidth: 1, borderColor: 'rgba(184,132,32,0.18)', marginRight: 12 },
  headerCopy: { flex: 1 },
  title: { fontSize: 20, fontWeight: '900', color: C.navy },
  subtitle: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, minHeight: 52, borderRadius: 18, backgroundColor: C.goldPale, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  doneButton: { backgroundColor: C.emerald },
  actionText: { fontSize: 15, fontWeight: '900', color: C.navy },
  doneText: { fontSize: 15, fontWeight: '900', color: C.bgSurface },
  cancelButton: { minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, backgroundColor: 'rgba(7,26,53,0.05)' },
  cancelText: { fontSize: 14, fontWeight: '800', color: C.textSecondary },
});
