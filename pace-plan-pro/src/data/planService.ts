import { supabase } from './supabase';
import dayjs from 'dayjs';
import { generateWeek, type PlanDay } from '../logic/generatePlan';
import { scheduleWeekRunReminders, cancelAllScheduledNotifications } from '../notify';
import { DEV_UUID } from '../config';

// Re-export DEV_UUID for backward compatibility
export { DEV_UUID };

async function getAthleteId(): Promise<string> {
  try {
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      console.error('No authenticated user found:', authError);
      throw new Error('Authentication required');
    }

    const userId = user.id; // This is the UUID from auth.users

    // Check if athlete record exists for this user
    const { data: existingAthlete, error: fetchError } = await supabase
      .from('athletes')
      .select('id')
      .eq('profile_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching athlete:', fetchError);
      throw fetchError;
    }

    // Return existing athlete ID if found
    if (existingAthlete) {
      return existingAthlete.id;
    }

    // Create new athlete record
    const { data: newAthlete, error: createError } = await supabase
      .from('athletes')
      .insert({
        profile_id: userId,
        email: user.email || null,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating athlete:', createError);
      throw createError;
    }

    console.log('Created new athlete profile:', newAthlete.id);
    return newAthlete.id;
  } catch (error) {
    console.error('Error getting athlete ID:', error);
    // Fallback to dev UUID for development - remove this in production
    console.log('Falling back to dev UUID for development');
    return DEV_UUID;
  }
}

export async function createPlanIfNotExists(): Promise<string> {
  try {
    const athleteId = await getAthleteId();
    const startOfWeek = dayjs().startOf('week').toISOString();

    // Check if plan already exists for this week
    const { data: existingPlan, error: checkError } = await supabase
      .from('plans')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('start_date', startOfWeek)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing plan:', checkError);
      throw checkError;
    }

    // Return existing plan id if found
    if (existingPlan) {
      return existingPlan.id;
    }

    // Create new plan
    const { data: newPlan, error: planError } = await supabase
      .from('plans')
      .insert({
        athlete_id: athleteId,
        start_date: startOfWeek,
        coach_note: null
      })
      .select('id')
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      throw planError;
    }

    // Generate week of plan_days
    const week = generateWeek(
      {
        goal: '5k',
        goalDate: dayjs().add(8, 'weeks').toISOString(),
        thresholdPaceSec: 360,
        trainDays: [1, 3, 5, 6]
      },
      startOfWeek
    );

    // Insert plan_days using helper
    await insertDays(newPlan.id, week, startOfWeek);

    // Schedule notifications for training days
    await scheduleRunNotificationsForWeek(week);

    return newPlan.id;
  } catch (error) {
    console.error('Error checking existing plan:', error);
    throw error;
  }
}

export async function fetchPlanDaysLegacy(planId: string): Promise<PlanDay[]> {
  if (!planId) {
    return [];
  }

  const { data, error } = await supabase
    .from('plan_days')
    .select('id, date, type_name, target_distance_km')
    .eq('plan_id', planId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching plan days:', error);
    throw error;
  }

  return data || [];
}

// Private helper function to insert plan days
async function insertDays(planId: string, days: PlanDay[], startOfWeek: string) {
  const daysToInsert = days.map((day) => ({
    plan_id: planId,
    date: day.date, // Use the date directly from PlanDay
    type_name: day.type_name,
    target_distance_km: day.target_distance_km
  }));

  const { error: daysError } = await supabase
    .from('plan_days')
    .insert(daysToInsert);

  if (daysError) {
    console.error('Error creating plan days:', daysError);
    throw daysError;
  }
}

export async function createPlanFromTemplateLegacy(templateId: string, templateDays: Array<{ dayOfWeek: number; type_name: string; target_distance_km?: number }>): Promise<string> {
  try {
    const athleteId = await getAthleteId();
    
    // Calculate next Monday (or start of week if already Monday)
    let startOfWeek = dayjs().startOf('week');
    if (dayjs().day() !== 1) { // If not Monday, go to next Monday
      startOfWeek = startOfWeek.add(1, 'week');
    }

    // Create new plan
    const { data: newPlan, error: planError } = await supabase
      .from('plans')
      .insert({
        athlete_id: athleteId,
        start_date: startOfWeek.toISOString(),
        coach_note: `Applied template: ${templateId}`
      })
      .select('id')
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      throw planError;
    }

    // Convert templateDays to PlanDay format
    const planDays: PlanDay[] = templateDays.map((day) => {
      const date = startOfWeek.add(day.dayOfWeek, "day");
      return {
        date: date.toISOString(),
        type_name: day.type_name,
        target_distance_km: day.target_distance_km
      };
    });

    // Insert plan_days using helper
    await insertDays(newPlan.id, planDays, startOfWeek.toISOString());

    return newPlan.id;
  } catch (error) {
    console.error('Error creating plan from template:', error);
    throw error;
  }
}

// NEW FUNCTIONS BELOW

/**
 * Create a plan from a template object
 * @param template Template object with sampleWeek property
 * @returns Promise<string> The new plan ID
 */
// Private helper function to schedule notifications for training days in a week
async function scheduleRunNotificationsForWeek(weekDays: PlanDay[]): Promise<void> {
  try {
    // Cancel any existing scheduled notifications first
    await cancelAllScheduledNotifications();

    // Filter only training days (not Rest days)
    const trainingDays = weekDays
      .filter(day => day.type_name !== 'Rest')
      .map(day => ({
        date: dayjs(day.date).format('YYYY-MM-DD'),
        title: `${day.type_name}${day.target_distance_km ? ` - ${day.target_distance_km}km` : ''}`
      }));

    if (trainingDays.length > 0) {
      await scheduleWeekRunReminders(trainingDays);
      console.log(`Scheduled ${trainingDays.length} run reminders for the week`);
    }
  } catch (error) {
    console.error('Error scheduling run notifications:', error);
    // Don't throw - notifications are optional, plan creation should still succeed
  }
}

export async function createPlanFromTemplate(template: any): Promise<string> {
  try {
    const athleteId = await getAthleteId(); // Use real auth instead of mock
    
    // Calculate next Monday (start of week)
    const nextMonday = dayjs().startOf('week').add(1, 'week');

    // Create new plan
    const { data: newPlan, error: planError } = await supabase
      .from('plans')
      .insert({
        athlete_id: athleteId,
        start_date: nextMonday.toISOString()
      })
      .select('id')
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      throw planError;
    }

    // Map template.sampleWeek into plan_days format
    const daysToInsert = template.sampleWeek.map((day: any, index: number) => {
      const dayDate = nextMonday.add(index, 'day');
      return {
        plan_id: newPlan.id,
        date: dayDate.toISOString(),
        type_name: day.type_name,
        target_distance_km: day.target_distance_km || null,
        target_duration_min: day.target_duration_min || null,
        target_pace_sec_per_km: null, // Always null as specified
        tip: day.tip || null
      };
    });

    // Insert plan_days
    const { error: daysError } = await supabase
      .from('plan_days')
      .insert(daysToInsert);

    if (daysError) {
      console.error('Error creating plan days:', daysError);
      throw daysError;
    }

    // Schedule notifications for training days
    const trainingDays = template.sampleWeek
      .map((day: any, index: number) => {
        const dayDate = nextMonday.add(index, 'day');
        return {
          date: dayDate.format('YYYY-MM-DD'),
          title: `${day.type_name}${day.target_distance_km ? ` - ${day.target_distance_km}km` : ''}`
        };
      })
      .filter((day: any) => !day.title.startsWith('Rest'));

    if (trainingDays.length > 0) {
      try {
        await cancelAllScheduledNotifications();
        await scheduleWeekRunReminders(trainingDays);
        console.log(`Scheduled ${trainingDays.length} run reminders for template plan`);
      } catch (error) {
        console.error('Error scheduling notifications for template plan:', error);
      }
    }

    return newPlan.id;
  } catch (error) {
    console.error('Error creating plan from template:', error);
    throw error;
  }
}

/**
 * Fetch plan days with extended fields
 * @param planId The plan ID to fetch days for
 * @returns Promise<Array> Array of plan days with all fields
 */
export async function fetchPlanDays(planId: string): Promise<Array<{
  id: string;
  date: string;
  type_name: string;
  target_distance_km: number | null;
  target_duration_min: number | null;
  target_pace_sec_per_km: number | null;
  tip: string | null;
}>> {
  if (!planId) {
    return [];
  }

  const { data, error } = await supabase
    .from('plan_days')
    .select('id, date, type_name, target_distance_km, target_duration_min, target_pace_sec_per_km, tip')
    .eq('plan_id', planId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching plan days:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get the most recent plan ID for the authenticated athlete
 * @returns Promise<string | null> The most recent plan ID or null if none found
 */
export async function getMostRecentPlanId(): Promise<string | null> {
  try {
    const athleteId = await getAthleteId(); // Use real auth instead of mock
    
    const { data, error } = await supabase
      .from('plans')
      .select('id')
      .eq('athlete_id', athleteId)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching most recent plan:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error getting most recent plan ID:', error);
    return null;
  }
}

/**
 * Get the active plan with its days and details
 * @returns Promise<{plan: Plan, days: PlanDay[]} | null> The active plan with days or null if none found
 */
export async function getActivePlanWithDays(): Promise<{
  plan: {
    id: string;
    athlete_id: string;
    start_date: string;
    coach_note: string | null;
  };
  days: Array<{
    id: string;
    date: string;
    type_name: string;
    target_distance_km: number | null;
    target_duration_min: number | null;
    target_pace_sec_per_km: number | null;
    tip: string | null;
  }>;
} | null> {
  try {
    const athleteId = await getAthleteId(); // Use real auth instead of mock
    
    // Get the most recent plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, athlete_id, start_date, coach_note')
      .eq('athlete_id', athleteId)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (planError && planError.code !== 'PGRST116') {
      console.error('Error fetching active plan:', planError);
      return null;
    }

    if (!plan) {
      return null;
    }

    // Get all days for this plan
    const { data: days, error: daysError } = await supabase
      .from('plan_days')
      .select('id, date, type_name, target_distance_km, target_duration_min, target_pace_sec_per_km, tip')
      .eq('plan_id', plan.id)
      .order('date', { ascending: true });

    if (daysError) {
      console.error('Error fetching plan days:', daysError);
      return { plan, days: [] };
    }

    return {
      plan,
      days: days || []
    };
  } catch (error) {
    console.error('Error getting active plan with days:', error);
    return null;
  }
}

/**
 * Update the coach note for a plan
 * @param planId The plan ID to update
 * @param note The new coach note
 * @returns Promise<boolean> Success status
 */
export async function updateCoachNote(planId: string, note: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('plans')
      .update({ coach_note: note.trim() || null })
      .eq('id', planId);

    if (error) {
      console.error('Error updating coach note:', error);
      return false;
    }

    console.log('Coach note updated successfully');
    return true;
  } catch (error) {
    console.error('Network error updating coach note:', error);
    return false;
  }
}

