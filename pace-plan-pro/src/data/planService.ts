import { supabase } from './supabase';
import dayjs from 'dayjs';
import { generateWeek, type PlanDay } from '../logic/generatePlan';
import { DEV_UUID } from '../config';

// Re-export DEV_UUID for backward compatibility
export { DEV_UUID };

async function getAthleteId(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      return user.id;
    }
  } catch (error) {
    console.log('No authenticated user, using dev UUID');
  }
  return DEV_UUID;
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

    return newPlan.id;
  } catch (error) {
    console.error('Error checking existing plan:', error);
    throw error;
  }
}

export async function fetchPlanDays(planId: string): Promise<PlanDay[]> {
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
async function insertDays(planId: string, days: Array<{ dayOfWeek: number; type_name: string; target_distance_km?: number }>, startOfWeek: string) {
  const daysToInsert = days.map((day) => {
    const date = dayjs(startOfWeek).add(day.dayOfWeek, "day");
    return {
      plan_id: planId,
      date: date.toISOString(),
      type_name: day.type_name,
      target_distance_km: day.target_distance_km
    };
  });

  const { error: daysError } = await supabase
    .from('plan_days')
    .insert(daysToInsert);

  if (daysError) {
    console.error('Error creating plan days:', daysError);
    throw daysError;
  }
}

export async function createPlanFromTemplate(templateId: string, templateDays: Array<{ dayOfWeek: number; type_name: string; target_distance_km?: number }>): Promise<string> {
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

    // Insert plan_days using helper
    await insertDays(newPlan.id, templateDays, startOfWeek.toISOString());

    return newPlan.id;
  } catch (error) {
    console.error('Error creating plan from template:', error);
    throw error;
  }
}

