import React from 'react';
import {
  View, StatusBar, Platform, StyleSheet
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  BodoniModa_400Regular, BodoniModa_500Medium,
  BodoniModa_600SemiBold, BodoniModa_700Bold,
} from '@expo-google-fonts/bodoni-moda';
import { Jost_300Light, Jost_400Regular, Jost_500Medium, Jost_600SemiBold, Jost_700Bold } from '@expo-google-fonts/jost';

import { C } from './src/types';
import { PrayerAppProvider } from './src/context/PrayerAppContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import TabNavigator from './src/navigation/TabNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    BodoniModa_400Regular, BodoniModa_500Medium,
    BodoniModa_600SemiBold, BodoniModa_700Bold,
    Jost_300Light, Jost_400Regular, Jost_500Medium,
    Jost_600SemiBold, Jost_700Bold,
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
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bgBase} />
      <ThemeProvider>
        <NavigationContainer>
          <ErrorBoundary>
            <PrayerAppProvider>
              <TabNavigator />
            </PrayerAppProvider>
          </ErrorBoundary>
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
});
