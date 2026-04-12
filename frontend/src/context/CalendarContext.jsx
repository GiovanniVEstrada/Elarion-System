import { createContext, useContext } from "react";
import useCalendar from "../hooks/useCalendar";

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  const calendar = useCalendar();
  return (
    <CalendarContext.Provider value={calendar}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendarContext must be used inside CalendarProvider");
  return context;
}