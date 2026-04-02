import React, { useRef } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@/components/ui/Icon';
import CurvedTabBar from '@/components/navigation/CurvedTabBar';
import { CurvedTabBarRef } from '@/components/navigation/tabBarConfig';

export default function TabLayout() {
  const tabBarRef = useRef<CurvedTabBarRef>(null);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CurvedTabBar ref={tabBarRef} {...props} />}
    >
      {/* LEFT side — Courses, bootcamps & festivals */}
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />

      {/* CENTER — The main dance / tonight map screen */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dance',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dance-ballroom" size={size} color={color} />
          ),
        }}
      />

      {/* RIGHT side — Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
