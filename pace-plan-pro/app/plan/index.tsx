import { View, FlatList } from "react-native";
import { tokens } from "../../src/theme/tokens";
import DayCard from "../../src/components/DayCard";
import GlowButton from "../../src/components/GlowButton";
import dayjs from "dayjs";
import { generateWeek } from "../../src/logic/generatePlan";
import { usePlan } from "../../src/store/usePlan";

export default function Plan() {
  const { week, setWeek, toggleComplete } = usePlan();

  // seed once (fake data for now)
  if (week.length === 0) {
    const w = generateWeek(
      { goal:"5k", goalDate: dayjs().add(8,'weeks').toISOString(), thresholdPaceSec: 360, trainDays:[1,3,5,6] },
      dayjs().startOf('week').add(1,'day').toISOString()
    ).map(d => ({ date:d.date, type:d.type_name, km:d.target_distance_km }));
    setWeek(w);
  }

  return (
    <View className="flex-1" style={{ backgroundColor: tokens.bg, padding: 16 }}>
      <FlatList
        data={week}
        keyExtractor={(i)=>i.date}
        renderItem={({item})=> (
          <View onTouchEnd={()=>toggleComplete(item.date)}>
            <DayCard date={item.date} type={item.type} km={item.km} completed={item.completed}/>
          </View>
        )}
      />
      <GlowButton label="Mark First As Done" onPress={()=> week[0] && toggleComplete(week[0].date)} />
    </View>
  );
}
