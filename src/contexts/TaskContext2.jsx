// src/contexts/TasksContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { tasksService } from '../lib/tasks';

const TasksContext = createContext();

export const TasksProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  const loadTasks = async (params = { admin: false }) => {
    try {
      setLoadingTasks(true);
      setTasksError(null);
      const data = await tasksService.getTasks(params);
      setTasks(data);
    } catch (error) {
      setTasksError(error.message);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Optionally, auto-load tasks on mount.
  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <TasksContext.Provider value={{ tasks, setTasks, loadTasks, loadingTasks, tasksError }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => useContext(TasksContext);
