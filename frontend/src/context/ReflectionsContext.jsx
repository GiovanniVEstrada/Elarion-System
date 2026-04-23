import { createContext, useContext } from "react";
import useReflections from "../hooks/useReflections";

const ReflectionsContext = createContext(null);

export function ReflectionsProvider({ children }) {
  const reflections = useReflections();
  return <ReflectionsContext.Provider value={reflections}>{children}</ReflectionsContext.Provider>;
}

export function useReflectionsContext() {
  const ctx = useContext(ReflectionsContext);
  if (!ctx) throw new Error("useReflectionsContext must be used inside ReflectionsProvider");
  return ctx;
}
