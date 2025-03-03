import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckSquare, AlertTriangle } from 'lucide-react';
import { tasksService } from '../lib/tasks';
import styles from '../styles/Home.module.scss';

function Home() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const tasksData = await tasksService.getTasks();
        console.log('Home - Loaded tasks:', tasksData?.length || 0);
        setTasks(tasksData?.map(task => ({
          ...task,
          timeSpent: calculateTotalTimeSpent(task.timer_entries || []),
          timerEntries: task.timer_entries || []
        })) || []);
      } catch (error) {
        console.error('Error loading tasks:', error);
        setError('Failed to load tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const calculateTotalTimeSpent = (timerEntries) => {
    if (!timerEntries || timerEntries.length === 0) return 0;
    
    return timerEntries.reduce((total, entry) => {
      if (entry.duration) {
        return total + entry.duration;
      }
      if (entry.end_time) {
        return total + Math.floor((new Date(entry.end_time) - new Date(entry.start_time)) / 1000);
      }
      if (!entry.end_time) {
        return total + Math.floor((new Date() - new Date(entry.start_time)) / 1000);
      }
      return total;
    }, 0);
  };

  // Calculate task statistics
  const taskStats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(task => task.completed).length,
      urgent: tasks.filter(task => task.priority === 'Urgent').length,
      totalTime: tasks.reduce((total, task) => total + (task.timeSpent || 0), 0)
    };
  }, [tasks]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={styles.container}>
      <h1>Welcome back!</h1>
      <p className={styles.email}>{user?.email}</p>
      
      {error && <p className={styles.error}>{error}</p>}
      
      {loading ? (
        <p>Loading your tasks...</p>
      ) : (
        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Task Overview</h2>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <CheckSquare size={20} />
                <div>
                  <h3>Tasks</h3>
                  <p>{taskStats.completed} / {taskStats.total} completed</p>
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
                  <h3>Time Tracked</h3>
                  <p>{formatTime(taskStats.totalTime)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.card}>
            <h2>Recent Tasks</h2>
            {tasks.length === 0 ? (
              <p>No tasks yet. Add some tasks to get started!</p>
            ) : (
              <div className={styles.recentTasks}>
                {tasks.slice(0, 5).map(task => (
                  <div key={task.id} className={styles.taskItem}>
                    <div className={styles.taskHeader}>
                      <h3>{task.name}</h3>
                      <span className={`${styles.tag} ${styles[task.priority?.toLowerCase() || 'normal']}`}>
                        {task.priority || 'Normal'}
                      </span>
                    </div>
                    <div className={styles.taskMeta}>
                      <span>{task.project || 'No project'}</span>
                      <span>•</span>
                      <span>Due: {task.due_date || 'Not set'}</span>
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