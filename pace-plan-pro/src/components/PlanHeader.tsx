import { View, Text, Pressable, Modal, TextInput, Alert } from "react-native";
import { useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { tokens } from "../theme/tokens";
import { updateCoachNote } from "../data/planService";

// Enable relative time plugin
dayjs.extend(relativeTime);

interface Plan {
  id: string;
  athlete_id: string;
  start_date: string;
  coach_note: string | null;
}

interface PlanDay {
  id: string;
  date: string;
  type_name: string;
  target_distance_km: number | null;
  target_duration_min: number | null;
  target_pace_sec_per_km: number | null;
  tip: string | null;
}

interface PlanHeaderProps {
  plan: Plan | null;
  days: PlanDay[];
  completions: Record<string, boolean>;
  onNoteUpdated?: () => void;
}

export default function PlanHeader({ plan, days, completions, onNoteUpdated }: PlanHeaderProps) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(plan?.coach_note || '');
  const [saving, setSaving] = useState(false);

  if (!plan || days.length === 0) {
    return null;
  }

  // Find next run (closest upcoming plan_day by date)
  const today = dayjs();
  const upcomingDays = days.filter(day => dayjs(day.date).isAfter(today, 'day'));
  const nextRun = upcomingDays.length > 0 ? upcomingDays[0] : null;

  // Calculate "This week" progress
  const startOfWeek = today.startOf('week');
  const endOfWeek = today.endOf('week');
  
  const thisWeekDays = days.filter(day => {
    const dayDate = dayjs(day.date);
    return dayDate.isAfter(startOfWeek.subtract(1, 'day')) && dayDate.isBefore(endOfWeek.add(1, 'day'));
  });

  const targetDistance = thisWeekDays.reduce((sum, day) => sum + (day.target_distance_km || 0), 0);
  const completedDays = thisWeekDays.filter(day => completions[day.id]);
  const completedDistance = completedDays.reduce((sum, day) => sum + (day.target_distance_km || 0), 0);

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      const success = await updateCoachNote(plan.id, noteText);
      if (success) {
        setIsEditingNote(false);
        onNoteUpdated?.();
      } else {
        Alert.alert('Error', 'Failed to save note. Please try again.');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNoteText(plan.coach_note || '');
    setIsEditingNote(false);
  };

  return (
    <>
      <View style={{ 
        backgroundColor: tokens.card, 
        borderRadius: tokens.radius.xl, 
        padding: 20, 
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#232326'
      }}>
        {/* Next Run Section */}
        {nextRun && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: tokens.textWeak, fontSize: 14, marginBottom: 4 }}>
              Next Run
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '600' }}>
                  {nextRun.type_name}
                  {nextRun.target_distance_km && ` • ${nextRun.target_distance_km} km`}
                </Text>
                <Text style={{ color: tokens.textWeak, fontSize: 14 }}>
                  {dayjs(nextRun.date).format('dddd, MMM D')}
                </Text>
              </View>
              <View style={{ 
                backgroundColor: tokens.primary, 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: tokens.radius.md 
              }}>
                <Text style={{ color: '#000', fontSize: 12, fontWeight: '600' }}>
                  {dayjs(nextRun.date).fromNow()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* This Week Progress */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: tokens.textWeak, fontSize: 14, marginBottom: 4 }}>
            This Week
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '600' }}>
              {completedDistance.toFixed(1)} / {targetDistance.toFixed(1)} km
            </Text>
            <Text style={{ color: tokens.textWeak, fontSize: 14 }}>
              {completedDays.length} / {thisWeekDays.length} runs
            </Text>
          </View>
          {/* Progress Bar */}
          <View style={{ 
            backgroundColor: '#232326', 
            height: 4, 
            borderRadius: 2, 
            marginTop: 8,
            overflow: 'hidden'
          }}>
            <View style={{
              backgroundColor: tokens.primary,
              height: '100%',
              width: `${targetDistance > 0 ? Math.min((completedDistance / targetDistance) * 100, 100) : 0}%`,
              borderRadius: 2
            }} />
          </View>
        </View>

        {/* Coach Note Section */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: tokens.textWeak, fontSize: 14 }}>
              Coach Note
            </Text>
            <Pressable
              onPress={() => setIsEditingNote(true)}
              style={{ 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: tokens.radius.md,
                backgroundColor: '#232326'
              }}
            >
              <Text style={{ color: tokens.primary, fontSize: 12, fontWeight: '500' }}>
                Edit
              </Text>
            </Pressable>
          </View>
          
          <Text style={{ 
            color: plan.coach_note ? tokens.text : tokens.textWeak, 
            fontSize: 15,
            fontStyle: plan.coach_note ? 'normal' : 'italic'
          }}>
            {plan.coach_note || 'Add note'}
          </Text>
        </View>
      </View>

      {/* Edit Note Modal */}
      <Modal
        visible={isEditingNote}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: tokens.bg, padding: 16 }}>
          {/* Modal Header */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            paddingTop: 20, 
            marginBottom: 30 
          }}>
            <Pressable onPress={handleCancelEdit}>
              <Text style={{ color: tokens.primary, fontSize: 16 }}>Cancel</Text>
            </Pressable>
            <Text style={{ color: tokens.text, fontSize: 18, fontWeight: '600' }}>
              Edit Coach Note
            </Text>
            <Pressable onPress={handleSaveNote} disabled={saving}>
              <Text style={{ 
                color: saving ? tokens.textWeak : tokens.primary, 
                fontSize: 16, 
                fontWeight: '600' 
              }}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>

          {/* Text Input */}
          <TextInput
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Add a coach note for this plan..."
            placeholderTextColor={tokens.textWeak}
            multiline
            numberOfLines={6}
            style={{
              backgroundColor: tokens.card,
              color: tokens.text,
              padding: 16,
              borderRadius: tokens.radius.md,
              fontSize: 16,
              textAlignVertical: 'top',
              minHeight: 120
            }}
            autoFocus
          />

          <Text style={{ 
            color: tokens.textWeak, 
            fontSize: 14, 
            marginTop: 12,
            textAlign: 'center'
          }}>
            Add motivational notes, weekly focus, or training reminders
          </Text>
        </View>
      </Modal>
    </>
  );
}
