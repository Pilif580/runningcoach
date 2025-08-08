import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { tokens } from '../../src/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: tokens.surface,
          borderTopColor: tokens.card,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: tokens.textWeak,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: tokens.surface,
        },
        headerTintColor: tokens.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="📅" color={color} size={size} />
          ),
          headerTitle: 'My Plan',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="📚" color={color} size={size} />
          ),
          headerTitle: 'Plan Library',
        }}
      />
      <Tabs.Screen
        name="run-types"
        options={{
          title: 'Run Types',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="📋" color={color} size={size} />
          ),
          headerTitle: 'Run Types',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="⚙️" color={color} size={size} />
          ),
          headerTitle: 'Settings',
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return (
    <Text style={{ 
      fontSize: size * 0.8, 
      color: color,
      textAlign: 'center',
      lineHeight: size 
    }}>
      {name}
    </Text>
  );
}


