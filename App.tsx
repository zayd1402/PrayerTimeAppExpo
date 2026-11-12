import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  BodoniModa_400Regular, BodoniModa_500Medium,
  BodoniModa_600SemiBold, BodoniModa_700Bold,
} from '@expo-google-fonts/bodoni-moda';
import { Jost_300Light, Jost_400Regular, Jost_500Medium, Jost_600SemiBold, Jost_700Bold } from '@expo-google-fonts/jost';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';

import { PrayerAppProvider } from './src/context/PrayerAppContext';
import { ThemeProvider, useTheme, useTokens } from './src/context/ThemeContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import RootNavigator from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const { isDark } = useTheme();
  const t = useTokens();
  return <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bgBase} />;
}

/** Navigation container with the app's own background, so screen transitions never flash white in dark mode. */
function ThemedNavigation({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const t = useTokens();
  const theme = React.useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: t.bgBase, card: t.bgBase, text: t.textPrimary, border: t.border, primary: t.primary },
    };
  }, [isDark, t]);
  return <NavigationContainer theme={theme}>{children}</NavigationContainer>;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    BodoniModa_400Regular, BodoniModa_500Medium,
    BodoniModa_600SemiBold, BodoniModa_700Bold,
    Jost_300Light, Jost_400Regular, Jost_500Medium,
    Jost_600SemiBold, Jost_700Bold,
    Amiri_400Regular, Amiri_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <ThemeProvider>
          <ThemedStatusBar />
          <ThemedNavigation>
            <ErrorBoundary>
              <PrayerAppProvider>
                <RootNavigator />
              </PrayerAppProvider>
            </ErrorBoundary>
          </ThemedNavigation>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
