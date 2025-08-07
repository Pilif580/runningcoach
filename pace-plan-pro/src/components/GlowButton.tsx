import { Pressable, Text, View } from "react-native";

export default function GlowButton({ label, onPress }: {label: string; onPress?: ()=>void}) {
  return (
    <View className="rounded-xl" style={{ shadowColor: "#39FF14", shadowOpacity: 0.5, shadowRadius: 12 }}>
      <Pressable onPress={onPress} className="bg-primary rounded-xl px-5 py-4 items-center justify-center">
        <Text className="text-black font-semibold">{label}</Text>
      </Pressable>
    </View>
  );
}
