import React, { useState, useEffect } from 'react';
import { BarChart2, PieChart, TrendingUp, Clock } from 'lucide-react';
import styles from '../../styles/TaskAnalytics.module.scss';

function TaskAnalytics({ tasks }) {
  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    urgentTasks: 0,
    tasksByProject: {},
    tasksByClient: {},
    totalTimeSpent: 0,
    averageTimePerTask: 0
  });

  useEffect(() => {
    calculateAnalytics();
  }, [tasks]);

  const calculateAnalytics = () => {
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.completed).length,
      urgentTasks: tasks.filter(t => t.priority === 'Urgent').length,
      tasksByProject: {},
      tasksByClient: {},
      totalTimeSpent: tasks.reduce((total, task) => total + (task.timeSpent || 0), 0),
    };

    // Group by project
    tasks.forEach(task => {
      stats.tasksByProject[task.project] = (stats.tasksByProject[task.project] || 0) + 1;
      stats.tasksByClient[task.client] = (stats.tasksByClient[task.client] || 0) + 1;
    });

    stats.averageTimePerTask = stats.totalTasks ? Math.floor(stats.totalTimeSpent / stats.totalTasks) : 0;

    setAnalytics(stats);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const calculatePercentage = (value, total) => {
    return total ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div className={styles.analytics}>
      <h3 className={styles.title}>Task Analytics</h3>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <BarChart2 size={20} />
            <span>Task Status</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statItem}>
              <span>Total Tasks</span>
              <span className={styles.statValue}>{analytics.totalTasks}</span>
            </div>
            <div className={styles.statItem}>
              <span>Completed</span>
              <div className={styles.statValueWithPercent}>
                <span>{analytics.completedTasks}</span>
                <span className={styles.percentage}>
                  ({calculatePercentage(analytics.completedTasks, analytics.totalTasks)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <TrendingUp size={20} />
            <span>Priority Overview</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statItem}>
              <span>Urgent Tasks</span>
              <div className={styles.statValueWithPercent}>
                <span>{analytics.urgentTasks}</span>
                <span className={styles.percentage}>
                  ({calculatePercentage(analytics.urgentTasks, analytics.totalTasks)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <Clock size={20} />
            <span>Time Tracking</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statItem}>
              <span>Total Time</span>
              <span className={styles.statValue}>{formatTime(analytics.totalTimeSpent)}</span>
            </div>
            <div className={styles.statItem}>
              <span>Avg. per Task</span>
              <span className={styles.statValue}>{formatTime(analytics.averageTimePerTask)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.distributionGrid}>
        <div className={styles.distributionCard}>
          <div className={styles.distributionHeader}>
            <PieChart size={20} />
            <span>Projects Distribution</span>
          </div>
          <div className={styles.distributionList}>
            {Object.entries(analytics.tasksByProject).map(([project, count]) => (
              <div key={project} className={styles.distributionItem}>
                <span className={styles.distributionLabel}>{project}</span>
                <div className={styles.distributionBar}>
                  <div 
                    className={styles.distributionFill} 
                    style={{ width: `${calculatePercentage(count, analytics.totalTasks)}%` }}
                  />
                </div>
                <span className={styles.distributionValue}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.distributionCard}>
          <div className={styles.distributionHeader}>
            <PieChart size={20} />
            <span>Clients Distribution</span>
          </div>
          <div className={styles.distributionList}>
            {Object.entries(analytics.tasksByClient).map(([client, count]) => (
              <div key={client} className={styles.distributionItem}>
                <span className={styles.distributionLabel}>{client}</span>
                <div className={styles.distributionBar}>
                  <div 
                    className={styles.distributionFill} 
                    style={{ width: `${calculatePercentage(count, analytics.totalTasks)}%` }}
                  />
                </div>
                <span className={styles.distributionValue}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskAnalytics;