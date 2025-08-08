import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import dayjs from 'dayjs';

/**
 * Parse a deep link URL and extract relevant parameters
 * @param url The deep link URL to parse
 * @returns Parsed link data or null if invalid
 */
export function parseDeepLink(url: string): {
  screen: string;
  params: Record<string, string>;
} | null {
  try {
    const { hostname, path, queryParams } = Linking.parse(url);
    
    console.log('Parsing deep link:', { url, hostname, path, queryParams });

    // Handle different deep link formats
    // paceplanpro://plan?date=YYYY-MM-DD
    // paceplanpro://plan/YYYY-MM-DD
    
    if (hostname === 'plan' || path === '/plan') {
      // Convert QueryParams to Record<string, string>
      const params: Record<string, string> = {};
      if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
          if (typeof value === 'string') {
            params[key] = value;
          } else if (Array.isArray(value) && value.length > 0) {
            params[key] = value[0]; // Take first value if array
          }
        });
      }
      
      return {
        screen: 'plan',
        params
      };
    }

    // Handle path-based parameters: paceplanpro://plan/2025-01-15
    if (path && path.startsWith('/plan/')) {
      const dateFromPath = path.replace('/plan/', '');
      if (isValidDate(dateFromPath)) {
        return {
          screen: 'plan',
          params: { date: dateFromPath }
        };
      }
    }

    console.warn('Unrecognized deep link format:', url);
    return null;
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
}

/**
 * Validate if a string is a valid date in YYYY-MM-DD format
 * @param dateString The date string to validate
 * @returns Whether the date is valid
 */
function isValidDate(dateString: string): boolean {
  const date = dayjs(dateString, 'YYYY-MM-DD', true);
  return date.isValid() && !!dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

/**
 * Navigate to the appropriate screen based on deep link data
 * @param linkData The parsed deep link data
 */
export function handleDeepLinkNavigation(linkData: {
  screen: string;
  params: Record<string, string>;
}): void {
  const { screen, params } = linkData;

  console.log('Handling deep link navigation:', linkData);

  switch (screen) {
    case 'plan':
      navigateToPlan(params);
      break;
    
    default:
      console.warn('Unknown screen in deep link:', screen);
      // Default to plan screen if we don't recognize the screen
      router.push('/(tabs)/plan');
      break;
  }
}

/**
 * Navigate to the plan screen, optionally scrolled to a specific date
 * @param params The parameters from the deep link
 */
function navigateToPlan(params: Record<string, string>): void {
  const { date } = params;

  if (date && isValidDate(date)) {
    // Navigate to plan screen with date parameter
    // The plan screen will handle scrolling to the specific date
    console.log('Navigating to plan screen with date:', date);
    
    router.push({
      pathname: '/(tabs)/plan',
      params: { scrollToDate: date }
    });
  } else if (date) {
    console.warn('Invalid date format in deep link:', date);
    // Navigate to plan screen without date
    router.push('/(tabs)/plan');
  } else {
    // Navigate to plan screen normally
    console.log('Navigating to plan screen');
    router.push('/(tabs)/plan');
  }
}

/**
 * Process an incoming deep link URL
 * @param url The deep link URL to process
 */
export function processDeepLink(url: string): void {
  console.log('Processing deep link:', url);

  const linkData = parseDeepLink(url);
  
  if (linkData) {
    handleDeepLinkNavigation(linkData);
  } else {
    console.warn('Could not parse deep link, navigating to home');
    router.push('/(tabs)/plan');
  }
}

/**
 * Get the initial URL that opened the app (if any)
 * @returns Promise<string | null> The initial URL or null
 */
export async function getInitialURL(): Promise<string | null> {
  try {
    const initialURL = await Linking.getInitialURL();
    console.log('Initial URL:', initialURL);
    return initialURL;
  } catch (error) {
    console.error('Error getting initial URL:', error);
    return null;
  }
}

/**
 * Create a deep link URL for sharing
 * @param screen The screen to link to
 * @param params Parameters for the deep link
 * @returns The deep link URL
 */
export function createDeepLink(screen: string, params: Record<string, string> = {}): string {
  const baseUrl = 'paceplanpro://';
  
  switch (screen) {
    case 'plan':
      if (params.date) {
        return `${baseUrl}plan?date=${params.date}`;
      }
      return `${baseUrl}plan`;
    
    default:
      return baseUrl;
  }
}

/**
 * Share a plan date via deep link
 * @param date The date to share in YYYY-MM-DD format
 * @returns The shareable deep link URL
 */
export function createPlanDateLink(date: string): string {
  if (!isValidDate(date)) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }
  
  return createDeepLink('plan', { date });
}
