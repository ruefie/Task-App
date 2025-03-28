// src/components/Home.jsx
import React, { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTasks } from "../contexts/TasksContext";
import { Clock, CheckSquare, AlertTriangle,RefreshCw  } from "lucide-react";
import styles from "../styles/Home.module.scss";

function Home() {
  const { user, profile } = useAuth();
  const { tasks, loading, error, loadTasks } = useTasks();

  // Helper: compute total time (in seconds) from timer entries.
  // If the entry.duration exists, it is used (converted to number),
  // otherwise the time difference from start_time to end_time (or now if still running) is calculated.
  const calculateTotalTimeSpent = (timerEntries) => {
    if (!timerEntries || timerEntries.length === 0) return 0;
    return timerEntries.reduce((total, entry) => {
      if (!entry.start_time) return total;
      // Use the duration field if it exists (ensuring it's a number)
      if (entry.duration != null && Number(entry.duration) > 0) {
        return total + Number(entry.duration);
      }
      // Otherwise, compute the difference between end_time (or now if missing) and start_time.
      const start = new Date(entry.start_time).getTime();
      const end = entry.end_time
        ? new Date(entry.end_time).getTime()
        : Date.now();
      return total + Math.floor((end - start) / 1000);
    }, 0);
  };

  // Map tasks to include a computedTime property based on their timer entries.
  // We assume that each task has a "timer_entries" property (as provided by TasksContext).
  const tasksWithTime = tasks.map((task) => ({
    ...task,
    computedTime: calculateTotalTimeSpent(task.timer_entries || []),
  }));

  // Compute stats based on tasksWithTime.
  const taskStats = useMemo(
    () => ({
      total: tasksWithTime.length,
      completed: tasksWithTime.filter((task) => task.completed).length,
      urgent: tasksWithTime.filter((task) => task.priority === "Urgent").length,
      totalTime: tasksWithTime.reduce(
        (total, task) => total + task.computedTime,
        0
      ),
    }),
    [tasksWithTime]
  );

  // Format seconds into a string like "Xh Ym"
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsLeft = seconds % 60;
    return `${hours}h ${minutes}m ${secondsLeft}s`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
  <h1>Hallo {profile?.first_name}!</h1>
  <button onClick={loadTasks} className={styles.refreshButton}>
    <RefreshCw size={16} />
    Refresh
  </button>
</div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.homeLoading}>Loading your tasks...</p>
      ) : (
        <div className={styles.homeGrid}>
          <div className={styles.card}>
            <h2>Task Overview</h2>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <CheckSquare size={20} />
                <div>
                  <h3>Tasks</h3>
                  <p>
                    {taskStats.completed} / {taskStats.total} completed
                  </p>
                </div>
              </div>
              <div className={styles.statItem}>
                <AlertTriangle size={20} />
                <div>
                  <h3>Urgent</h3>
                  <p>{taskStats.urgent} tasks</p>
                </div>
              </div>
              <div className={styles.statItem}>
                <Clock size={20} />
                <div>
                  <h3>Total Time Tracked</h3>
                  <p>{formatTime(taskStats.totalTime)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Recent Tasks</h2>
            {tasksWithTime.length === 0 ? (
              <p>No tasks yet. Add some tasks to get started!</p>
            ) : (
              <div className={styles.recentTasks}>
                {tasksWithTime.slice(0, 5).map((task) => (
                  <div key={task.id}
                  className={`${styles.taskItem} ${styles[task.priority?.toLowerCase() || "normal"]}`}>
                    <div className={styles.taskHeader}>
                      <h3>{task.name}</h3>
                      <span
                        className={`${styles.tag} ${styles[task.priority?.toLowerCase() || "normal"]}`}
                      >
                        {task.priority || "Normal"}
                      </span>
                    </div>
                    <div className={styles.taskMeta}>
                      <span>{task.project || "No project"}</span>
                      <span>•</span>
                      <span>Due: {task.due_date || "Not set"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
