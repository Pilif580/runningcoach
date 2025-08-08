import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './data/supabase';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 * @returns Promise<boolean> Whether permissions were granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permission denied');
      return false;
    }

    // For Android, we need to create a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the Expo push token for this device
 * @returns Promise<string | null> The push token or null if failed
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // First check if we have permission
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('No notification permission, cannot get push token');
      return null;
    }

    // Get the token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      // Use your app's bundle identifier as fallback if no project ID is set
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || undefined,
    });

    return tokenData.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}

/**
 * Save push token to user's profile in Supabase
 * @param pushToken The Expo push token to save
 * @returns Promise<boolean> Success status
 */
export async function savePushTokenToProfile(pushToken: string): Promise<boolean> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No authenticated user found:', userError);
      return false;
    }

    // Update or insert profile with push token
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        push_token: pushToken,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error saving push token to profile:', error);
      return false;
    }

    console.log('Push token saved to profile successfully');
    return true;
  } catch (error) {
    console.error('Network error saving push token:', error);
    return false;
  }
}

/**
 * Initialize notifications for the current user
 * Gets push token and saves it to their profile
 * @returns Promise<string | null> The push token if successful
 */
export async function initializeNotifications(): Promise<string | null> {
  try {
    console.log('Initializing notifications...');
    
    // Get push token
    const pushToken = await getExpoPushToken();
    if (!pushToken) {
      console.warn('Failed to get push token');
      return null;
    }

    console.log('Got push token:', pushToken);

    // Save to profile
    const saved = await savePushTokenToProfile(pushToken);
    if (!saved) {
      console.warn('Failed to save push token to profile');
      // Still return the token as we got it successfully
      return pushToken;
    }

    console.log('Notifications initialized successfully');
    return pushToken;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return null;
  }
}

/**
 * Check if notifications are enabled for this device
 * @returns Promise<boolean> Whether notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
}

/**
 * Schedule a run reminder notification for a specific date
 * @param date The date to schedule the notification (YYYY-MM-DD format)
 * @param title The title of the run (e.g., "Easy Run - 5km")
 * @returns Promise<string | null> The notification ID if successful
 */
export async function scheduleTodayRunReminder(date: string, title: string): Promise<string | null> {
  try {
    // Check if notifications are enabled
    const hasPermission = await areNotificationsEnabled();
    if (!hasPermission) {
      console.warn('No notification permission, cannot schedule reminder');
      return null;
    }

    // Create notification date at 8 AM on the specified date
    const notificationDate = new Date(date + 'T08:00:00');
    const now = new Date();

    // Don't schedule notifications for past dates
    if (notificationDate <= now) {
      console.log('Skipping notification for past date:', date);
      return null;
    }

    // Calculate seconds from now to the notification time
    const secondsUntilNotification = Math.floor((notificationDate.getTime() - now.getTime()) / 1000);
    
    // Don't schedule if it's less than 60 seconds from now
    if (secondsUntilNotification < 60) {
      console.log('Notification time too close, skipping:', date);
      return null;
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏃‍♂️ Time to Run!',
        body: `Today's workout: ${title}`,
        data: {
          type: 'run_reminder',
          date: date,
          runTitle: title
        },
      },
      trigger: {
        seconds: secondsUntilNotification,
      } as any, // Type assertion to handle version compatibility
    });

    console.log(`Scheduled run reminder for ${date} at 8:00 AM - ${title}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling run reminder:', error);
    return null;
  }
}

/**
 * Schedule run reminders for multiple training days in a week
 * @param trainingDays Array of training day objects with date and title
 * @returns Promise<string[]> Array of notification IDs for scheduled reminders
 */
export async function scheduleWeekRunReminders(
  trainingDays: Array<{ date: string; title: string }>
): Promise<string[]> {
  const notificationIds: string[] = [];

  for (const day of trainingDays) {
    const notificationId = await scheduleTodayRunReminder(day.date, day.title);
    if (notificationId) {
      notificationIds.push(notificationId);
    }
  }

  console.log(`Scheduled ${notificationIds.length} run reminders for the week`);
  return notificationIds;
}

/**
 * Cancel all scheduled notifications (useful when creating new plans)
 * @returns Promise<void>
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all scheduled notifications');
  } catch (error) {
    console.error('Error cancelling scheduled notifications:', error);
  }
}
