import { View, Text, FlatList, Pressable, Modal, ScrollView } from "react-native";
import { useState } from "react";
import { Link, router } from "expo-router";
import { tokens } from "../../src/theme/tokens";
import { createPlanFromTemplate } from "../../src/data/planService";
import dayjs from "dayjs";

type PlanTemplate = {
  id: string;
  title: string;
  weeks: number;
  load: "Low" | "Medium" | "High";
  description: string;
  planDays: Array<{
    dayOfWeek: number;
    type_name: string;
    target_distance_km?: number;
  }>;
};

const templates: PlanTemplate[] = [
  {
    id: "5k_beginner",
    title: "5K Beginner",
    weeks: 8,
    load: "Low",
    description: "Perfect for running your first 5K",
    planDays: [
      { dayOfWeek: 1, type_name: "Easy Run", target_distance_km: 2 },
      { dayOfWeek: 2, type_name: "Rest" },
      { dayOfWeek: 3, type_name: "Easy Run", target_distance_km: 3 },
      { dayOfWeek: 4, type_name: "Rest" },
      { dayOfWeek: 5, type_name: "Easy Run", target_distance_km: 2 },
      { dayOfWeek: 6, type_name: "Long Run", target_distance_km: 4 },
      { dayOfWeek: 0, type_name: "Rest" }
    ]
  },
  {
    id: "10k_base",
    title: "10K Base",
    weeks: 10,
    load: "Medium",
    description: "Build endurance for 10K racing",
    planDays: [
      { dayOfWeek: 1, type_name: "Easy Run", target_distance_km: 5 },
      { dayOfWeek: 2, type_name: "Tempo", target_distance_km: 6 },
      { dayOfWeek: 3, type_name: "Rest" },
      { dayOfWeek: 4, type_name: "Intervals", target_distance_km: 5 },
      { dayOfWeek: 5, type_name: "Easy Run", target_distance_km: 4 },
      { dayOfWeek: 6, type_name: "Long Run", target_distance_km: 8 },
      { dayOfWeek: 0, type_name: "Rest" }
    ]
  },
  {
    id: "half_marathon",
    title: "Half Marathon",
    weeks: 12,
    load: "High",
    description: "Train for your first or fastest 13.1 miles",
    planDays: [
      { dayOfWeek: 1, type_name: "Easy Run", target_distance_km: 6 },
      { dayOfWeek: 2, type_name: "Tempo", target_distance_km: 8 },
      { dayOfWeek: 3, type_name: "Easy Run", target_distance_km: 5 },
      { dayOfWeek: 4, type_name: "Intervals", target_distance_km: 7 },
      { dayOfWeek: 5, type_name: "Rest" },
      { dayOfWeek: 6, type_name: "Long Run", target_distance_km: 12 },
      { dayOfWeek: 0, type_name: "Rest" }
    ]
  }
];

async function applyTemplate(template: PlanTemplate) {
  try {
    await createPlanFromTemplate(template.id, template.planDays);
    console.log("Template applied successfully");
    router.push("/(tabs)/plan");
  } catch (error) {
    console.error("Error applying template:", error);
  }
}

export default function Library() {
  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(null);

  const renderTemplate = ({ item }: { item: PlanTemplate }) => (
    <Pressable
      onPress={() => setSelectedTemplate(item)}
      style={{ marginBottom: 12 }}
    >
      <View style={{ backgroundColor: tokens.card, padding: 16, borderRadius: tokens.radius.md }}>
        <Text style={{ color: tokens.text, fontSize: 18, fontWeight: "600", marginBottom: 4 }}>
          {item.title} ({item.weeks} weeks)
        </Text>
        <Text style={{ color: tokens.textWeak, marginBottom: 8 }}>
          {item.description}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: tokens.textWeak, fontSize: 14 }}>
            Weekly Load: {item.load}
          </Text>
          <Text style={{ color: tokens.primary, fontSize: 14, fontWeight: "500" }}>
            Tap to Preview →
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, padding: 16 }}>
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: tokens.text, fontSize: 24, fontWeight: "600", textAlign: "center" }}>
          Plan Library
        </Text>
      </View>

      {/* Templates List */}
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        renderItem={renderTemplate}
        showsVerticalScrollIndicator={false}
      />

      {/* Preview Modal */}
      <Modal
        visible={!!selectedTemplate}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: tokens.bg, padding: 16 }}>
          {selectedTemplate && (
            <>
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <Pressable onPress={() => setSelectedTemplate(null)}>
                  <Text style={{ color: tokens.primary, fontSize: 16 }}>Cancel</Text>
                </Pressable>
                <Text style={{ color: tokens.text, fontSize: 18, fontWeight: "600" }}>
                  {selectedTemplate.title}
                </Text>
                <View style={{ width: 60 }} />
              </View>

              {/* Template Info */}
              <View style={{ backgroundColor: tokens.card, padding: 16, borderRadius: tokens.radius.md, marginBottom: 20 }}>
                <Text style={{ color: tokens.text, fontSize: 16, marginBottom: 8 }}>
                  {selectedTemplate.description}
                </Text>
                <Text style={{ color: tokens.textWeak }}>
                  Duration: {selectedTemplate.weeks} weeks • Load: {selectedTemplate.load}
                </Text>
              </View>

              {/* First Week Preview */}
              <Text style={{ color: tokens.text, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                Sample Week Schedule:
              </Text>
              
              <ScrollView style={{ flex: 1, marginBottom: 20 }}>
                {selectedTemplate.planDays.map((day, index) => (
                  <View
                    key={index}
                    style={{ backgroundColor: tokens.card, padding: 12, borderRadius: tokens.radius.md, marginBottom: 8 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: tokens.text }}>
                        {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day.dayOfWeek]}
                      </Text>
                      <Text style={{ color: tokens.textWeak }}>
                        {day.type_name}{day.target_distance_km ? ` • ${day.target_distance_km} km` : ""}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Apply Button */}
              <Pressable
                onPress={() => {
                  applyTemplate(selectedTemplate);
                  setSelectedTemplate(null);
                }}
                style={{ backgroundColor: tokens.primary, padding: 16, borderRadius: tokens.radius.xl, alignItems: "center" }}
              >
                <Text style={{ color: "#000", fontSize: 16, fontWeight: "600" }}>
                  Apply Plan
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
