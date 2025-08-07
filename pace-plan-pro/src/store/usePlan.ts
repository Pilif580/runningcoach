import { create } from "zustand";

type Day = { date: string; type: string; km?: number; completed?: boolean; };
type State = { week: Day[]; toggleComplete: (date: string)=>void; setWeek: (w:Day[])=>void; };

export const usePlan = create<State>((set) => ({
  week: [],
  setWeek: (w)=> set({ week: w }),
  toggleComplete: (date)=> set((s)=> ({
    week: s.week.map(d => d.date === date ? {...d, completed: !d.completed} : d)
  })),
}));
