import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TodayScreen from '../screens/TodayScreen';
import HabitsScreen from '../screens/HabitsScreen';
import QiblaMosquesScreen from '../screens/QiblaMosquesScreen';
import LibraryScreen from '../screens/LibraryScreen';
import { Tokens, useThemedStyles, useTokens } from '../context/ThemeContext';
import { Glyph, GlyphName } from '../design/Glyph';
import { F } from '../design/palette';
import { useTranslation } from '../i18n';

const Tab = createBottomTabNavigator();

const TABS: { name: string; labelKey: string; icon: GlyphName; component: React.ComponentType }[] = [
  { name: 'today', labelKey: 'tabs.today', icon: 'today', component: TodayScreen },
  { name: 'habits', labelKey: 'tabs.habits', icon: 'habits', component: HabitsScreen },
  { name: 'qibla', labelKey: 'tabs.qibla', icon: 'qibla', component: QiblaMosquesScreen },
  { name: 'library', labelKey: 'tabs.library', icon: 'library', component: LibraryScreen },
];

export default function TabNavigator() {
  const C = useTokens();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // Room for icon and label, plus the home-indicator / gesture-bar inset.
        // A fixed height without the inset clipped the labels on phones that have one.
        tabBarStyle: [styles.tabBar, { height: 64 + insets.bottom }],
        tabBarActiveTintColor: C.primaryDark,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: t(tab.labelKey),
            tabBarIcon: ({ color }) => <Glyph name={tab.icon} size={22} color={color} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const makeStyles = (C: Tokens) => StyleSheet.create({
  tabBar: {
    backgroundColor: C.bgBase,
    borderTopColor: C.border,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    paddingTop: 6,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    // Jost's deep descenders (the y in Today) clip at a tight line height.
    lineHeight: 16,
    paddingBottom: 2,
    fontFamily: F.medium,
  },
});
