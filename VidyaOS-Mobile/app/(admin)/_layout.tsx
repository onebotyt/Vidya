/**
 * System Administrator Bottom Tab Navigation Shell
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7C3AED',
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
            <MaterialCommunityIcons name="view-dashboard-outline" color={(color as string) || '#7C3AED'} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="faculty-management"
        options={{
          title: 'Faculty',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-tie-outline" color={(color as string) || '#7C3AED'} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="academic-structure"
        options={{
          title: 'Academics',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="domain" color={(color as string) || '#7C3AED'} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="bug-reports"
        options={{
          title: 'Bug Reports',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bug-outline" color={(color as string) || '#7C3AED'} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dots-horizontal-circle-outline" color={(color as string) || '#7C3AED'} size={size} />
          ),
        }}
      />

      {/* Admin Feature Sub-Screens (Hidden from tab bar) */}
      <Tabs.Screen name="audit-logs" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
