import { createContext, useContext } from "react";
import useMoods, { MOOD_OPTIONS } from "../hooks/useMoods";
export { MOOD_OPTIONS };

const MoodsContext = createContext(null);

export function MoodsProvider({ children }) {
  const moods = useMoods();
  return <MoodsContext.Provider value={moods}>{children}</MoodsContext.Provider>;
}

export function useMoodsContext() {
  const ctx = useContext(MoodsContext);
  if (!ctx) throw new Error("useMoodsContext must be used inside MoodsProvider");
  return ctx;
}
