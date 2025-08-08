import { View, FlatList, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tokens } from "../../src/theme/tokens";
import DayCard from "../../src/components/DayCard";
import { useState, useEffect } from "react";
import { fetchPlanDays, getMostRecentPlanId } from "../../src/data/planService";

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
  const [days, setDays] = useState<PlanDay[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // Get the most recent plan ID for the dev athlete
        const planId = await getMostRecentPlanId();
        
        if (planId) {
          const planDays = await fetchPlanDays(planId);
          setDays(planDays);
        } else {
          console.log("No plans found for athlete");
          setDays([]);
        }
      } catch (error) {
        console.error("Error loading plan:", error);
        setDays([]); // Set empty array on error
      }
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bg, padding: 16 }}>
      {days.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: tokens.textWeak, fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
            No days yet. Apply a plan from Library.
          </Text>
        </View>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DayCard
              date={item.date}
              type={item.type_name}
              km={item.target_distance_km || undefined}
              completed={false}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
