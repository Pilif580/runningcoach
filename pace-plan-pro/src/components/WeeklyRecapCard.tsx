import { View, Text, Pressable } from "react-native";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { tokens } from "../theme/tokens";
import { getWeeklyRecap, formatPace, formatDuration, type WeeklyRecap } from "../data/statsService";
import { captureEvent } from "../analytics";
import { router } from "expo-router";

interface WeeklyRecapCardProps {
  weekStart?: string; // If not provided, uses last week
}

export default function WeeklyRecapCard({ weekStart }: WeeklyRecapCardProps) {
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [loading, setLoading] = useState(true);

  // Default to last week if no weekStart provided
  const targetWeek = weekStart || dayjs().subtract(1, 'week').startOf('week').format('YYYY-MM-DD');
  const weekLabel = dayjs(targetWeek).format('MMM D') + ' - ' + dayjs(targetWeek).add(6, 'days').format('MMM D');

  useEffect(() => {
    loadRecap();
  }, [targetWeek]);

  const loadRecap = async () => {
    setLoading(true);
    try {
      const recapData = await getWeeklyRecap(targetWeek);
      setRecap(recapData);
    } catch (error) {
      console.error('Error loading weekly recap:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    // Track recap viewed event
    captureEvent('recap_viewed', { 
      weekStart: targetWeek,
      source: 'summary_card',
      runsCompleted: recap?.runsCompleted || 0,
      totalKm: recap?.totalKm || 0
    });
    
    router.push({
      pathname: '/(tabs)/plan/recap',
      params: { weekStart: targetWeek }
    });
  };

  if (loading) {
    return (
      <View style={{ 
        backgroundColor: tokens.card, 
        borderRadius: tokens.radius.xl, 
        padding: 20, 
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#232326'
      }}>
        <Text style={{ color: tokens.textWeak, fontSize: 16, textAlign: 'center' }}>
          Loading recap...
        </Text>
      </View>
    );
  }

  if (!recap || recap.runsCompleted === 0) {
    return (
      <View style={{ 
        backgroundColor: tokens.card, 
        borderRadius: tokens.radius.xl, 
        padding: 20, 
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#232326'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '600' }}>
            Last Week ({weekLabel})
          </Text>
        </View>
        <Text style={{ color: tokens.textWeak, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
          No runs completed last week
        </Text>
      </View>
    );
  }

  return (
    <Pressable onPress={handleViewDetails}>
      <View style={{ 
        backgroundColor: tokens.card, 
        borderRadius: tokens.radius.xl, 
        padding: 20, 
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#232326'
      }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '600' }}>
            Last Week ({weekLabel})
          </Text>
          <Text style={{ color: tokens.primary, fontSize: 14, fontWeight: '500' }}>
            View details →
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
          {/* Runs Completed */}
          <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 12 }}>
            <Text style={{ color: tokens.textWeak, fontSize: 12, marginBottom: 2 }}>
              Runs
            </Text>
            <Text style={{ color: tokens.text, fontSize: 20, fontWeight: '600' }}>
              {recap.runsCompleted}
            </Text>
          </View>

          {/* Total Distance */}
          <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 12 }}>
            <Text style={{ color: tokens.textWeak, fontSize: 12, marginBottom: 2 }}>
              Distance
            </Text>
            <Text style={{ color: tokens.text, fontSize: 20, fontWeight: '600' }}>
              {recap.totalKm} km
            </Text>
          </View>

          {/* Total Time */}
          <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 12 }}>
            <Text style={{ color: tokens.textWeak, fontSize: 12, marginBottom: 2 }}>
              Time
            </Text>
            <Text style={{ color: tokens.text, fontSize: 20, fontWeight: '600' }}>
              {formatDuration(recap.totalMinutes)}
            </Text>
          </View>

          {/* Average Pace */}
          <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 12 }}>
            <Text style={{ color: tokens.textWeak, fontSize: 12, marginBottom: 2 }}>
              Avg Pace
            </Text>
            <Text style={{ color: tokens.text, fontSize: 20, fontWeight: '600' }}>
              {formatPace(recap.avgPaceSecPerKm)}
            </Text>
          </View>
        </View>

        {/* Additional Stats */}
        {recap.longestRunKm > 0 && (
          <View style={{ 
            borderTopWidth: 1, 
            borderTopColor: '#232326', 
            paddingTop: 12, 
            marginTop: 4,
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
            <Text style={{ color: tokens.textWeak, fontSize: 14 }}>
              Longest run: {recap.longestRunKm} km
            </Text>
            {recap.streakWeeks > 0 && (
              <Text style={{ color: tokens.primary, fontSize: 14, fontWeight: '500' }}>
                🔥 {recap.streakWeeks}w streak
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
