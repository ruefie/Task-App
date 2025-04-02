import React, { useState, useEffect } from 'react';
import { BarChart, Clock, Calendar } from 'lucide-react';
import styles from '../../styles/TimeReports.module.scss';

function TimeReports({ tasks }) {
  const [timeRange, setTimeRange] = useState('week');
  const [filteredTasks, setFilteredTasks] = useState([]);

  useEffect(() => {
    filterTasks();
  }, [timeRange, tasks]);

  const filterTasks = () => {
    const now = new Date();
    const filtered = tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return taskDate >= weekAgo;
      } else {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return taskDate >= monthAgo;
      }
    });
    setFilteredTasks(filtered);
  };

  const calculateTimeStats = () => {
    const stats = {
      totalTime: 0,
      timeByProject: {},
      timeByClient: {},
      timeByUser: {}
    };

    filteredTasks.forEach(task => {
      const taskTime = task.timeSpent || 0;
      stats.totalTime += taskTime;
      
      stats.timeByProject[task.project] = (stats.timeByProject[task.project] || 0) + taskTime;
      stats.timeByClient[task.client] = (stats.timeByClient[task.client] || 0) + taskTime;
      stats.timeByUser[task.assignee] = (stats.timeByUser[task.assignee] || 0) + taskTime;
    });

    return stats;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const stats = calculateTimeStats();

  return (
    <div className={styles.timeReports}>
      <h3>Time Reports</h3>
      <div className={styles.timeRangeSelector}>
        <button
          className={timeRange === 'week' ? styles.active : ''}
          onClick={() => setTimeRange('week')}
        >
          This Week
        </button>
        <button
          className={timeRange === 'month' ? styles.active : ''}
          onClick={() => setTimeRange('month')}
        >
          This Month
        </button>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h4>Time by Project</h4>
          <div className={styles.legend}>
            {Object.entries(stats.timeByProject).map(([project, time]) => (
              <div key={project} className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#3b82f6' }} />
                <span className={styles.legendLabel}>{project}:</span>
                <span className={styles.legendValue}>{formatTime(time)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.statCard}>
          <h4>Time by Client</h4>
          <div className={styles.legend}>
            {Object.entries(stats.timeByClient).map(([client, time]) => (
              <div key={client} className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#10b981' }} />
                <span className={styles.legendLabel}>{client}:</span>
                <span className={styles.legendValue}>{formatTime(time)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.statCard}>
          <h4>Time by User</h4>
          <div className={styles.legend}>
            {Object.entries(stats.timeByUser).map(([user, time]) => (
              <div key={user} className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#6366f1' }} />
                <span className={styles.legendLabel}>{user}:</span>
                <span className={styles.legendValue}>{formatTime(time)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeReports;