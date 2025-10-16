import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Clock,
  BarChart2,
  TrendingUp,
  Calendar as CalendarIcon,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Activity,
  UserCheck,
  Award,
  Target,
} from "lucide-react";
import { useTasks } from "../../contexts/TasksContext";
import { useAuth } from "../../contexts/AuthContext";
import TimeReports from "../Tasks/TimeReports";
import TaskOverviewGraph from "./TaskOverviewGraph";
import styles from "../../styles/Home.module.scss";
import NotificationToggle from "../NotificationToggle";

function Home() {
  const { tasks, loadTasks, loading, error } = useTasks();
  const { profile, isAdmin } = useAuth();
  const [showTimeReports, setShowTimeReports] = useState(false);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      upcomingTasks: 0,
    },
    priorities: {
      urgent: 0,
      high: 0,
      normal: 0,
    },
    timeTracking: {
      totalTime: 0,
      averageTime: 0,
      mostTimeConsuming: null,
    },
    performance: {
      completionRate: 0,
      onTimeCompletion: 0,
      delayedTasks: 0,
    },
    distribution: {
      byProject: {},
      byClient: {},
      byMilestone: {},
    },
    upcoming: [],
    recentActivity: [],
    employeePerformance: [],
  });

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    calculateAnalytics();
  }, [tasks, isAdmin]);

  const calculateAnalytics = () => {
    const now = new Date();
    const stats = {
      overview: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.completed).length,
        inProgressTasks: tasks.filter(
          (t) => !t.completed && t.milestone === "On Going"
        ).length,
        upcomingTasks: tasks.filter((t) => {
          const dueDate = new Date(t.due_date);
          return (
            !t.completed &&
            dueDate > now &&
            dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          );
        }).length,
      },
      priorities: {
        urgent: tasks.filter((t) => t.priority === "Urgent").length,
        high: tasks.filter((t) => t.priority === "High").length,
        normal: tasks.filter((t) => t.priority === "Normal").length,
      },
      timeTracking: {
        totalTime: tasks.reduce(
          (total, task) => total + (task.timeSpent || 0),
          0
        ),
        averageTime: tasks.length
          ? Math.floor(
              tasks.reduce((total, task) => total + (task.timeSpent || 0), 0) /
                tasks.length
            )
          : 0,
        mostTimeConsuming: [...tasks].sort(
          (a, b) => (b.timeSpent || 0) - (a.timeSpent || 0)
        )[0],
      },
      performance: {
        completionRate: tasks.length
          ? (tasks.filter((t) => t.completed).length / tasks.length) * 100
          : 0,
        onTimeCompletion: calculateOnTimeCompletion(tasks),
        delayedTasks: tasks.filter((t) => {
          const dueDate = new Date(t.due_date);
          return !t.completed && dueDate < now;
        }).length,
      },
      distribution: {
        byProject: groupBy(tasks, "project"),
        byClient: groupBy(tasks, "client"),
        byMilestone: groupBy(tasks, "milestone"),
      },
      upcoming: tasks
        .filter((t) => !t.completed && new Date(t.due_date) > now)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5),
      recentActivity: getRecentActivity(tasks),
      employeePerformance: calculateEmployeePerformance(tasks),
    };

    setAnalytics(stats);
  };

  const calculateEmployeePerformance = (tasks) => {
    if (!isAdmin) return [];

    const employeeStats = {};

    tasks.forEach(task => {
      if (!employeeStats[task.assignee]) {
        employeeStats[task.assignee] = {
          name: task.assignee,
          totalTasks: 0,
          milestones: {
            Todo: 0,
            "On Going": 0,
            "In Review": 0,
            Done: 0
          },
          priorities: {
            Normal: 0,
            High: 0,
            Urgent: 0
          }
        };
      }

      const stats = employeeStats[task.assignee];
      stats.totalTasks++;
      
      stats.milestones[task.milestone]++;
      
      stats.priorities[task.priority]++;
    });

    return Object.values(employeeStats)
      .sort((a, b) => b.totalTasks - a.totalTasks);
  };

  const calculateOnTimeCompletion = (tasks) => {
       // Only consider tasks that are completed and have both due_date and completed_at
        const completedTasks = tasks.filter(
          (t) => t.completed && t.due_date && t.completed_at
        );
        if (completedTasks.length === 0) return 0;
    
        const onTimeCount = completedTasks.filter((task) => {
          const completedDate = new Date(task.completed_at);
          // Parse the due_date (which is date-only) and treat it as end-of-day
          const dueDate = new Date(task.due_date);
          dueDate.setHours(23, 59, 59, 999);
          return completedDate.getTime() <= dueDate.getTime();
        }).length;
    
        return (onTimeCount / completedTasks.length) * 100;
      };

  const groupBy = (array, key) => {
    return array.reduce((result, item) => {
      const value = item[key] || 'Unassigned';
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  };

  const getRecentActivity = (tasks) => {
    const activity = [];
    const seenActivities = new Set();

    tasks.forEach(task => {
      if (task.completed && task.completed_at) {
        const activityKey = `completion-${task.id}-${task.completed_at}`;
        if (!seenActivities.has(activityKey)) {
          activity.push({
            type: 'completion',
            task,
            date: new Date(task.completed_at),
          });
          seenActivities.add(activityKey);
        }
      }

      if (task.timerEntries?.length > 0) {
        const latestEntry = task.timerEntries[task.timerEntries.length - 1];
        const activityKey = `timer-${task.id}-${latestEntry.start_time}`;
        if (!seenActivities.has(activityKey)) {
          activity.push({
            type: 'timer',
            task,
            date: new Date(latestEntry.start_time),
          });
          seenActivities.add(activityKey);
        }
      }
    });

    return activity
      .sort((a, b) => b.date - a.date)
      .slice(0, 4);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60)
    const formattedSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${formattedSeconds}s`;
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return styles.urgent;
      case 'high':
        return styles.high;
      case 'normal':
      default:
        return styles.normal;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
      
        <h1>Hello {profile?.first_name}!</h1>
        <div className={styles.headerButtons}>
          <button
            onClick={() => setShowTimeReports(!showTimeReports)}
            className={styles.analyticsToggle}
          >
            <Clock size={20} />
            {showTimeReports ? 'Hide Time Reports' : 'Show Time Reports'}
          </button>
          <button 
            onClick={loadTasks} 
            className={styles.refreshButton}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      
      <TaskOverviewGraph tasks={tasks} />
      
      {showTimeReports && <TimeReports tasks={tasks} />}

      {loading ? (
        <p className={styles.homeLoading}></p>
      ) : (
        <div className={styles.dashboard}>
          <div className={styles.overviewGrid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <CheckCircle2 size={20} />
                <h3>Tasks Overview</h3>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.stat}>
                  <span>Total Tasks</span>
                  <span className={styles.value}>{analytics.overview.totalTasks}</span>
                </div>
                <div className={styles.stat}>
                  <span>Completed</span>
                  <span className={styles.value}>{analytics.overview.completedTasks}</span>
                </div>
                <div className={styles.stat}>
                  <span>In Progress</span>
                  <span className={styles.value}>{analytics.overview.inProgressTasks}</span>
                </div>
                <div className={styles.stat}>
                  <span>Upcoming (7 days)</span>
                  <span className={styles.value}>{analytics.overview.upcomingTasks}</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <AlertTriangle size={20} />
                <h3>Priority Distribution</h3>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.stat}>
                  <span className={styles.urgent}>Urgent</span>
                  <span className={styles.value}>{analytics.priorities.urgent}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.high}>High</span>
                  <span className={styles.value}>{analytics.priorities.high}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.normal}>Normal</span>
                  <span className={styles.value}>{analytics.priorities.normal}</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Timer size={20} />
                <h3>Time Tracking</h3>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.stat}>
                  <span>Total Time</span>
                  <span className={styles.value}>{formatTime(analytics.timeTracking.totalTime)}</span>
                </div>
                <div className={styles.stat}>
                  <span>Average per Task</span>
                  <span className={styles.value}>{formatTime(analytics.timeTracking.averageTime)}</span>
                </div>
                {analytics.timeTracking.mostTimeConsuming && (
                  <div className={styles.stat}>
                    <span>Most Time-Consuming</span>
                    <span className={styles.value} title={analytics.timeTracking.mostTimeConsuming.name}>
                      {formatTime(analytics.timeTracking.mostTimeConsuming.timeSpent)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Activity size={20} />
                <h3>Performance</h3>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.stat}>
                  <span>Completion Rate</span>
                  <span className={styles.value}>{Math.round(analytics.performance.completionRate)}%</span>
                </div>
                <div className={styles.stat}>
                  <span>On-time Completion</span>
                  <span className={styles.value}>{Math.round(analytics.performance.onTimeCompletion)}%</span>
                </div>
                <div className={styles.stat}>
                  <span>Delayed Tasks</span>
                  <span className={styles.value}>{analytics.performance.delayedTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className={styles.employeeSection}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <Users size={20} />
                  <h3>Employee Workload</h3>
                </div>
                <div className={styles.employeeList}>
                  {analytics.employeePerformance.map((employee) => (
                    <div key={employee.name} className={styles.employeeItem}>
                      <div className={styles.employeeHeader}>
                        <span className={styles.employeeName}>{employee.name}</span>
                        <div className={styles.totalTasks}>
                          <span>Total Tasks:</span>
                          <span className={styles.count}>{employee.totalTasks}</span>
                        </div>
                      </div>
                      <div className={styles.statsGrid}>
                        <div className={styles.statBox}>
                          <span className={styles.label}>Todo</span>
                          <span className={styles.value}>{employee.milestones.Todo}</span>
                        </div>
                        <div className={styles.statBox}>
                          <span className={styles.label}>On Going</span>
                          <span className={styles.value}>{employee.milestones["On Going"]}</span>
                        </div>
                        <div className={styles.statBox}>
                          <span className={styles.label}>In Review</span>
                          <span className={styles.value}>{employee.milestones["In Review"]}</span>
                        </div>
                        <div className={styles.statBox}>
                          <span className={styles.label}>Done</span>
                          <span className={styles.value}>{employee.milestones.Done}</span>
                        </div>
                      </div>
                      <div className={styles.priorityBadges}>
                        <div className={`${styles.badge} ${styles.normal}`}>
                          <span>Normal</span>
                          <span>{employee.priorities.Normal}</span>
                        </div>
                        <div className={`${styles.badge} ${styles.high}`}>
                          <span>High</span>
                          <span>{employee.priorities.High}</span>
                        </div>
                        <div className={`${styles.badge} ${styles.urgent}`}>
                          <span>Urgent</span>
                          <span>{employee.priorities.Urgent}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className={styles.distributionSection}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Building2 size={20} />
                <h3>Project Distribution</h3>
              </div>
              <div className={styles.distributionList}>
                {Object.entries(analytics.distribution.byProject).map(([project, count]) => (
                  <div key={project} className={styles.distributionItem}>
                    <span className={styles.label}>{project}</span>
                    <div className={styles.bar}>
                      <div 
                        className={styles.fill} 
                        style={{ width: `${(count / analytics.overview.totalTasks) * 100}%` }}
                      />
                    </div>
                    <span className={styles.count}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Users size={20} />
                <h3>Client Distribution</h3>
              </div>
              <div className={styles.distributionList}>
                {Object.entries(analytics.distribution.byClient).map(([client, count]) => (
                  <div key={client} className={styles.distributionItem}>
                    <span className={styles.label}>{client}</span>
                    <div className={styles.bar}>
                      <div 
                        className={styles.fill} 
                        style={{ width: `${(count / analytics.overview.totalTasks) * 100}%` }}
                      />
                    </div>
                    <span className={styles.count}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.activitySection}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <CalendarIcon size={20} />
                <h3>Upcoming Tasks</h3>
              </div>
              <div className={styles.activityList}>
                {analytics.upcoming.map(task => (
                  <div key={task.id} className={`${styles.activityItem} ${getPriorityClass(task.priority)}`}>
                    <div className={styles.activityContent}>
                      <span className={styles.activityTitle}>{task.name}</span>
                      <span className={styles.activityMeta}>
                        Due: {formatDate(new Date(task.due_date))}
                      </span>
                    </div>
                    <span className={`${styles.tag} ${getPriorityClass(task.priority)}`}>
                      {task.priority || 'Normal'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Activity size={20} />
                <h3>Recent Activity</h3>
              </div>
              <div className={styles.activityList}>
                {analytics.recentActivity.map((activity, index) => (
                  <div key={`${activity.task.id}-${index}`} className={`${styles.activityItem} ${getPriorityClass(activity.task.priority)}`}>
                    <div className={styles.activityContent}>
                      <span className={styles.activityTitle}>{activity.task.name}</span>
                      <span className={styles.activityMeta}>
                        {activity.type === 'completion' ? 'Completed' : 'Time tracked'} on {formatDate(activity.date)}
                      </span>
                    </div>
                    <span className={`${styles.tag} ${getPriorityClass(activity.task.priority)}`}>
                      {activity.task.priority || 'Normal'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;