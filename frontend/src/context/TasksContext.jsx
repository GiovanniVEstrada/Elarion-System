import { createContext, useContext } from "react";
import useTasks from "../hooks/useTasks";

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const tasks = useTasks();
  return (
    <TasksContext.Provider value={tasks}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasksContext() {
  const context = useContext(TasksContext);
  if (!context) throw new Error("useTasksContext must be used inside TasksProvider");
  return context;
}