import { supabase } from './supabase';
import dayjs from 'dayjs';

export interface WeeklyRecap {
  runsCompleted: number;
  totalKm: number;
  totalMinutes: number;
  avgPaceSecPerKm: number | null;
  longestRunKm: number;
  streakWeeks: number;
}

export interface CompletionWithDay {
  id: string;
  plan_day_id: string;
  completed_at: string;
  distance_km: number | null;
  duration_min: number | null;
  avg_pace_sec_per_km: number | null;
  plan_day: {
    date: string;
    type_name: string;
    target_distance_km: number | null;
    target_duration_min: number | null;
  };
}

/**
 * Get weekly recap statistics for a given week
 * @param weekStart The start date of the week (YYYY-MM-DD format)
 * @returns Promise<WeeklyRecap> Weekly statistics
 */
export async function getWeeklyRecap(weekStart: string): Promise<WeeklyRecap> {
  try {
    const startDate = dayjs(weekStart).toISOString();
    const endDate = dayjs(weekStart).add(6, 'days').endOf('day').toISOString();

    // Query completions with plan_days data for the week
    const { data, error } = await supabase
      .from('completions')
      .select(`
        id,
        plan_day_id,
        completed_at,
        distance_km,
        duration_min,
        avg_pace_sec_per_km,
        plan_days!inner (
          date,
          type_name,
          target_distance_km,
          target_duration_min
        )
      `)
      .gte('plan_days.date', startDate)
      .lte('plan_days.date', endDate)
      .order('plan_days.date', { ascending: true });

    if (error) {
      console.error('Error fetching weekly recap:', error);
      return getEmptyRecap();
    }

    const completions = data as any[] || [];

    // Calculate basic stats
    const runsCompleted = completions.length;
    let totalKm = 0;
    let totalMinutes = 0;
    let longestRunKm = 0;
    let totalPaceWeightedDistance = 0;
    let totalDistanceForPace = 0;

    // Process each completion
    for (const completion of completions) {
      // Use actual distance if available, otherwise fall back to target
      const distance = completion.distance_km || completion.plan_days.target_distance_km || 0;
      const duration = completion.duration_min || completion.plan_days.target_duration_min || 0;
      const pace = completion.avg_pace_sec_per_km;

      totalKm += distance;
      totalMinutes += duration;
      longestRunKm = Math.max(longestRunKm, distance);

      // For average pace calculation (weighted by distance)
      if (pace && distance > 0) {
        totalPaceWeightedDistance += pace * distance;
        totalDistanceForPace += distance;
      }
    }

    // Calculate weighted average pace
    const avgPaceSecPerKm = totalDistanceForPace > 0 
      ? totalPaceWeightedDistance / totalDistanceForPace 
      : null;

    // Calculate streak weeks (simplified - just check if current week has runs)
    const streakWeeks = runsCompleted > 0 ? 1 : 0; // TODO: Implement proper streak calculation

    return {
      runsCompleted,
      totalKm: Math.round(totalKm * 10) / 10, // Round to 1 decimal
      totalMinutes: Math.round(totalMinutes),
      avgPaceSecPerKm: avgPaceSecPerKm ? Math.round(avgPaceSecPerKm) : null,
      longestRunKm: Math.round(longestRunKm * 10) / 10, // Round to 1 decimal
      streakWeeks
    };

  } catch (error) {
    console.error('Network error fetching weekly recap:', error);
    return getEmptyRecap();
  }
}

/**
 * Get detailed completions for a specific week
 * @param weekStart The start date of the week (YYYY-MM-DD format)
 * @returns Promise<CompletionWithDay[]> Array of completions with plan day details
 */
export async function getWeeklyCompletions(weekStart: string): Promise<CompletionWithDay[]> {
  try {
    const startDate = dayjs(weekStart).toISOString();
    const endDate = dayjs(weekStart).add(6, 'days').endOf('day').toISOString();

    const { data, error } = await supabase
      .from('completions')
      .select(`
        id,
        plan_day_id,
        completed_at,
        distance_km,
        duration_min,
        avg_pace_sec_per_km,
        plan_days!inner (
          date,
          type_name,
          target_distance_km,
          target_duration_min
        )
      `)
      .gte('plan_days.date', startDate)
      .lte('plan_days.date', endDate)
      .order('plan_days.date', { ascending: true });

    if (error) {
      console.error('Error fetching weekly completions:', error);
      return [];
    }

    return (data as any[] || []).map(item => ({
      id: item.id,
      plan_day_id: item.plan_day_id,
      completed_at: item.completed_at,
      distance_km: item.distance_km,
      duration_min: item.duration_min,
      avg_pace_sec_per_km: item.avg_pace_sec_per_km,
      plan_day: {
        date: item.plan_days.date,
        type_name: item.plan_days.type_name,
        target_distance_km: item.plan_days.target_distance_km,
        target_duration_min: item.plan_days.target_duration_min
      }
    }));

  } catch (error) {
    console.error('Network error fetching weekly completions:', error);
    return [];
  }
}

/**
 * Format pace from seconds per km to MM:SS format
 * @param paceSecPerKm Pace in seconds per kilometer
 * @returns Formatted pace string (e.g., "4:30")
 */
export function formatPace(paceSecPerKm: number | null): string {
  if (!paceSecPerKm) return '--:--';
  
  const minutes = Math.floor(paceSecPerKm / 60);
  const seconds = Math.round(paceSecPerKm % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format duration from minutes to hours and minutes
 * @param minutes Duration in minutes
 * @returns Formatted duration string (e.g., "1h 23m" or "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get an empty recap object for error cases
 */
function getEmptyRecap(): WeeklyRecap {
  return {
    runsCompleted: 0,
    totalKm: 0,
    totalMinutes: 0,
    avgPaceSecPerKm: null,
    longestRunKm: 0,
    streakWeeks: 0
  };
}
