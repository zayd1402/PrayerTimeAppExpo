import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../types';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.warn('ErrorBoundary caught:', error.message, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🤲</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>Please restart the app. If this persists, contact support.</Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorText}>{this.state.error.message}</Text>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bgBase, padding: 24 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontFamily: 'BodoniModa_700Bold', color: C.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 24 },
  errorText: { fontSize: 12, color: C.red, marginBottom: 24, textAlign: 'center', fontFamily: 'Jost_400Regular' },
  button: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  buttonText: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.white },
});
