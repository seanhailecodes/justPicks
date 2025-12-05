import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

// Simple emoji-based icons (can replace with proper icon library later)
const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          borderTopColor: '#333',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. Home - leftmost */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />

      {/* 2. Groups */}
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />

      {/* 3. Games */}
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏈" focused={focused} />,
        }}
      />

      {/* 4. Profile - rightmost */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}