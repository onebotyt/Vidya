/**
 * Student Bottom Tab Navigation Shell
 * Faithfully matches the modern Student Portal HTML navigation bar:
 * - 5 tabs: Dashboard, Attendance, Classes, Work, Profile
 * - Pill background behind active icon (`#EFF6FF`), active royal blue color (`#2563EB`)
 * - Clean, crisp typography (`10px` font weight `700`)
 * - Dynamic safe area insets to prevent Android gesture bar overlap
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StudentLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const tabHeight = 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: -0.1,
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconPill, focused && styles.activeIconPill]}>
              <MaterialCommunityIcons
                name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
                color={focused ? '#2563EB' : '#94A3B8'}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconPill, focused && styles.activeIconPill]}>
              <MaterialCommunityIcons
                name={focused ? 'calendar-check' : 'calendar-check-outline'}
                color={focused ? '#2563EB' : '#94A3B8'}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconPill, focused && styles.activeIconPill]}>
              <MaterialCommunityIcons
                name="google-classroom"
                color={focused ? '#2563EB' : '#94A3B8'}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Work',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconPill, focused && styles.activeIconPill]}>
              <MaterialCommunityIcons
                name={focused ? 'clipboard-text' : 'clipboard-text-outline'}
                color={focused ? '#2563EB' : '#94A3B8'}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconPill, focused && styles.activeIconPill]}>
              <MaterialCommunityIcons
                name={focused ? 'account-circle' : 'account-circle-outline'}
                color={focused ? '#2563EB' : '#94A3B8'}
                size={22}
              />
            </View>
          ),
        }}
      />

      {/* Feature & Detail Screens (Hidden from Tab Bar) */}
      <Tabs.Screen
        name="class-detail"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="assignment-detail"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="qr-scanner"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="scores"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="bug-report"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconPill: {
    backgroundColor: '#EFF6FF',
  },
});
