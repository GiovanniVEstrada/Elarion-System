import { createContext, useContext } from "react";
import useJournal from "../hooks/useJournal";

const JournalContext = createContext(null);

export function JournalProvider({ children }) {
  const journal = useJournal();
  return (
    <JournalContext.Provider value={journal}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournalContext() {
  const context = useContext(JournalContext);
  if (!context) throw new Error("useJournalContext must be used inside JournalProvider");
  return context;
}