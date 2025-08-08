import { View, FlatList, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tokens } from "../../src/theme/tokens";
import DayCard from "../../src/components/DayCard";
import { useState, useEffect } from "react";
import { createPlanIfNotExists, fetchPlanDays, type PlanDay } from "../../src/data/planService";

export default function Plan() {
  const [days, setDays] = useState<PlanDay[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const planId = await createPlanIfNotExists();
        const planDays = await fetchPlanDays(planId);
        setDays(planDays);
      } catch (error) {
        console.error("Error loading plan:", error);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bg, padding: 16 }}>
      {days.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: tokens.textWeak, fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
            No training plan yet
          </Text>
          <Text style={{ color: tokens.textWeak, fontSize: 14, textAlign: 'center' }}>
            Your weekly plan will appear here once generated
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
              km={item.target_distance_km}
              completed={false}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
