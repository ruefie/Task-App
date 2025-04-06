import React, { useState, useRef, useEffect } from "react";
import { Plus, RefreshCw, Clock, KanbanIcon, AlignLeftIcon, BarChart2 } from "lucide-react";
import { useTasks } from "../../contexts/TasksContext";
import { tasksService } from "../../lib/tasks";
import { supabase } from "../../lib/supabase";
import styles from "../../styles/Tasks.module.scss";

import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import KanbanBoard from "./KanbanBoard";
import TaskDetails from "./TaskDetails";
import TaskAnalytics from "./TaskAnalytics";

function Tasks({ onTaskAdded, initialTaskData }) {
  const { tasks, setTasks, loadTasks, error, loading } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [taskToReset, setTaskToReset] = useState(null);
  const [viewMode, setViewMode] = useState("kanban");
  const [selectedTask, setSelectedTask] = useState(null);
  const [timers, setTimers] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTaskClick = (task, e) => {
    if (e.target.closest("button")) return;
    setSelectedTask(task);
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;
    const newTasks = [...tasks];
    const [movedTask] = newTasks.splice(newTasks.findIndex((t) => t.id === draggableId), 1);
    const newMilestone = destination.droppableId;
    movedTask.milestone = newMilestone;
    if (newMilestone === "Done") {
      movedTask.completed = true;
    } else if (movedTask.completed && newMilestone !== "Done") {
      movedTask.completed = false;
    }
    newTasks.splice(newTasks.findIndex((t) => t.milestone === newMilestone) + destination.index, 0, movedTask);
    setTasks(newTasks);
    try {
      await tasksService.updateTask(draggableId, {
        milestone: newMilestone,
        completed: movedTask.completed,
      });
    } catch (error) {
      console.error("Error updating task after drag:", error);
      loadTasks();
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      const newCompleted = !task.completed;
      let updatedData = { completed: newCompleted };
      if (newCompleted) {
        if (task.milestone !== "Done") {
          updatedData.milestone = "Done";
          task._prevMilestone = task.milestone;
        }
      } else {
        updatedData.milestone = task._prevMilestone ? task._prevMilestone : task.milestone;
        delete task._prevMilestone;
      }
      await tasksService.updateTask(id, updatedData);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updatedData } : t))
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await tasksService.deleteTask(id);
      if (timers[id]) {
        clearInterval(timers[id]);
        setTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[id];
          return newTimers;
        });
      }
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const toggleTimer = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!task.isTimerRunning) {
      try {
        const timerEntry = await tasksService.startTimer(taskId);
        const timer = setInterval(() => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, timeSpent: t.timeSpent + 1 } : t
            )
          );
        }, 1000);
        setTimers((prev) => ({ ...prev, [taskId]: timer }));
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, isTimerRunning: true, timerEntries: [...t.timerEntries, timerEntry] }
              : t
          )
        );
      } catch (error) {
        console.error("Error starting timer:", error);
      }
    } else {
      try {
        const activeEntry = task.timerEntries.find((entry) => !entry.end_time);
        if (activeEntry) {
          const duration = Math.floor((new Date() - new Date(activeEntry.start_time)) / 1000);
          const stoppedEntry = await tasksService.stopTimer(activeEntry.id, duration);
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    isTimerRunning: false,
                    timerEntries: t.timerEntries.map((entry) =>
                      entry.id === activeEntry.id
                        ? { ...entry, end_time: stoppedEntry.end_time, duration: stoppedEntry.duration }
                        : entry
                    ),
                  }
                : t
            )
          );
        }
        clearInterval(timers[taskId]);
        setTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[taskId];
          return newTimers;
        });
      } catch (error) {
        console.error("Error stopping timer:", error);
      }
    }
  };

  const promptResetTimer = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setTaskToReset(task);
    setShowConfirmation(true);
  };

  const confirmResetTimer = async () => {
    if (!taskToReset) return;
    try {
      const taskId = taskToReset.id;
      if (taskToReset.isTimerRunning) {
        const activeEntry = taskToReset.timerEntries.find((entry) => !entry.end_time);
        if (activeEntry) await tasksService.stopTimer(activeEntry.id, 0);
      }
      if (timers[taskId]) {
        clearInterval(timers[taskId]);
        setTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[taskId];
          return newTimers;
        });
      }
      if (taskToReset.timerEntries && taskToReset.timerEntries.length > 0) {
        await supabase.from("timer_entries").delete().eq("task_id", taskId);
      }
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, timeSpent: 0, timerEntries: [], isTimerRunning: false }
            : task
        )
      );
      setShowConfirmation(false);
      setTaskToReset(null);
    } catch (error) {
      console.error("Error resetting timer:", error);
      setShowConfirmation(false);
      setTaskToReset(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <p className={styles.loading}>Loading your tasks...</p>;
    }

    return (
      <>
        <div className={styles.viewTabs}>
          <button
            className={`${styles.viewTabButton} ${viewMode === "kanban" ? styles.activeView : ""}`}
            onClick={() => setViewMode("kanban")}
          >
            <KanbanIcon /> Kanban
          </button>
          <button
            className={`${styles.viewTabButton} ${viewMode === "list" ? styles.activeView : ""}`}
            onClick={() => setViewMode("list")}
          >
            <AlignLeftIcon /> List
          </button>
        </div>

        {!showForm && (
          <button onClick={() => setShowForm(true)} className={styles.addButton}>
            <Plus size={20} />
            Add Task
          </button>
        )}

        {showForm && (
          <TaskForm
            onClose={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
            editingTask={editingTask}
            setTasks={setTasks}
            onTaskAdded={onTaskAdded}
          />
        )}

        {viewMode === "kanban" ? (
          <KanbanBoard
            tasks={tasks}
            onDragEnd={handleDragEnd}
            onTaskClick={handleTaskClick}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onStartEditing={(task) => {
              setEditingTask(task);
              setShowForm(true);
            }}
            onToggleTimer={toggleTimer}
            onPromptResetTimer={promptResetTimer}
            formatTime={formatTime}
          />
        ) : (
          <TaskList
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onStartEditing={(task) => {
              setEditingTask(task);
              setShowForm(true);
            }}
            onToggleTimer={toggleTimer}
            onPromptResetTimer={promptResetTimer}
            formatTime={formatTime}
          />
        )}
      </>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tasks</h1>
        <div className={styles.headerButtons}>  
          <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className={styles.analyticsToggle}
        >
          <BarChart2 size={20} />
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
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
      
      {showAnalytics && <TaskAnalytics tasks={tasks} />}

      <div className={styles.summary}>
        <div className={styles.totalTime}>
          <Clock size={20} />
          <span>
            Total Time: {formatTime(tasks.reduce((total, task) => total + task.timeSpent, 0))}
          </span>
        </div>
       
      </div>

      {renderContent()}

      {showConfirmation && (
        <div className={styles.confirmationOverlay} onClick={() => setShowConfirmation(false)}>
          <div className={styles.confirmationDialog} onClick={(e) => e.stopPropagation()}>
            <h3>Reset Timer</h3>
            <p>
              Are you sure you want to reset the timer for this task? This will permanently delete all timer entries and cannot be undone.
            </p>
            <div className={styles.confirmationButtons}>
              <button onClick={() => setShowConfirmation(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={confirmResetTimer} className={styles.confirmButton}>
                Reset Timer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          formatTime={formatTime}
        />
      )}
    </div>
  );
}

export default Tasks;