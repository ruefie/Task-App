// src/components/tasks/Tasks.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, Clock, KanbanIcon, AlignLeftIcon, BarChart2 } from "lucide-react";
// If your lucide build complains, use:
// import { Plus, RefreshCw, Clock, KanbanSquare as KanbanIcon, AlignLeft as AlignLeftIcon, BarChart2 } from "lucide-react";

import { useTasks } from "../../contexts/TasksContext";
import { tasksService } from "../../lib/tasks";
import { supabase } from "../../lib/supabaseClient";
import styles from "../../styles/Tasks.module.scss";

import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import KanbanBoard from "./KanbanBoard";
import TaskDetails from "./TaskDetails";
import TaskAnalytics from "./TaskAnalytics";
import TasksToolbar from "./TasksToolbar";

function Tasks({ onTaskAdded, initialTaskData , onExportCsv}) {
  const { tasks, setTasks, loadTasks, error, loading } = useTasks();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [taskToReset, setTaskToReset] = useState(null);
  const [viewMode, setViewMode] = useState("kanban");
  const [selectedTask, setSelectedTask] = useState(null);
  const [timers, setTimers] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [copyFromTask, setCopyFromTask] = useState(null);
  const [previousMilestones, setPreviousMilestones] = useState({});

  // Search / Filter / Sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dueFilter, setDueFilter] = useState(""); // "", "overdue", "today", "week"
  const [sortBy, setSortBy] = useState("");       // "", "due_asc", "due_desc", "priority_high", "name_asc", "name_desc"

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    // Store initial milestones for all tasks
    const milestones = {};
    tasks.forEach((task) => {
      if (!previousMilestones[task.id]) {
        milestones[task.id] = task.milestone;
      }
    });
    setPreviousMilestones((prev) => ({ ...prev, ...milestones }));
  }, [tasks]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTaskClick = (task, e) => {
    if (e?.target?.closest?.("button")) return;
    setSelectedTask(task);
  };

  const handleCopyTask = (task) => {
    const taskCopy = {
      name: `${task.name} (Copy)`,
      milestone: task.milestone,
      priority: task.priority,
      start_date: task.start_date,
      due_date: task.due_date,
      assignee: task.assignee,
      client: task.client,
      project: task.project,
      description: task.description,
      completed: false,
    };
    setCopyFromTask(taskCopy);
    setShowForm(true);
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

    if (newMilestone === "Done") {
      setPreviousMilestones((prev) => ({ ...prev, [draggableId]: movedTask.milestone }));
    }

    movedTask.milestone = newMilestone;
    movedTask.completed = newMilestone === "Done";

    newTasks.splice(
      newTasks.findIndex((t) => t.milestone === newMilestone) + destination.index,
      0,
      movedTask
    );
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
      const updatedData = {
        completed: newCompleted,
        milestone: newCompleted ? "Done" : previousMilestones[id] || task.milestone,
      };

      if (newCompleted) {
        setPreviousMilestones((prev) => ({ ...prev, [id]: task.milestone }));
      }

      await tasksService.updateTask(id, updatedData);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updatedData } : t)));
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
          const n = { ...prev };
          delete n[id];
          return n;
        });
      }
      setTasks((prev) => prev.filter((task) => task.id !== id));
      setPreviousMilestones((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
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
            prev.map((t) => (t.id === taskId ? { ...t, timeSpent: t.timeSpent + 1 } : t))
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
          const n = { ...prev };
          delete n[taskId];
          return n;
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
          const n = { ...prev };
          delete n[taskId];
          return n;
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

  // ---- Filtering / Sorting ---------------------------------------------------
  const statusToMilestone = { todo: "To Do", on_going: "On Going", in_review: "In Review", done: "Done" };
  const priorityOrder = { Urgent: 3, High: 2, Normal: 1 };

  const isToday = (d) => {
    if (!d) return false; 
    const x = new Date(d), now = new Date();
    return x.getFullYear() === now.getFullYear() &&
           x.getMonth() === now.getMonth() &&
           x.getDate() === now.getDate();
  };

  const isThisWeek = (d) => {
    if (!d) return false;
    const x = new Date(d);
    const now = new Date();
    // Monday-based week start (common in DE). Change if you prefer Sunday.
    const dayOnly = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const start = dayOnly(now);
    const weekday = (start.getDay() + 6) % 7; // Mon=0..Sun=6
    start.setDate(start.getDate() - weekday);
    const end = dayOnly(start);
    end.setDate(start.getDate() + 7);
    return x >= start && x < end;
  };

  const isOverdue = (d) => d && new Date(d) < new Date() && !isToday(d);

  const filteredTasks = useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();
    const milestoneFilter = statusFilter ? statusToMilestone[statusFilter] : "";

    return tasks.filter((t) => {
      if (milestoneFilter && (t.milestone || "") !== milestoneFilter) return false;
      if (priorityFilter && (t.priority || "") !== priorityFilter) return false;

      if (dueFilter) {
        const d = t.due_date;
        if (dueFilter === "overdue" && !isOverdue(d)) return false;
        if (dueFilter === "today" && !isToday(d)) return false;
        if (dueFilter === "week" && !isThisWeek(d)) return false;
      }

      if (!q) return true;

      const fields = [t.name, t.description, t.assignee, t.client, t.project, t.priority, t.milestone]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());

      return fields.some((f) => f.includes(q));
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, dueFilter]);

  const sortedTasks = useMemo(() => {
    const arr = [...filteredTasks];
    const byDue = (a, b) => {
      const da = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
      const db = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    };
    const byName = (a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" });
    const byPriority = (a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);

    switch (sortBy) {
      case "due_asc": arr.sort(byDue); break;
      case "due_desc": arr.sort((a, b) => byDue(b, a)); break;
      case "priority_high": arr.sort(byPriority); break;
      case "name_asc": arr.sort(byName); break;
      case "name_desc": arr.sort((a, b) => byName(b, a)); break;
      default: break;
    }
    return arr;
  }, [filteredTasks, sortBy]);

  // ✅ MISSING BEFORE: define counters used in the hint row
  const counters = useMemo(() => {
    return sortedTasks.reduce(
      (acc, t) => {
        const m = t.milestone || "";
        if (m === "To Do") acc.todo++;
        else if (m === "On Going") acc.on_going++;
        else if (m === "In Review") acc.in_review++;
        else if (m === "Done") acc.done++;
        return acc;
      },
      { todo: 0, on_going: 0, in_review: 0, done: 0 }
    );
  }, [sortedTasks]);

  // CSV export of the current (sorted/filtered) view
  const exportCsv = () => {
    const rows = sortedTasks.map((t) => ({
      id: t.id,
      name: t.name,
      milestone: t.milestone,
      priority: t.priority,
      assignee: t.assignee,
      client: t.client,
      project: t.project,
      start_date: t.start_date,
      due_date: t.due_date,
      completed: t.completed ? "Yes" : "No",
      time_spent_seconds: t.timeSpent ?? 0,
    }));

    const header = Object.keys(
      rows[0] || {
        id: "", name: "", milestone: "", priority: "", assignee: "",
        client: "", project: "", start_date: "", due_date: "", completed: "", time_spent_seconds: ""
      }
    );

    const csv = [
      header.join(","),
      ...rows.map((r) =>
        header
          .map((k) => {
            const val = r[k] ?? "";
            const s = String(val).replaceAll('"', '""');
            return /[",\n]/.test(s) ? `"${s}"` : s;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks_export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const resultCount = sortedTasks.length;

  // -------- Render ------------------------------------------------------------
  const renderContent = () => {
    if (loading) return <p className={styles.loading}>Loading your tasks...</p>;

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

        {/* NEW: Toolbar + result hint */}
        <TasksToolbar
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          statusFilter={statusFilter}
          onFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilter={setPriorityFilter}
          dueFilter={dueFilter}
          onDueFilter={setDueFilter}
          sortBy={sortBy}
          onSortBy={setSortBy}
          onClearFilters={() => {
            setSearchTerm("");
            setStatusFilter("");
            setPriorityFilter("");
            setDueFilter("");
            setSortBy("");
          }}
          onExportCsv={exportCsv}
        />

        <div className={styles.hintRow}>
          {searchTerm || statusFilter || priorityFilter || dueFilter || sortBy
            ? `Showing ${resultCount} matching ${resultCount === 1 ? "task" : "tasks"} `
            : `Showing all ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`}
          <span className={styles.counters}>
            : To Do: {counters.todo} • On Going: {counters.on_going} • In Review:{counters.in_review}  • Done: {counters.done}
          </span>
        </div>

        {/* Add Task button */}
        {!showForm && (
          <button onClick={() => setShowForm(true)} className={styles.addButton}>
            <Plus size={20} />
            Add Task
          </button>
          
        )}
 <button className={styles.primaryBtn} onClick={onExportCsv}>Export CSV</button>
        {/* Form */}
        {showForm && (
          <TaskForm
            onClose={() => {
              setShowForm(false);
              setEditingTask(null);
              setCopyFromTask(null);
            }}
            editingTask={editingTask}
            initialData={copyFromTask || initialTaskData}
            setTasks={setTasks}
            onTaskAdded={onTaskAdded}
          />
        )}

        {/* Views consume sortedTasks */}
        {viewMode === "kanban" ? (
          <KanbanBoard
            tasks={sortedTasks}
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
            onCopyTask={handleCopyTask}
            formatTime={formatTime}
          />
        ) : (
          <TaskList
            tasks={sortedTasks}
            onTaskClick={handleTaskClick}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onStartEditing={(task) => {
              setEditingTask(task);
              setShowForm(true);
            }}
            onToggleTimer={toggleTimer}
            onPromptResetTimer={promptResetTimer}
            onCopyTask={handleCopyTask}
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
        <div className={styles.headerActions}>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={styles.analyticsToggle}
          >
            <BarChart2 size={20} />
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
          </button>
          <button onClick={loadTasks} className={styles.refreshButton} disabled={loading}>
            <RefreshCw size={16} className={loading ? styles.spinning : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showAnalytics && <TaskAnalytics tasks={sortedTasks} />}

      {/* Summary row */}
      <div className={styles.summary}>
        <div className={styles.totalTime}>
          <Clock size={20} />
          <span>
            Total Time: {formatTime(sortedTasks.reduce((total, task) => total + (task.timeSpent || 0), 0))}
          </span>
        </div>
      </div>

      {renderContent()}

      {showConfirmation && (
        <div className={styles.confirmationOverlay} onClick={() => setShowConfirmation(false)}>
          <div className={styles.confirmationDialog} onClick={(e) => e.stopPropagation()}>
            <h3>Reset Timer</h3>
            <p>
              Are you sure you want to reset the timer for this task? This will permanently
              delete all timer entries and cannot be undone.
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
          onCopyTask={handleCopyTask}
        />
      )}
    </div>
  );
}

export default Tasks;
