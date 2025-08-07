import { View, Text, Pressable, FlatList } from "react-native";
import dayjs from "dayjs";
import { tokens } from "../../src/theme/tokens";
import { generateWeek } from "../../src/logic/generatePlan";
import { Link } from "expo-router";


export default function Plan() {
    <Link href="/plan"><Text style={{ color:"#39FF14", marginTop:16 }}>Open Plan</Text></Link>

  const week = generateWeek(
    { goal:"5k", goalDate: dayjs().add(8,'weeks').toISOString(), thresholdPaceSec: 360, trainDays:[1,3,5,6] },
    dayjs().startOf('week').add(1,'day').toISOString()
  );
  return (
    <View style={{ flex:1, backgroundColor: tokens.bg, padding:16 }}>
      <Text style={{ color: tokens.text, fontSize:18, marginBottom:12 }}>Your Week</Text>
      <FlatList
        data={week}
        keyExtractor={(i)=>i.date}
        renderItem={({item})=>(
          <View style={{ backgroundColor: tokens.card, padding:16, borderRadius: tokens.radius.md, marginBottom:10 }}>
            <Text style={{ color: tokens.text }}>{dayjs(item.date).format("ddd, MMM D")} — {item.type_name}</Text>
            {item.target_distance_km ? <Text style={{ color: tokens.textWeak }}>{item.target_distance_km} km</Text> : null}
          </View>
        )}
      />
      <Pressable style={{ backgroundColor: tokens.primary, padding:14, borderRadius: tokens.radius.xl, alignItems:"center" }}>
        <Text>Generate (stub)</Text>
      </Pressable>
    </View>
  );
}
