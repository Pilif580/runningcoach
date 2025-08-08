import { View, Text, Pressable, ScrollView } from "react-native";
import { tokens } from "../../../src/theme/tokens";

export default function Settings() {
  const settingsOptions = [
    { title: "Profile", subtitle: "Manage your athlete profile", action: () => console.log("Profile") },
    { title: "Threshold Pace", subtitle: "Set your current threshold pace", action: () => console.log("Threshold") },
    { title: "Training Preferences", subtitle: "Days, times, and preferences", action: () => console.log("Preferences") },
    { title: "Data & Privacy", subtitle: "Manage your data and privacy settings", action: () => console.log("Privacy") },
    { title: "About", subtitle: "App version and information", action: () => console.log("About") },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: tokens.bg, padding: 16 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {settingsOptions.map((option, index) => (
          <Pressable
            key={index}
            onPress={option.action}
            style={{
              backgroundColor: tokens.card,
              padding: 16,
              borderRadius: tokens.radius.md,
              marginBottom: 12,
            }}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text style={{ color: tokens.text, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
                  {option.title}
                </Text>
                <Text style={{ color: tokens.textWeak, fontSize: 14 }}>
                  {option.subtitle}
                </Text>
              </View>
              <Text style={{ color: tokens.primary, fontSize: 16 }}>→</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

