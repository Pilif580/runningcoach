import { supabase } from './supabase';
import { queueOperation, getQueuedOperations, removeQueuedOperation } from './db';
import { captureEvent } from '../analytics';

// Types
interface CompletionPayload {
  distanceKm?: number;
  durationMin?: number;
  avgPaceSecPerKm?: number;
}

interface Completion {
  id: string;
  plan_day_id: string;
  completed_at: string;
  distance_km?: number;
  duration_min?: number;
  avg_pace_sec_per_km?: number;
}

// In-memory cache for completion status
const completionCache = new Map<string, boolean>();

/**
 * Mark a day as complete
 * @param planDayId The plan day ID to mark as complete
 * @param payload Optional completion data (distance, duration, pace)
 */
export async function markDayComplete(planDayId: string, payload?: CompletionPayload): Promise<void> {
  try {
    // Prepare the completion record
    const completionData = {
      plan_day_id: planDayId,
      completed_at: new Date().toISOString(),
      distance_km: payload?.distanceKm || null,
      duration_min: payload?.durationMin || null,
      avg_pace_sec_per_km: payload?.avgPaceSecPerKm || null
    };

    // Try to insert into Supabase
    const { error } = await supabase
      .from('completions')
      .insert(completionData);

    if (error) {
      console.error('Error marking day complete in Supabase:', error);
      // Queue the operation for offline sync
      queueOperation('INSERT', 'completions', completionData);
    } else {
      console.log('Day marked complete successfully');
      // Update cache
      completionCache.set(planDayId, true);
      
      // Track completion event
      captureEvent('day_completed', { 
        planDayId,
        hasDistance: !!payload?.distanceKm,
        hasDuration: !!payload?.durationMin,
        hasPace: !!payload?.avgPaceSecPerKm
      });
    }
  } catch (error) {
    console.error('Network error marking day complete:', error);
    // Queue the operation for offline sync
    const completionData = {
      plan_day_id: planDayId,
      completed_at: new Date().toISOString(),
      distance_km: payload?.distanceKm || null,
      duration_min: payload?.durationMin || null,
      avg_pace_sec_per_km: payload?.avgPaceSecPerKm || null
    };
    queueOperation('INSERT', 'completions', completionData);
  }
}

/**
 * Unmark a day as complete (delete completion record)
 * @param planDayId The plan day ID to unmark
 */
export async function unmarkDayComplete(planDayId: string): Promise<void> {
  try {
    // Try to delete from Supabase
    const { error } = await supabase
      .from('completions')
      .delete()
      .eq('plan_day_id', planDayId);

    if (error) {
      console.error('Error unmarking day complete in Supabase:', error);
      // Queue the delete operation for offline sync
      queueOperation('DELETE', 'completions', { plan_day_id: planDayId });
    } else {
      console.log('Day unmarked complete successfully');
      // Update cache
      completionCache.set(planDayId, false);
      
      // Track uncomplete event
      captureEvent('day_uncompleted', { planDayId });
    }
  } catch (error) {
    console.error('Network error unmarking day complete:', error);
    // Queue the delete operation for offline sync
    queueOperation('DELETE', 'completions', { plan_day_id: planDayId });
  }
}

/**
 * Check if a day is complete
 * @param planDayId The plan day ID to check
 * @returns Promise<boolean> True if the day is complete
 */
export async function isDayComplete(planDayId: string): Promise<boolean> {
  // Check cache first
  if (completionCache.has(planDayId)) {
    return completionCache.get(planDayId)!;
  }

  try {
    // Query Supabase
    const { data, error } = await supabase
      .from('completions')
      .select('id')
      .eq('plan_day_id', planDayId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking completion status:', error);
      return false;
    }

    const isComplete = !!data;
    // Update cache
    completionCache.set(planDayId, isComplete);
    return isComplete;
  } catch (error) {
    console.error('Network error checking completion status:', error);
    return false;
  }
}

/**
 * Get completion details for a day
 * @param planDayId The plan day ID
 * @returns Promise<Completion | null> The completion record or null if not found
 */
export async function getCompletionDetails(planDayId: string): Promise<Completion | null> {
  try {
    const { data, error } = await supabase
      .from('completions')
      .select('*')
      .eq('plan_day_id', planDayId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching completion details:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Network error fetching completion details:', error);
    return null;
  }
}

/**
 * Sync queued operations to Supabase
 * This should be called when the app comes back online
 */
export async function syncQueue(): Promise<void> {
  const queuedOperations = getQueuedOperations();
  
  if (queuedOperations.length === 0) {
    console.log('No queued operations to sync');
    return;
  }

  console.log(`Syncing ${queuedOperations.length} queued operations`);

  for (const operation of queuedOperations) {
    try {
      let success = false;

      switch (operation.op) {
        case 'INSERT':
          if (operation.table_name === 'completions') {
            const { error } = await supabase
              .from('completions')
              .insert(operation.payload);
            
            if (!error) {
              success = true;
              // Update cache
              completionCache.set(operation.payload.plan_day_id, true);
            } else {
              console.error('Error syncing INSERT operation:', error);
            }
          }
          break;

        case 'DELETE':
          if (operation.table_name === 'completions') {
            const { error } = await supabase
              .from('completions')
              .delete()
              .eq('plan_day_id', operation.payload.plan_day_id);
            
            if (!error) {
              success = true;
              // Update cache
              completionCache.set(operation.payload.plan_day_id, false);
            } else {
              console.error('Error syncing DELETE operation:', error);
            }
          }
          break;

        default:
          console.warn('Unknown operation type:', operation.op);
          success = true; // Remove unknown operations
      }

      // Remove successful operations from queue
      if (success) {
        removeQueuedOperation(operation.id);
        console.log(`Successfully synced operation ${operation.id}`);
      }
    } catch (error) {
      console.error('Error syncing operation:', operation.id, error);
      // Continue with next operation, don't break the loop
    }
  }

  const remainingOperations = getQueuedOperations();
  console.log(`Sync complete. ${remainingOperations.length} operations remaining in queue`);
}

/**
 * Clear the completion cache
 * Useful when switching between different plans or users
 */
export function clearCompletionCache(): void {
  completionCache.clear();
  console.log('Completion cache cleared');
}

/**
 * Load completion statuses for multiple plan days
 * More efficient than calling isDayComplete for each day individually
 * @param planDayIds Array of plan day IDs
 * @returns Promise<Map<string, boolean>> Map of planDayId to completion status
 */
export async function loadCompletionStatuses(planDayIds: string[]): Promise<Map<string, boolean>> {
  if (planDayIds.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await supabase
      .from('completions')
      .select('plan_day_id')
      .in('plan_day_id', planDayIds);

    if (error) {
      console.error('Error loading completion statuses:', error);
      return new Map();
    }

    const completionMap = new Map<string, boolean>();
    const completedIds = new Set(data.map(item => item.plan_day_id));

    // Set status for all requested IDs
    for (const planDayId of planDayIds) {
      const isComplete = completedIds.has(planDayId);
      completionMap.set(planDayId, isComplete);
      // Update cache
      completionCache.set(planDayId, isComplete);
    }

    return completionMap;
  } catch (error) {
    console.error('Network error loading completion statuses:', error);
    return new Map();
  }
}
