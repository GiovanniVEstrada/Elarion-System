import { createContext, useContext } from "react";
import useHabits from "../hooks/useHabits";

const HabitsContext = createContext(null);

export function HabitsProvider({ children }) {
  const habits = useHabits();
  return <HabitsContext.Provider value={habits}>{children}</HabitsContext.Provider>;
}

export function useHabitsContext() {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabitsContext must be used inside HabitsProvider");
  return ctx;
}
