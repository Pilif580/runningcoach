import { supabase } from './supabase';
import dayjs from 'dayjs';
import { generateWeek, type PlanDay } from '../logic/generatePlan';

export async function createPlanIfNotExists(athleteId: string): Promise<string> {
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

  // Map to plan_days format
  const daysToInsert = week.map((day: PlanDay) => ({
    plan_id: newPlan.id,
    date: day.date,
    type_name: day.type_name,
    target_distance_km: day.target_distance_km
  }));

  // Insert plan_days
  const { error: daysError } = await supabase
    .from('plan_days')
    .insert(daysToInsert);

  if (daysError) {
    console.error('Error creating plan days:', daysError);
    throw daysError;
  }

  return newPlan.id;
}

export async function fetchPlanDays(planId: string) {
  const { data, error } = await supabase
    .from('plan_days')
    .select('*')
    .eq('plan_id', planId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching plan days:', error);
    throw error;
  }

  return data || [];
}

