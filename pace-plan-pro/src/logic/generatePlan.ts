type Goal = "5k"|"10k"|"hm"|"fm";
type Input = { goal: Goal; goalDate: string; thresholdPaceSec: number; trainDays: number[]; };

export type PlanDay = { 
  date: string; 
  type_name: string; 
  target_distance_km?: number; 
  target_duration_min?: number; 
  target_pace_sec_per_km?: number; 
  tip?: string; 
};

export function generateWeek(input: Input, weekStartISO: string): PlanDay[] {
  const start = new Date(weekStartISO);
  const types = ["Easy","Tempo","Rest","Intervals","Easy","Long","Rest"];
  return Array.from({length:7}).map((_,i)=> {
    const d = new Date(start); 
    d.setDate(d.getDate()+i);
    const dayName = types[i];
    const isTrain = input.trainDays.includes(i); // 0=Mon
    const dist = isTrain ? (dayName==="Long"? 10 : dayName==="Tempo"? 6 : 5) : undefined;
    return {
      date: d.toISOString(),
      type_name: isTrain ? dayName : "Rest",
      target_distance_km: dist
    };
  });
}