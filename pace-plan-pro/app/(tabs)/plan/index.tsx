import { View, FlatList, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tokens } from "../../../src/theme/tokens";
import DayCard from "../../../src/components/DayCard";
import PlanHeader from "../../../src/components/PlanHeader";
import WeeklyRecapCard from "../../../src/components/WeeklyRecapCard";
import { useState, useEffect } from "react";
import { getActivePlanWithDays } from "../../../src/data/planService";
import { loadCompletionStatuses, syncQueue } from "../../../src/data/completionsService";
import { useCallback } from "react";

type Plan = {
  id: string;
  athlete_id: string;
  start_date: string;
  coach_note: string | null;
};

type PlanDay = {
  id: string;
  date: string;
  type_name: string;
  target_distance_km: number | null;
  target_duration_min: number | null;
  target_pace_sec_per_km: number | null;
  tip: string | null;
};

export default function Plan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [completionByDay, setCompletionByDay] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPlanData();
  }, []);

  const loadPlanData = async () => {
    try {
      // Get the active plan with days
      const planData = await getActivePlanWithDays();
      
      if (planData) {
        setPlan(planData.plan);
        setDays(planData.days);
        
        // Load completion statuses for all days
        if (planData.days.length > 0) {
          const dayIds = planData.days.map(day => day.id);
          const completionStatuses = await loadCompletionStatuses(dayIds);
          
          // Convert Map to Record for easier access
          const completionRecord: Record<string, boolean> = {};
          completionStatuses.forEach((completed, dayId) => {
            completionRecord[dayId] = completed;
          });
          
          setCompletionByDay(completionRecord);
        } else {
          setCompletionByDay({});
        }
      } else {
        console.log("No plans found for athlete");
        setPlan(null);
        setDays([]);
        setCompletionByDay({});
      }
    } catch (error) {
      console.error("Error loading plan:", error);
      setPlan(null);
      setDays([]);
      setCompletionByDay({});
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Sync any pending operations first
      await syncQueue();
      
      // Then reload the plan data
      await loadPlanData();
    } catch (error) {
      console.error("Error refreshing plan:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleCompletionChange = (dayId: string, completed: boolean) => {
    // Update the completion record
    setCompletionByDay(prev => ({
      ...prev,
      [dayId]: completed
    }));
  };

  const handleNoteUpdated = () => {
    // Refetch the plan data when note is updated
    loadPlanData();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bg }}>
      {days.length === 0 ? (
        <View style={{ flex: 1, padding: 16 }}>
          <FlatList
            data={[]}
            renderItem={() => null}
            contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={tokens.primary}
                colors={[tokens.primary]}
              />
            }
            ListEmptyComponent={
              <Text style={{ color: tokens.textWeak, fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
                No days yet. Apply a plan from Library.
              </Text>
            }
          />
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <>
              <PlanHeader 
                plan={plan}
                days={days}
                completions={completionByDay}
                onNoteUpdated={handleNoteUpdated}
              />
              <WeeklyRecapCard />
            </>
          }
          renderItem={({ item }) => (
            <DayCard
              id={item.id}
              date={item.date}
              type={item.type_name}
              km={item.target_distance_km || undefined}
              completed={!!completionByDay[item.id]}
              onCompletionChange={handleCompletionChange}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.primary}
              colors={[tokens.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
