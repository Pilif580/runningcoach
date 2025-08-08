import { View, Text, FlatList, Pressable, Modal, TextInput, Alert } from "react-native";
import { useState, useEffect } from "react";
import { Link } from "expo-router";
import { tokens } from "../../src/theme/tokens";
import { supabase } from "../../src/data/supabase";

type CustomRunType = {
  id: string;
  name: string;
  intensity: number;
  pace_percentage: number;
  structure?: string;
  created_at?: string;
};

type NewRunType = {
  name: string;
  intensity: string;
  pace_percentage: string;
  structure: string;
};

export default function RunTypes() {
  const [runTypes, setRunTypes] = useState<CustomRunType[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newRunType, setNewRunType] = useState<NewRunType>({
    name: "",
    intensity: "",
    pace_percentage: "",
    structure: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRunTypes();
  }, []);

  const fetchRunTypes = async () => {
    try {
      // First try with created_at ordering
      let data: CustomRunType[] | null = null;
      let error: any = null;
      
      const result = await supabase
        .from("custom_run_types")
        .select("id, name, intensity, pace_percentage, structure, created_at")
        .order("created_at", { ascending: false });
      
      data = result.data as CustomRunType[];
      error = result.error;

      // If created_at column doesn't exist, retry without ordering
      if (error && error.code === "42703") {
        const fallbackResult = await supabase
          .from("custom_run_types")
          .select("id, name, intensity, pace_percentage, structure")
          .order("name", { ascending: true });
        
        data = fallbackResult.data as CustomRunType[];
        error = fallbackResult.error;
      }

      if (error) throw error;
      setRunTypes(data || []);
    } catch (error) {
      console.error("Error fetching run types:", error);
    } finally {
      setLoading(false);
    }
  };

  const createRunType = async () => {
    if (!newRunType.name.trim() || !newRunType.intensity || !newRunType.pace_percentage) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const intensity = parseInt(newRunType.intensity);
    const pacePercentage = parseInt(newRunType.pace_percentage);

    if (intensity < 1 || intensity > 5) {
      Alert.alert("Error", "Intensity must be between 1 and 5");
      return;
    }

    if (pacePercentage < 50 || pacePercentage > 150) {
      Alert.alert("Error", "Pace percentage should be between 50% and 150%");
      return;
    }

    try {
      const { error } = await supabase
        .from("custom_run_types")
        .insert({
          name: newRunType.name.trim(),
          intensity: intensity,
          pace_percentage: pacePercentage,
          structure: newRunType.structure.trim() || null
        });

      if (error) throw error;

      setNewRunType({ name: "", intensity: "", pace_percentage: "", structure: "" });
      setIsModalVisible(false);
      fetchRunTypes();
    } catch (error) {
      console.error("Error creating run type:", error);
      Alert.alert("Error", "Failed to create run type");
    }
  };

  const deleteRunType = (runType: CustomRunType) => {
    Alert.alert(
      "Delete Run Type",
      `Are you sure you want to delete "${runType.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("custom_run_types")
                .delete()
                .eq("id", runType.id);

              if (error) throw error;
              fetchRunTypes();
            } catch (error) {
              console.error("Error deleting run type:", error);
              Alert.alert("Error", "Failed to delete run type");
            }
          }
        }
      ]
    );
  };

  const getIntensityText = (intensity: number) => {
    const labels = ["", "Easy", "Moderate", "Tempo", "Hard", "Max"];
    return labels[intensity] || "Unknown";
  };

  const renderRunType = ({ item }: { item: CustomRunType }) => (
    <View style={{ backgroundColor: tokens.card, padding: 16, borderRadius: tokens.radius.md, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: tokens.text, fontSize: 18, fontWeight: "600", marginBottom: 4 }}>
            {item.name}
          </Text>
          <Text style={{ color: tokens.textWeak, marginBottom: 2 }}>
            Intensity: {item.intensity}/5 ({String(getIntensityText(item.intensity))})
          </Text>
          <Text style={{ color: tokens.textWeak, marginBottom: 8 }}>
            Pace: {item.pace_percentage}% of threshold
          </Text>
          {item.structure && (
            <Text style={{ color: tokens.textWeak, fontSize: 14 }}>
              Structure: {item.structure}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => deleteRunType(item)}
          style={{ padding: 8 }}
        >
          <Text style={{ color: "#FF6B6B", fontSize: 18 }}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Header */}
      <View style={{ padding: 16, paddingTop: 20 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: tokens.text, fontSize: 24, fontWeight: "600", textAlign: "center" }}>
            Run Types
          </Text>
        </View>
      </View>

      {/* Run Types List */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {loading ? (
          <Text style={{ color: tokens.textWeak, textAlign: "center", marginTop: 40 }}>
            Loading run types...
          </Text>
        ) : runTypes.length === 0 ? (
          <Text style={{ color: tokens.textWeak, textAlign: "center", marginTop: 40 }}>
            No custom run types yet. Tap + to create one!
          </Text>
        ) : (
          <FlatList
            data={runTypes}
            keyExtractor={(item) => item.id}
            renderItem={renderRunType}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Floating Add Button */}
      <Pressable
        onPress={() => setIsModalVisible(true)}
        style={{
          position: "absolute",
          bottom: 30,
          right: 20,
          backgroundColor: tokens.primary,
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: tokens.primary,
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 8
        }}
      >
        <Text style={{ color: "#000", fontSize: 24, fontWeight: "600" }}>+</Text>
      </Pressable>

      {/* Create Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: tokens.bg, padding: 16 }}>
          {/* Modal Header */}
          <View style={{ paddingTop: 20, marginBottom: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable onPress={() => setIsModalVisible(false)}>
                <Text style={{ color: tokens.primary, fontSize: 16 }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: tokens.text, fontSize: 18, fontWeight: "600" }}>
                New Run Type
              </Text>
              <Pressable onPress={createRunType}>
                <Text style={{ color: tokens.primary, fontSize: 16, fontWeight: "600" }}>Save</Text>
              </Pressable>
            </View>
          </View>

          {/* Form Fields */}
          <View>
            <Text style={{ color: tokens.text, marginBottom: 8, fontWeight: "500" }}>
              Name *
            </Text>
            <TextInput
              value={newRunType.name}
              onChangeText={(text) => setNewRunType(prev => ({ ...prev, name: text }))}
              placeholder="e.g., Fartlek, Hill Repeats"
              placeholderTextColor={tokens.textWeak}
              style={{
                backgroundColor: tokens.card,
                color: tokens.text,
                padding: 12,
                borderRadius: tokens.radius.md,
                marginBottom: 20
              }}
            />

            <Text style={{ color: tokens.text, marginBottom: 8, fontWeight: "500" }}>
              Intensity (1-5) *
            </Text>
            <TextInput
              value={newRunType.intensity}
              onChangeText={(text) => setNewRunType(prev => ({ ...prev, intensity: text }))}
              placeholder="1 = Easy, 5 = Max effort"
              placeholderTextColor={tokens.textWeak}
              keyboardType="numeric"
              style={{
                backgroundColor: tokens.card,
                color: tokens.text,
                padding: 12,
                borderRadius: tokens.radius.md,
                marginBottom: 20
              }}
            />

            <Text style={{ color: tokens.text, marginBottom: 8, fontWeight: "500" }}>
              Pace % of Threshold *
            </Text>
            <TextInput
              value={newRunType.pace_percentage}
              onChangeText={(text) => setNewRunType(prev => ({ ...prev, pace_percentage: text }))}
              placeholder="e.g., 85 (85% of threshold pace)"
              placeholderTextColor={tokens.textWeak}
              keyboardType="numeric"
              style={{
                backgroundColor: tokens.card,
                color: tokens.text,
                padding: 12,
                borderRadius: tokens.radius.md,
                marginBottom: 20
              }}
            />

            <Text style={{ color: tokens.text, marginBottom: 8, fontWeight: "500" }}>
              Structure (Optional)
            </Text>
            <TextInput
              value={newRunType.structure}
              onChangeText={(text) => setNewRunType(prev => ({ ...prev, structure: text }))}
              placeholder="e.g., 4x800m @ 5K pace, 2min rest"
              placeholderTextColor={tokens.textWeak}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: tokens.card,
                color: tokens.text,
                padding: 12,
                borderRadius: tokens.radius.md,
                height: 80,
                textAlignVertical: "top"
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
