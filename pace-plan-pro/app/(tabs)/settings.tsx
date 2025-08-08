import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { tokens } from "../../src/theme/tokens";
import { signOut } from "../../src/data/session";
import { useRouter } from "expo-router";

export default function Settings() {
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            const success = await signOut();
            if (success) {
              router.replace('/(auth)/login');
            } else {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          }
        }
      ]
    );
  };

  const settingsOptions = [
    { title: "Profile", subtitle: "Manage your athlete profile", action: () => console.log("Profile") },
    { title: "Threshold Pace", subtitle: "Set your current threshold pace", action: () => console.log("Threshold") },
    { title: "Training Preferences", subtitle: "Days, times, and preferences", action: () => console.log("Preferences") },
    { title: "Data & Privacy", subtitle: "Manage your data and privacy settings", action: () => console.log("Privacy") },
    { title: "About", subtitle: "App version and information", action: () => console.log("About") },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, padding: 16 }}>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
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

        {/* Sign Out Section */}
        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: tokens.card }}>
          <Pressable
            onPress={handleSignOut}
            style={{
              backgroundColor: tokens.card,
              padding: 16,
              borderRadius: tokens.radius.md,
              borderWidth: 1,
              borderColor: '#EF4444',
            }}
          >
            <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: "600", textAlign: 'center' }}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
