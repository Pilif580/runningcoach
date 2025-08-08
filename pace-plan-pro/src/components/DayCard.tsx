import { View, Text, Pressable } from "react-native";
import dayjs from "dayjs";
import { useState } from "react";
import { markDayComplete, unmarkDayComplete, syncQueue } from "../data/completionsService";

interface DayCardProps {
  id: string;
  date: string;
  type: string;
  km?: number;
  completed?: boolean;
  onCompletionChange?: (id: string, completed: boolean) => void;
}

export default function DayCard({ id, date, type, km, completed = false, onCompletionChange }: DayCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(completed);

  const handleToggleComplete = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const newCompletedState = !localCompleted;
    
    // Optimistically update local state
    setLocalCompleted(newCompletedState);
    onCompletionChange?.(id, newCompletedState);

    try {
      if (newCompletedState) {
        // Mark as complete
        await markDayComplete(id);
      } else {
        // Unmark as complete
        await unmarkDayComplete(id);
      }
      
      // Sync any queued operations
      await syncQueue();
    } catch (error) {
      console.error('Error toggling completion:', error);
      
      // Revert optimistic update on error
      setLocalCompleted(!newCompletedState);
      onCompletionChange?.(id, !newCompletedState);
    } finally {
      setIsLoading(false);
    }
  };

  // Use local state if it differs from prop (for optimistic updates)
  const displayCompleted = localCompleted;

  return (
    <View className="bg-card rounded-xl p-4 mb-3 border border-[#232326]">
      <View className="flex-row justify-between items-center">
        <Text className="text-text font-semibold">{String(dayjs(date).format("ddd, MMM D"))}</Text>
        
        {/* Status and Toggle Button */}
        <View className="flex-row items-center gap-2">
          {/* Status Pill */}
          <View className={`px-2 py-1 rounded-md ${displayCompleted ? "bg-[#A6FF97]" : "bg-[#232326]"}`}>
            <Text className={`text-xs ${displayCompleted ? "text-black" : "text-weak"}`}>
              {displayCompleted ? "Done" : "Planned"}
            </Text>
          </View>
          
          {/* Toggle Button */}
          <Pressable
            onPress={handleToggleComplete}
            disabled={isLoading}
            className={`px-3 py-1 rounded-md ${
              displayCompleted 
                ? "bg-[#FF6B6B]" 
                : "bg-[#39FF14]"
            } ${isLoading ? "opacity-50" : ""}`}
          >
            <Text className={`text-xs font-medium ${
              displayCompleted ? "text-white" : "text-black"
            }`}>
              {isLoading ? "..." : (displayCompleted ? "Unmark" : "Mark")}
            </Text>
          </Pressable>
        </View>
      </View>
      <Text className="text-weak mt-1">{String(type)}{km ? ` • ${km} km` : ""}</Text>
    </View>
  );
}
