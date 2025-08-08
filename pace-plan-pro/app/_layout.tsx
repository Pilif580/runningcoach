import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import 'react-native-reanimated';
import { initializeDatabase } from '../src/data/db';
import { useSync } from '../src/logic/useSync';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { getSession, onAuthChange } from '../src/data/session';
import { posthog, identifyUser, resetAnalytics } from '../src/analytics';
import type { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Initialize sync hook - this will handle automatic syncing
  useSync();

  useEffect(() => {
    // Initialize SQLite database on app start
    initializeDatabase();

    // Initialize PostHog analytics
    posthog.capture('app_open');

    // Get initial session
    getSession().then((initialSession) => {
      setSession(initialSession);
      setIsLoading(false);
      
      // Identify user if authenticated
      if (initialSession?.user) {
        identifyUser(initialSession.user.id, initialSession.user.email);
      }
    });

    // Subscribe to auth changes
    const unsubscribe = onAuthChange((event, newSession) => {
      console.log('Auth state changed:', event, newSession?.user?.email);
      setSession(newSession);
      
      // Handle analytics based on auth events
      if (event === 'SIGNED_IN' && newSession?.user) {
        identifyUser(newSession.user.id, newSession.user.email);
        posthog.capture('user_signed_in');
      } else if (event === 'SIGNED_OUT') {
        posthog.capture('user_signed_out');
        resetAnalytics();
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // User is not signed in and not on auth screen, redirect to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // User is signed in but still on auth screen, redirect to app
      router.replace('/(tabs)');
    }
  }, [session, segments, isLoading]);

  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#0B0B0C', justifyContent: 'center', alignItems: 'center' }}>
          <StatusBar style="light" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {/* Root view using Tailwind theme colors */}
      <View style={{ flex: 1, backgroundColor: '#0B0B0C' }}>
        <StatusBar style="light" />
        <OfflineBanner />
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
            name="(auth)"
            options={{
              headerShown: false,
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
