// src/components/tasks/Tasks.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, Clock, KanbanIcon, AlignLeftIcon, BarChart2 } from "lucide-react";
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

function Tasks({ onTaskAdded, initialTaskData, onExportCsv }) {
  const { tasks, setTasks, loadTasks, error, loading } = useTasks();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [taskToReset, setTaskToReset] = useState(null);

  const [userId, setUserId] = useState(null);
  const [viewMode, setViewMode] = useState("kanban");
  const [autoArchiveDays, setAutoArchiveDays] = useState(0);

  // NEW: Show archived toggle (persisted)
  const [showArchived, setShowArchived] = useState(false);

  const FILTERS_KEY = "taskapp.filters";

  // Load preferred view + auto-archive (local → DB → legacy local)
  useEffect(() => {
    (async () => {
      try {
        const lw = localStorage.getItem("ui.default_view");
        if (lw === "kanban" || lw === "list") setViewMode(lw);

        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);

        let vFromDb = null, aaFromDb = null;
        if (user) {
          const { data } = await supabase
            .from("user_settings")
            .select("preferred_view, default_view, auto_archive_days")
            .eq("user_id", user.id)
            .maybeSingle();
          const vDb = data?.preferred_view || data?.default_view;
          if (vDb === "kanban" || vDb === "list") vFromDb = vDb;
          if (typeof data?.auto_archive_days === "number") aaFromDb = data.auto_archive_days;
        }

        const ls = localStorage.getItem("taskapp.settings");
        const parsed = ls ? JSON.parse(ls) : null;
        const vLegacy = parsed?.preferred_view || parsed?.default_view;
        const aaLegacy = typeof parsed?.auto_archive_days === "number" ? parsed.auto_archive_days : null;

        if (!lw && (vFromDb === "kanban" || vFromDb === "list")) setViewMode(vFromDb);
        else if (!lw && !vFromDb && (vLegacy === "kanban" || vLegacy === "list")) setViewMode(vLegacy);

        if (aaFromDb != null) setAutoArchiveDays(aaFromDb);
        else if (aaLegacy != null) setAutoArchiveDays(aaLegacy);
      } catch {}
    })();
  }, []);

  // Reflect DB changes in realtime (optional)
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("user_settings_tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_settings", filter: `user_id=eq.${userId}` },
        (payload) => {
          const v = payload.new?.preferred_view || payload.new?.default_view;
          if (v === "kanban" || v === "list") setViewMode(v);
          if (typeof payload.new?.auto_archive_days === "number") setAutoArchiveDays(payload.new.auto_archive_days);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Run server-side archiver once on load (nice-to-have)
  useEffect(() => {
    if (!userId) return;
    (async () => {
      await supabase.rpc('archive_old_completed_tasks'); // fire-and-forget
    })();
  }, [userId]);

  // Listen for localStorage broadcasts
  useEffect(() => {
    const onStorage = (e) => {
      try {
        if (e.key === "taskapp.settings") {
          const next = JSON.parse(e.newValue || "{}");
          const v = next.preferred_view || next.default_view;
          if (v === "kanban" || v === "list") setViewMode(v);
          if (typeof next.auto_archive_days === "number") setAutoArchiveDays(next.auto_archive_days);
        }
        if (e.key === "ui.default_view") {
          const v = e.newValue;
          if (v === "kanban" || v === "list") setViewMode(v);
        }
      } catch {}
    };
    const onPreferredView = (e) => {
      const v = e.detail;
      if (v === "kanban" || v === "list") setViewMode(v);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("user_settings:preferred_view", onPreferredView);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("user_settings:preferred_view", onPreferredView);
    };
  }, []);

  // Persist helper when user clicks view tabs
  const applyAndSaveView = async (v) => {
    setViewMode(v);
    try {
      if (userId) {
        await supabase.from("user_settings")
          .upsert({ user_id: userId, preferred_view: v, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      }
      const ls = localStorage.getItem("taskapp.settings");
      const cur = ls ? JSON.parse(ls) : {};
      localStorage.setItem("taskapp.settings", JSON.stringify({ ...cur, preferred_view: v, default_view: v }));
      localStorage.setItem("ui.default_view", v);
      try { window.dispatchEvent(new CustomEvent("user_settings:preferred_view", { detail: v })); } catch {}
    } catch (err) {
      console.warn("Failed to persist preferred_view:", err?.message || err);
    }
  };

  const [selectedTask, setSelectedTask] = useState(null);
  const [timers, setTimers] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [copyFromTask, setCopyFromTask] = useState(null);
  const [previousMilestones, setPreviousMilestones] = useState({});

  // Search / Filter / Sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [sortBy, setSortBy] = useState("");

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Load default filters from localStorage on mount (including showArchived)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || "{}");
      if (typeof saved.searchTerm === "string") setSearchTerm(saved.searchTerm);
      if (typeof saved.statusFilter === "string") setStatusFilter(saved.statusFilter);
      if (typeof saved.priorityFilter === "string") setPriorityFilter(saved.priorityFilter);
      if (typeof saved.dueFilter === "string") setDueFilter(saved.dueFilter);
      if (typeof saved.sortBy === "string") setSortBy(saved.sortBy);
      if (typeof saved.showArchived === "boolean") setShowArchived(saved.showArchived);
    } catch {}
  }, []);

  // Persist filters whenever they change (incl. showArchived)
  useEffect(() => {
    const payload = { searchTerm, statusFilter, priorityFilter, dueFilter, sortBy, showArchived };
    localStorage.setItem(FILTERS_KEY, JSON.stringify(payload));
  }, [searchTerm, statusFilter, priorityFilter, dueFilter, sortBy, showArchived]);

  // Track previous milestones
  useEffect(() => {
    const milestones = {};
    tasks.forEach((task) => {
      if (!previousMilestones[task.id]) milestones[task.id] = task.milestone;
    });
    setPreviousMilestones((prev) => ({ ...prev, ...milestones }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // ---- Auto-archive (lazy on client) ----
  useEffect(() => {
    if (!autoArchiveDays || !tasks?.length) return;
    const cutoffMs = Date.now() - autoArchiveDays * 24 * 60 * 60 * 1000;
    const toArchive = tasks.filter((t) => {
      if (t.archived_at) return false;
      if (!t.completed) return false;
      const ref = t.updated_at || t.completed_at || t.due_date || t.start_date || t.created_at;
      if (!ref) return false;
      return new Date(ref).getTime() < cutoffMs;
    });
    if (!toArchive.length) return;

    (async () => {
      try {
        const ids = toArchive.map((t) => t.id);
        const nowIso = new Date().toISOString();
        await supabase.from("tasks").update({ archived_at: nowIso }).in("id", ids);
        setTasks((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, archived_at: nowIso } : t)));
      } catch (e) {
        console.warn("auto-archive failed:", e?.message || e);
      }
    })();
  }, [autoArchiveDays, tasks, setTasks]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTaskClick = (task, e) => {
    if (e?.target?.closest?.("button")) return;
    setSelectedTask(task);
  };

  const handleCopyTask = async (task) => {
    try {
      const inserted = await tasksService.duplicateTask(task.id);
      // Optimistically add to state (top of list) or just reload
      setTasks((prev) => [inserted, ...prev]);
      // If you prefer to refresh from server instead:
      // await loadTasks();
    } catch (e) {
      console.error("Duplicate task failed:", e);
    }
  };
  

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    const newTasks = [...tasks];
    const [movedTask] = newTasks.splice(newTasks.findIndex((t) => t.id === draggableId), 1);
    const newMilestone = destination.droppableId;

    if (newMilestone === "Done") setPreviousMilestones((prev) => ({ ...prev, [draggableId]: movedTask.milestone }));
    movedTask.milestone = newMilestone;
    movedTask.completed = newMilestone === "Done";

    newTasks.splice(newTasks.findIndex((t) => t.milestone === newMilestone) + destination.index, 0, movedTask);
    setTasks(newTasks);
    try {
      await tasksService.updateTask(draggableId, { milestone: newMilestone, completed: movedTask.completed });
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
      if (newCompleted) setPreviousMilestones((prev) => ({ ...prev, [id]: task.milestone }));

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
        setTimers((prev) => { const n = { ...prev }; delete n[id]; return n; });
      }
      setTasks((prev) => prev.filter((task) => task.id !== id));
      setPreviousMilestones((prev) => { const n = { ...prev }; delete n[id]; return n; });
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
          setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, timeSpent: t.timeSpent + 1 } : t)));
        }, 1000);
        setTimers((prev) => ({ ...prev, [taskId]: timer }));
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, isTimerRunning: true, timerEntries: [...t.timerEntries, timerEntry] } : t))
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
        setTimers((prev) => { const n = { ...prev }; delete n[taskId]; return n; });
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
        setTimers((prev) => { const n = { ...prev }; delete n[taskId]; return n; });
      }
      if (taskToReset.timerEntries && taskToReset.timerEntries.length > 0) {
        await supabase.from("timer_entries").delete().eq("task_id", taskId);
      }
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, timeSpent: 0, timerEntries: [], isTimerRunning: false } : task
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
    return x.getFullYear() === now.getFullYear() && x.getMonth() === now.getMonth() && x.getDate() === now.getDate();
  };

  const isThisWeek = (d) => {
    if (!d) return false;
    const x = new Date(d);
    const now = new Date();
    const dayOnly = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const start = dayOnly(now);
    const weekday = (start.getDay() + 6) % 7; // Mon=0..Sun=6
    start.setDate(start.getDate() - weekday);
    const end = dayOnly(start);
    end.setDate(start.getDate() + 7);
    return x >= start && x < end;
  };

  const isOverdue = (d) => d && new Date(d) < new Date() && !isToday(d);

  // #1 — Respect “Show archived” on the client (filters what the UI sees)
  const visibleTasks = useMemo(
    () => (showArchived ? tasks : (tasks || []).filter((t) => !t.archived_at)),
    [tasks, showArchived]
  );

  // Apply all other filters to visibleTasks
  const filteredTasks = useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();
    const milestoneFilter = statusFilter ? statusToMilestone[statusFilter] : "";

    return visibleTasks.filter((t) => {
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
  }, [visibleTasks, searchTerm, statusFilter, priorityFilter, dueFilter]);

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

  // Counters based on what is currently displayed (post-filter/sort)
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

  // Total displayed count = sum of visible counters (fixes mismatch with DB total)
  const totalDisplayed =
    counters.todo + counters.on_going + counters.in_review + counters.done;

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
      time_spent: formatTime(t.timeSpent ?? 0),
      archived_at: t.archived_at || "",
    }));

    const header = Object.keys(
      rows[0] || {
        id: "", name: "", milestone: "", priority: "", assignee: "",
        client: "", project: "", start_date: "", due_date: "", completed: "", time_spent: "", archived_at: ""
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

  const exportCsvHandler = onExportCsv || exportCsv;

  const renderContent = () => {
    if (loading) return <p className={styles.loading}>Loading your tasks...</p>;

    return (
      <>
        <div className={styles.viewTabs}>
          <button
            className={`${styles.viewTabButton} ${viewMode === "kanban" ? styles.activeView : ""}`}
            onClick={() => applyAndSaveView("kanban")}
          >
            <KanbanIcon /> Kanban
          </button>
          <button
            className={`${styles.viewTabButton} ${viewMode === "list" ? styles.activeView : ""}`}
            onClick={() => applyAndSaveView("list")}
          >
            <AlignLeftIcon /> List
          </button>
        </div>

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
          // Pass archived toggle through
          showArchived={showArchived}
          onShowArchived={setShowArchived}
        />

        <div className={styles.hintRow}>
          {`Showing ${totalDisplayed} ${totalDisplayed === 1 ? "task" : "tasks"}`}
          <span className={styles.counters}>
            : To Do: {counters.todo} • On Going: {counters.on_going} • In Review: {counters.in_review} • Done: {counters.done}
          </span>
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
              setCopyFromTask(null);
            }}
            editingTask={editingTask}
            initialData={copyFromTask || initialTaskData}
            setTasks={setTasks}
            onTaskAdded={onTaskAdded}
          />
        )}

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
          <button className={styles.primaryBtn} onClick={exportCsvHandler} title="Export current view">
            Export CSV
          </button>
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
