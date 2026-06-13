import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { iconName } from '../components/Icon';
import { C } from '../types';

import TodayScreen from '../screens/TodayScreen';
import WorshipScreen from '../screens/WorshipScreen';
import QiblaMosquesScreen from '../screens/QiblaMosquesScreen';
import CalendarScreen from '../screens/CalendarScreen';
import LearnScreen from '../screens/LearnScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'today', label: 'Today', icon: 'today-outline', component: TodayScreen },
  { name: 'worship', label: 'Worship', icon: 'heart-outline', component: WorshipScreen },
  { name: 'qibla-mosques', label: 'Qibla', icon: 'navigate-outline', component: QiblaMosquesScreen },
  { name: 'calendar', label: 'Calendar', icon: 'calendar-outline', component: CalendarScreen },
  { name: 'learn', label: 'Learn', icon: 'book-outline', component: LearnScreen },
];

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <Ionicons name={iconName(name)} size={size} color={color} />;
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: C.primary,
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
            tabBarLabel: tab.label,
            tabBarIcon: ({ color, size }) => (
              <TabIcon name={tab.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.bgSurface,
    borderTopColor: C.border,
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    height: Platform.OS === 'ios' ? 84 : 64,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Jost_500Medium',
    marginTop: 2,
  },
});
