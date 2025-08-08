import { supabase } from './supabase';
import { captureEvent } from '../analytics';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

/**
 * Get the current user session
 * @returns Promise<Session | null> Current session or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Network error getting session:', error);
    return null;
  }
}

/**
 * Subscribe to authentication state changes
 * @param callback Function to call when auth state changes
 * @returns Function to unsubscribe from auth changes
 */
export function onAuthChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Sign out the current user
 * @returns Promise<boolean> Success status
 */
export async function signOut(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Network error signing out:', error);
    return false;
  }
}

/**
 * Send magic link login email
 * @param email Email address to send login link to
 * @returns Promise<boolean> Success status
 */
export async function sendLoginLink(email: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true
      }
    });
    
    if (error) {
      console.error('Error sending login link:', error);
      captureEvent('login_link_failed', { error: error.message });
      return false;
    }
    
    captureEvent('login_link_sent', { email: email.trim().toLowerCase() });
    return true;
  } catch (error) {
    console.error('Network error sending login link:', error);
    captureEvent('login_link_network_error');
    return false;
  }
}
