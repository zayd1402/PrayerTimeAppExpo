import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { C } from '../types';

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && <Text style={styles.sectionLink}>{action}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted },
  sectionLink: { fontSize: 12, fontWeight: '500', color: C.gold },
});
