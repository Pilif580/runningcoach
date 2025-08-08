import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import dayjs from "dayjs";
import { tokens } from "../../../src/theme/tokens";
import { captureEvent } from "../../../src/analytics";
import { 
  getWeeklyRecap, 
  getWeeklyCompletions, 
  formatPace, 
  formatDuration,
  type WeeklyRecap,
  type CompletionWithDay 
} from "../../../src/data/statsService";

export default function RecapPage() {
  const { weekStart } = useLocalSearchParams<{ weekStart: string }>();
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [completions, setCompletions] = useState<CompletionWithDay[]>([]);
  const [loading, setLoading] = useState(true);

  const targetWeek = weekStart || dayjs().subtract(1, 'week').startOf('week').format('YYYY-MM-DD');
  const weekLabel = dayjs(targetWeek).format('MMM D') + ' - ' + dayjs(targetWeek).add(6, 'days').format('MMM D, YYYY');

  useEffect(() => {
    loadWeeklyData();
    
    // Track detailed recap view
    captureEvent('recap_viewed', { 
      weekStart: targetWeek,
      source: 'detailed_page'
    });
  }, [targetWeek]);

  const loadWeeklyData = async () => {
    setLoading(true);
    try {
      const [recapData, completionsData] = await Promise.all([
        getWeeklyRecap(targetWeek),
        getWeeklyCompletions(targetWeek)
      ]);
      
      setRecap(recapData);
      setCompletions(completionsData);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCompletion = ({ item }: { item: CompletionWithDay }) => {
    const actualDistance = item.distance_km || item.plan_day.target_distance_km || 0;
    const actualDuration = item.duration_min || item.plan_day.target_duration_min || 0;
    const dayName = dayjs(item.plan_day.date).format('dddd');
    const date = dayjs(item.plan_day.date).format('MMM D');

    return (
      <View style={{ 
        backgroundColor: tokens.card, 
        borderRadius: tokens.radius.md, 
        padding: 16, 
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#232326'
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View>
            <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '600', marginBottom: 2 }}>
              {item.plan_day.type_name}
            </Text>
            <Text style={{ color: tokens.textWeak, fontSize: 14 }}>
              {dayName}, {date}
            </Text>
          </View>
          
          <View style={{ 
            backgroundColor: tokens.primary, 
            paddingHorizontal: 8, 
            paddingVertical: 4, 
            borderRadius: tokens.radius.md 
          }}>
            <Text style={{ color: '#000', fontSize: 12, fontWeight: '600' }}>
              ✓ Done
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {actualDistance > 0 && (
            <View>
              <Text style={{ color: tokens.textWeak, fontSize: 12 }}>Distance</Text>
              <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '600' }}>
                {actualDistance} km
              </Text>
            </View>
          )}
          
          {actualDuration > 0 && (
            <View>
              <Text style={{ color: tokens.textWeak, fontSize: 12 }}>Duration</Text>
              <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '600' }}>
                {formatDuration(actualDuration)}
              </Text>
            </View>
          )}
          
          {item.avg_pace_sec_per_km && (
            <View>
              <Text style={{ color: tokens.textWeak, fontSize: 12 }}>Pace</Text>
              <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '600' }}>
                {formatPace(item.avg_pace_sec_per_km)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bg, padding: 16 }}>
        <Text style={{ color: tokens.textWeak, fontSize: 16, textAlign: 'center', marginTop: 40 }}>
          Loading weekly recap...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        paddingTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#232326'
      }}>
        <Pressable 
          onPress={() => router.back()}
          style={{ marginRight: 16 }}
        >
          <Text style={{ color: tokens.primary, fontSize: 16 }}>← Back</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: tokens.text, fontSize: 18, fontWeight: '600' }}>
            Weekly Recap
          </Text>
          <Text style={{ color: tokens.textWeak, fontSize: 14 }}>
            {weekLabel}
          </Text>
        </View>
      </View>

      {!recap || recap.runsCompleted === 0 ? (
        <View style={{ flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: tokens.textWeak, fontSize: 16, textAlign: 'center' }}>
            No runs completed this week
          </Text>
        </View>
      ) : (
        <FlatList
          data={completions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ marginBottom: 20 }}>
              {/* Summary Card */}
              <View style={{ 
                backgroundColor: tokens.card, 
                borderRadius: tokens.radius.xl, 
                padding: 20, 
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#232326'
              }}>
                <Text style={{ color: tokens.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                  Week Summary
                </Text>
                
                {/* Stats Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -12 }}>
                  <View style={{ width: '50%', paddingHorizontal: 12, marginBottom: 16 }}>
                    <Text style={{ color: tokens.textWeak, fontSize: 12, marginBottom: 4 }}>
                      Total Runs
                    </Text>
                    <Text style={{ color: tokens.text, fontSize: 24, fontWeight: '600' }}>
                      {recap.runsCompleted}
                    </Text>
                  </View>
                  
                  <View style={{ width: '50%', paddingHorizontal: 12, marginBottom: 16 }}>
                    <Text style={{ color: tokens.textWeak, fontSize: 12, marginBottom: 4 }}>
                      Total Distance
                    </Text>
                    <Text style={{ color: tokens.text, fontSize: 24, fontWeight: '600' }}>
                      {recap.totalKm} km
                    </Text>
                  </View>
                  
                  <View style={{ width: '50%', paddingHorizontal: 12, marginBottom: 16 }}>
                    <Text style={{ color: tokens.textWeak, fontSize: 12, marginBottom: 4 }}>
                      Total Time
                    </Text>
                    <Text style={{ color: tokens.text, fontSize: 24, fontWeight: '600' }}>
                      {formatDuration(recap.totalMinutes)}
                    </Text>
                  </View>
                  
                  <View style={{ width: '50%', paddingHorizontal: 12, marginBottom: 16 }}>
                    <Text style={{ color: tokens.textWeak, fontSize: 12, marginBottom: 4 }}>
                      Avg Pace
                    </Text>
                    <Text style={{ color: tokens.text, fontSize: 24, fontWeight: '600' }}>
                      {formatPace(recap.avgPaceSecPerKm)}
                    </Text>
                  </View>
                </View>

                {/* Additional Stats */}
                {recap.longestRunKm > 0 && (
                  <View style={{ 
                    borderTopWidth: 1, 
                    borderTopColor: '#232326', 
                    paddingTop: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  }}>
                    <Text style={{ color: tokens.textWeak, fontSize: 14 }}>
                      Longest run: <Text style={{ color: tokens.text, fontWeight: '600' }}>{recap.longestRunKm} km</Text>
                    </Text>
                    {recap.streakWeeks > 0 && (
                      <Text style={{ color: tokens.primary, fontSize: 14, fontWeight: '500' }}>
                        🔥 {recap.streakWeeks}w streak
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Run Details Header */}
              <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                Run Details
              </Text>
            </View>
          }
          renderItem={renderCompletion}
        />
      )}
    </SafeAreaView>
  );
}
