import { View, Text } from "react-native";
import dayjs from "dayjs";



export default function DayCard({ date, type, km, completed }: {date:string; type:string; km?:number; completed?:boolean}) {
  return (
    <View className="bg-card rounded-xl p-4 mb-3 border border-[#232326]">
      <View className="flex-row justify-between items-center">
        <Text className="text-text font-semibold">{String(dayjs(date).format("ddd, MMM D"))}</Text>
        <View className={`px-2 py-1 rounded-md ${completed ? "bg-[#A6FF97]" : "bg-[#232326]"}`}>
          <Text className={`text-xs ${completed ? "text-black" : "text-weak"}`}>{completed ? "Done" : "Planned"}</Text>
        </View>
      </View>
      <Text className="text-weak mt-1">{String(type)}{km ? ` • ${km} km` : ""}</Text>
    </View>
  );
}
