import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Root view using Tailwind theme colors */}
      <View className="flex-1 bg-bg">
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#141416' }, // surface color
            headerTintColor: '#FFFFFF', // text color
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'Pace Plan Pro',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
