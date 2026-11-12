// The root stack: the four tabs, plus every sub-page as a real screen so the back button
// and the system back gesture both work.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTokens } from '../context/ThemeContext';
import { usePrayerApp } from '../context/PrayerAppContext';
import { F } from '../design/palette';
import TabNavigator from './TabNavigator';
import type { RootStackParamList } from './routes';

import SettingsScreen from '../screens/SettingsScreen';
import DuaLibraryScreen from '../screens/DuaLibraryScreen';
import HadithScreen from '../screens/HadithScreen';
import SunnahRoutineScreen from '../screens/SunnahRoutineScreen';
import WeeklyScreen from '../screens/WeeklyScreen';
import FridayScreen from '../screens/FridayScreen';
import RamadanScreen from '../screens/RamadanScreen';
import HajjScreen from '../screens/HajjScreen';
import CalendarScreen from '../screens/CalendarScreen';
import HifdhScreen from '../screens/HifdhScreen';
import ZakatScreen from '../screens/ZakatScreen';
import JournalScreen from '../screens/JournalScreen';
import TazkiyahScreen from '../screens/TazkiyahScreen';
import MosquesScreen from '../screens/MosquesScreen';
import WorshipScreen from '../screens/WorshipScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function SettingsPage() {
  const { settings, handleUpdateSettings } = usePrayerApp();
  return <SettingsScreen settings={settings} updateSettings={handleUpdateSettings} />;
}

function MosquesPage() {
  const { location } = usePrayerApp();
  if (!location) return <View style={StyleSheet.absoluteFill} />;
  return <MosquesScreen coordinate={location} />;
}

function WorshipPage() {
  const route = useRoute<RouteProp<RootStackParamList, 'worship'>>();
  return <WorshipScreen initialTab={route.params?.tab} />;
}

const PAGES: { name: Exclude<keyof RootStackParamList, 'tabs'>; title: string; component: React.ComponentType }[] = [
  { name: 'settings', title: 'Settings', component: SettingsPage },
  { name: 'duas', title: 'Duas', component: DuaLibraryScreen },
  { name: 'hadith', title: 'Hadith', component: HadithScreen },
  { name: 'sunnah', title: 'Morning and evening', component: SunnahRoutineScreen },
  { name: 'weekly', title: 'Weekly Sunnah', component: WeeklyScreen },
  { name: 'friday', title: "Jumu'ah", component: FridayScreen },
  { name: 'ramadan', title: 'Ramadan', component: RamadanScreen },
  { name: 'hajj', title: 'Hajj and Umrah', component: HajjScreen },
  { name: 'calendar', title: 'Islamic dates', component: CalendarScreen },
  { name: 'hifdh', title: 'Hifdh', component: HifdhScreen },
  { name: 'zakat', title: 'Zakat', component: ZakatScreen },
  { name: 'journal', title: 'Journal', component: JournalScreen },
  { name: 'tazkiyah', title: 'Tazkiyah', component: TazkiyahScreen },
  { name: 'mosques', title: 'Mosques', component: MosquesPage },
  { name: 'worship', title: 'Worship', component: WorshipPage },
];

export default function RootNavigator() {
  const C = useTokens();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.bgBase },
        headerShadowVisible: false,
        headerTintColor: C.primaryDark,
        headerTitleStyle: { fontFamily: F.semibold, fontSize: 16, color: C.textPrimary },
        headerBackTitle: 'Back',
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: C.bgBase },
        // Each page shows its own large serif title, so the bar only carries the back button.
        headerTitle: () => null,
      }}
    >
      <Stack.Screen name="tabs" component={TabNavigator} options={{ headerShown: false }} />
      {PAGES.map(p => (
        <Stack.Screen key={p.name} name={p.name} component={p.component} options={{ title: p.title }} />
      ))}
    </Stack.Navigator>
  );
}
