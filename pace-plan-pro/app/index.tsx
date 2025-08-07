import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View className="flex-1 bg-bg items-center justify-center">
      <Text className="text-text text-xl">Pace Plan Pro</Text>
      <Link href="/plan"><Text className="text-primary mt-4">Open Plan</Text></Link>
    </View>
  );
}
