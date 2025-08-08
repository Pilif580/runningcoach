import { PostHog } from 'posthog-react-native';

// Initialize PostHog with your project key
// Replace <POSTHOG_KEY> with your actual PostHog project key
export const posthog = new PostHog('<POSTHOG_KEY>', { 
  host: 'https://app.posthog.com' 
});

// Helper function to identify user after authentication
export function identifyUser(userId: string, email?: string) {
  if (email) {
    posthog.identify(userId, { email });
  } else {
    posthog.identify(userId);
  }
}

// Helper function to capture events with consistent formatting
export function captureEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties);
}

// Helper function to reset analytics when user logs out
export function resetAnalytics() {
  posthog.reset();
}
