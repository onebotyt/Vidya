/**
 * Faculty Bottom Tab Navigation Shell
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';

export default function FacultyLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: THEME.colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: THEME.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" color={(color as string) || '#059669'} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="google-classroom" color={(color as string) || '#059669'} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="registers"
        options={{
          title: 'Registers',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-outline" color={(color as string) || '#059669'} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group-outline" color={(color as string) || '#059669'} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dots-horizontal-circle-outline" color={(color as string) || '#059669'} size={size} />
          ),
        }}
      />

      {/* Detail & Feature Sub-Screens (Hidden from direct tab bar) */}
      <Tabs.Screen name="class-detail" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="session-studio" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="leave-approvals" options={{ href: null }} />
      <Tabs.Screen name="timetable" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="bug-report" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />

      {/* 5 Desktop-Only Gates */}
      <Tabs.Screen name="sheets" options={{ href: null }} />
      <Tabs.Screen name="course-file" options={{ href: null }} />
      <Tabs.Screen name="assessment-process" options={{ href: null }} />
      <Tabs.Screen name="esp32-devices" options={{ href: null }} />
      <Tabs.Screen name="hod-archive" options={{ href: null }} />
    </Tabs>
  );
}
