import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { tasksService } from "../lib/tasks";
import { useAuth } from "./AuthContext";

const TasksContext = createContext();

export const TasksProvider = ({ children }) => {
  const { isAdmin, user } = useAuth();
  const [tasks, setTasks] = useState([]);  // Initialize with empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await tasksService.getTasks({ admin: isAdmin });
      let filtered = !isAdmin && user ? tasksData.filter((task) => task.user_id === user.id) : tasksData;
      filtered = filtered.map(task => ({
        ...task,
        timer_entries: task.timer_entries || [],
        task_attachments: task.task_attachments || [],
        timeSpent: calculateTotalTimeSpent(task.timer_entries || []),
        isTimerRunning: (task.timer_entries || []).some((entry) => !entry.end_time),
        attachments: task.task_attachments || [],
        timerEntries: task.timer_entries || [],
        _prevMilestone: task.milestone !== "Done" ? task.milestone : null,
      }));
      setTasks(filtered || []);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError("Failed to load tasks. Please try again.");
      setTasks([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  // Helper function to calculate total time spent
  const calculateTotalTimeSpent = (timerEntries) => {
    if (!timerEntries || timerEntries.length === 0) return 0;
    return timerEntries.reduce((total, entry) => {
      if (!entry.start_time) return total;
      if (entry.duration != null && Number(entry.duration) > 0) {
        return total + Number(entry.duration);
      }
      const start = new Date(entry.start_time).getTime();
      const end = entry.end_time
        ? new Date(entry.end_time).getTime()
        : Date.now();
      return total + Math.floor((end - start) / 1000);
    }, 0);
  };

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <TasksContext.Provider value={{ tasks, setTasks, loadTasks, loading, error }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => useContext(TasksContext);