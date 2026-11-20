// A bottom sheet over a scrim, in the same shape as the mark sheet. Scrolls and moves above the
// keyboard, for sheets with text fields.
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { F } from '../design/palette';

export function Sheet({ visible, title, subtitle, onClose, children }: {
  visible: boolean; title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom, maxHeight: '92%' }]} accessibilityViewIsModal>
          <View style={styles.grab} />
          <ScrollView contentContainerStyle={{ gap: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View>
              <Text style={styles.title} accessibilityRole="header">{title}</Text>
              {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
            </View>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** A labelled text field on bgSurface; the border turns primaryDark while focused. */
export function Field({ label, optional, ...input }: TextInputProps & { label: string; optional?: boolean }) {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.q}>{label}{optional ? <Text style={styles.qMuted}> Optional</Text> : null}</Text>
      <TextInput
        {...input}
        accessibilityLabel={label}
        placeholderTextColor={C.textMuted}
        onFocus={e => { setFocused(true); input.onFocus?.(e); }}
        onBlur={e => { setFocused(false); input.onBlur?.(e); }}
        style={[styles.field, input.multiline && { minHeight: 64, textAlignVertical: 'top' }, focused && { borderColor: C.primaryDark }]}
      />
    </View>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.ghost}>
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

export const makeSheetStyles = (C: Tokens) => makeStyles(C);

const makeStyles = (C: Tokens) => StyleSheet.create({
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,10,6,0.5)' },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bgBase, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, gap: 12 },
  grab: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.textMuted + '80', alignSelf: 'center' },
  title: { fontFamily: F.display, fontSize: 28, lineHeight: 34, color: C.textPrimary },
  sub: { fontFamily: F.body, fontSize: 13, color: C.textMuted, marginTop: 2 },
  q: { fontFamily: F.semibold, fontSize: 14, color: C.textPrimary },
  qMuted: { fontFamily: F.body, color: C.textMuted },
  field: {
    fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.textPrimary, backgroundColor: C.bgSurface,
    borderWidth: 1.5, borderColor: 'transparent', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12,
  },
  ghost: { alignItems: 'center', paddingVertical: 6, minHeight: 36, justifyContent: 'center' },
  ghostText: { fontFamily: F.medium, fontSize: 14, color: C.textSecondary },
});
