// ─── TabNavigator — Native bottom tabs using @react-navigation ─
import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../types';

import TodayScreen from '../screens/TodayScreen';
import WorshipScreen from '../screens/WorshipScreen';
import CalendarScreen from '../screens/CalendarScreen';
import DuaLibraryScreen from '../screens/DuaLibraryScreen';
import MoreScreen from './MoreScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <Ionicons name={name as any} size={size} color={color} />;
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.bgSurface,
          borderTopColor: C.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          height: Platform.OS === 'ios' ? 84 : 64,
          elevation: 0,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Jost_500Medium',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="home"
        component={TodayScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="worship"
        component={WorshipScreen}
        options={{
          tabBarLabel: 'Worship',
          tabBarIcon: ({ color, size }) => <TabIcon name="heart" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => <TabIcon name="calendar" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="duas"
        component={DuaLibraryScreen}
        options={{
          tabBarLabel: 'Duas',
          tabBarIcon: ({ color, size }) => <TabIcon name="book" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="more"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => <TabIcon name="grid" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
