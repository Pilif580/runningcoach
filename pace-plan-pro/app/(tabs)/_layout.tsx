import { Tabs } from 'expo-router';
import { CalendarDots, Books, Sliders, List } from 'phosphor-react-native';

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
                 tabBarIcon: ({ color, size }) => (
                   <CalendarDots color={color} size={size} />
                 ),
                 headerTitle: 'My Plan',
               }}
             />
             <Tabs.Screen
               name="library"
               options={{
                 title: 'Library',
                 tabBarIcon: ({ color, size }) => (
                   <Books color={color} size={size} />
                 ),
                 headerTitle: 'Plan Library',
               }}
             />
             <Tabs.Screen
               name="run-types"
               options={{
                 title: 'Run Types',
                 tabBarIcon: ({ color, size }) => (
                   <List color={color} size={size} />
                 ),
                 headerTitle: 'Run Types',
               }}
             />
             <Tabs.Screen
               name="settings"
               options={{
                 title: 'Settings',
                 tabBarIcon: ({ color, size }) => (
                   <Sliders color={color} size={size} />
                 ),
                 headerTitle: 'Settings',
               }}
             />
    </Tabs>
  );
}


