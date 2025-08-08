/**
 * Application Configuration
 * 
 * This file contains configuration constants and environment variables
 * for the Pace Plan Pro application.
 */

import Constants from 'expo-constants';

/**
 * Development UUID used for testing when no authenticated user is available.
 * This UUID is used in:
 * - planService.ts for creating plans when auth.getUser() fails
 * - Any other places that need a fallback athlete ID
 * 
 * In production, this should be replaced with proper user authentication.
 */
export const DEV_UUID = '11111111-1111-1111-1111-111111111111';

/**
 * Supabase configuration from environment variables
 * These are exposed via expo-constants from the app.json extra field
 */
export const getSupabaseConfig = () => {
  const extra = Constants.expoConfig?.extra || Constants.manifest2?.extra;
  
  return {
    url: extra?.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: extra?.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
  };
};

/**
 * Check if we're running in development mode
 */
export const isDevelopment = __DEV__;

/**
 * Application metadata
 */
export const APP_CONFIG = {
  name: 'Pace Plan Pro',
  version: Constants.expoConfig?.version || '1.0.0',
  isDev: isDevelopment,
} as const;
