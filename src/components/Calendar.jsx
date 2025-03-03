import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import Tasks from './Tasks';
import { tasksService } from '../lib/tasks';
import styles from '../styles/Calendar.module.scss';

function Calendar() {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newTaskData, setNewTaskData] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await tasksService.getTasks();
      console.log('Calendar - Loaded tasks:', tasksData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setSelectedDate(day);
    setNewTaskData({
      start_date: formattedDate
    });
    setShowTaskForm(true);
  };

  const handleTaskAdded = (task) => {
    setShowTaskForm(false);
    loadTasks(); // Reload tasks after adding a new one
  };

  const closeTaskForm = () => {
    setShowTaskForm(false);
    setSelectedDate(null);
    setNewTaskData(null);
  };

  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getTasksForDate = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return tasks.filter(task => task.start_date === dateStr);
  };

  const getPriorityClass = (priority) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return styles.urgent;
      case 'high':
        return styles.high;
      case 'normal':
      default:
        return styles.normal;
    }
  };

  // Generate calendar days
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className={`${styles.day} ${styles.emptyDay}`}></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const tasksForDay = getTasksForDate(day);
      
      days.push(
        <div
          key={day}
          className={styles.day}
          onClick={() => handleDateClick(day)}
        >
          <span className={styles.dayNumber}>{day}</span>
          
          {tasksForDay.length > 0 && (
            <div className={styles.tasksList}>
              {tasksForDay.map(task => (
                <div 
                  key={task.id} 
                  className={`${styles.taskItem} ${getPriorityClass(task.priority)}`}
                >
                  {task.name}
                </div>
              ))}
            </div>
          )}
          
          <button 
            className={styles.addTask}
            onClick={(e) => {
              e.stopPropagation();
              handleDateClick(day);
            }}
          >
            <Plus size={14} />
          </button>
        </div>
      );
    }

    return days;
  };

  return (
    <div className={styles.container}>
      <h1>Calendar</h1>
      
      {error && <p className={styles.error}>{error}</p>}
      
      <div className={styles.calendar}>
        <div className={styles.header}>
          <h2>{getMonthName(currentMonth)}</h2>
          <div className={styles.controls}>
            <button onClick={previousMonth}>&lt; Previous</button>
            <button onClick={nextMonth}>Next &gt;</button>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.weekdays}>
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>
          <div className={styles.days}>
            {renderCalendarDays()}
          </div>
        </div>
      </div>

      {showTaskForm && (
        <div className={styles.taskFormOverlay} onClick={closeTaskForm}>
          <div className={styles.taskFormWrapper} onClick={(e) => e.stopPropagation()}>
            <div className={styles.taskFormHeader}>
              <h3>
                {selectedDate 
                  ? `Add Task for ${getMonthName(currentMonth)} ${selectedDate}` 
                  : 'Add Task'}
              </h3>
              <button className={styles.closeButton} onClick={closeTaskForm}>
                <X size={20} />
              </button>
            </div>
            <Tasks onTaskAdded={handleTaskAdded} initialTaskData={newTaskData} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;