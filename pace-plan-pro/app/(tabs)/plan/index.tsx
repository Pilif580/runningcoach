import { View, FlatList } from "react-native";
import { tokens } from "../../../src/theme/tokens";
import DayCard from "../../../src/components/DayCard";
import GlowButton from "../../../src/components/GlowButton";
import { useState, useEffect } from "react";
import { createPlanIfNotExists, fetchPlanDays } from "../../../src/data/planService";

type PlanDayFromDB = {
  id: string;
  date: string;
  type_name: string;
  target_distance_km?: number;
};

export default function Plan() {
  const [days, setDays] = useState<PlanDayFromDB[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const planId = await createPlanIfNotExists("placeholder_athlete_123");
        const planDays = await fetchPlanDays(planId);
        setDays(planDays);
      } catch (error) {
        console.error("Error loading plan:", error);
      }
    })();
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: tokens.bg, padding: 16 }}>
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
      />
      <GlowButton label="Mark First As Done" onPress={() => days[0] && console.log("First day:", days[0])} />
    </View>
  );
}