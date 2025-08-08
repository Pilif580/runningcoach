import { Tabs } from 'expo-router';
import { CalendarDots, Books, Sliders, List } from 'phosphor-react-native';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0B0B0C',
          borderTopColor: '#1E1E20',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#39FF14',
        tabBarInactiveTintColor: '#8A8A8E',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#0B0B0C',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => {
            return <CalendarDots color={color} size={size} weight="fill" />;
          },
          headerTitle: 'My Plan',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => {
            return <Books color={color} size={size} weight="fill" />;
          },
          headerTitle: 'Plan Library',
        }}
      />
      <Tabs.Screen
        name="run-types"
        options={{
          title: 'Run Types',
          tabBarIcon: ({ color, size }) => {
            return <List color={color} size={size} weight="fill" />;
          },
          headerTitle: 'Run Types',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => {
            return <Sliders color={color} size={size} weight="fill" />;
          },
          headerTitle: 'Settings',
        }}
      />
    </Tabs>
  );
}
