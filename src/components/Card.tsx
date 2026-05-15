import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { C } from '../types';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.bgSurface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },
});
