// src/components/Tasks.jsx
import React, { useState, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus,
  X,
  Save,
  Check,
  Trash2,
  Paperclip,
  Play,
  Pause,
  Clock,
  StopCircle,
  Edit2,
  Building2,
  Briefcase,
  KanbanIcon,
  AlignLeftIcon,
  RefreshCw
} from "lucide-react";
import { tasksService } from "../lib/tasks";
import { supabase } from "../lib/supabase";
import styles from "../styles/Tasks.module.scss";
import { useAuth } from "../contexts/AuthContext";

function Tasks({ onTaskAdded, initialTaskData }) {
  // Local state definitions
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    name: "",
    milestone: "Todo",
    priority: "Normal",
    start_date: "",
    due_date: "",
    assignee: "",
    client: "",
    project: "",
    description: "",
    attachments: [],
    timeSpent: 0,
    timerEntries: [],
    isTimerRunning: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [taskToReset, setTaskToReset] = useState(null);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" or "list"
  const [selectedTask, setSelectedTask] = useState(null);

  const fileInputRef = useRef(null);
  const [timers, setTimers] = useState({});
  const [activeTimerEntry, setActiveTimerEntry] = useState(null);

  // Get user and admin flag from auth context
  const { user, isAdmin } = useAuth();

  // Helper to compute total time from timer entries
  const calculateTotalTimeSpent = (timerEntries) => {
    if (!timerEntries || timerEntries.length === 0) return 0;
    return timerEntries.reduce((total, entry) => {
      if (entry.duration) return total + entry.duration;
      if (entry.end_time)
        return total + Math.floor((new Date(entry.end_time) - new Date(entry.start_time)) / 1000);
      if (!entry.end_time)
        return total + Math.floor((new Date() - new Date(entry.start_time)) / 1000);
      return total;
    }, 0);
  };

  // Single loadTasks function (called on mount and by refresh button)
  // const loadTasks = async () => {
  //   try {
  //     setError(null);
  //     // Pass isAdmin flag via an options object so that if admin, all tasks are returned.
  //     const tasksData = await tasksService.getTasks({ admin: isAdmin });
  //     setTasks(
  //       tasksData.map((task) => ({
  //         ...task,
  //         timeSpent: calculateTotalTimeSpent(task.timer_entries || []),
  //         isTimerRunning: (task.timer_entries || []).some((entry) => !entry.end_time),
  //         attachments: task.task_attachments || [],
  //         timerEntries: task.timer_entries || [],
  //         // Save previous milestone for later use
  //         _prevMilestone: task.milestone !== "Done" ? task.milestone : null,
  //       }))
  //     );
  //   } catch (error) {
  //     console.error("Error loading tasks:", error);
  //     setError("Failed to load tasks. Please try again.");
  //   }
  // };

  // Load tasks on mount and when isAdmin changes
  useEffect(() => {
    loadTasks();
  }, [isAdmin]);

  // If initialTaskData is provided (e.g. from Calendar), update newTask
  useEffect(() => {
    if (initialTaskData) {
      setNewTask((prev) => ({
        ...prev,
        ...initialTaskData,
      }));
    }
  }, [initialTaskData]);

  // Group tasks by milestone (for Kanban view)
  const groupedTasks = {
    Todo: tasks.filter((task) => task.milestone === "Todo"),
    "On Going": tasks.filter((task) => task.milestone === "On Going"),
    "In Review": tasks.filter((task) => task.milestone === "In Review"),
    Done: tasks.filter((task) => task.milestone === "Done"),
  };

  // Input and file change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingTask) {
      setEditingTask((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewTask((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const fileDetails = files.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
    }));
    if (editingTask) {
      setEditingTask((prev) => ({ ...prev, attachments: [...prev.attachments, ...fileDetails] }));
    } else {
      setNewTask((prev) => ({ ...prev, attachments: [...prev.attachments, ...fileDetails] }));
    }
  };

  const removeAttachment = (index) => {
    if (editingTask) {
      setEditingTask((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index),
      }));
    } else {
      setNewTask((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index),
      }));
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle clicking a task (to show details)
  const handleTaskClick = (task, e) => {
    if (e.target.closest("button")) return;
    setSelectedTask(task);
  };

  // Drag-and-drop handler
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
      setError("Failed to update task. Please try again.");
      loadTasks();
    }
  };

  // Toggle task completion: When marking complete, save the previous milestone; when un-checking, revert.
  const toggleTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      setError(null);
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
      setError("Failed to update task status. Please try again.");
    }
  };

  const deleteTask = async (id) => {
    try {
      setError(null);
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
      setError("Failed to delete task. Please try again.");
    }
  };

  const toggleTimer = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!task.isTimerRunning) {
      try {
        const timerEntry = await tasksService.startTimer(taskId);
        setActiveTimerEntry(timerEntry);
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
        setError("Failed to start timer. Please try again.");
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
        setError("Failed to stop timer. Please try again.");
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
      setError(null);
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
        const { error } = await supabase.from("timer_entries").delete().eq("task_id", taskId);
        if (error) {
          console.error("Error deleting timer entries:", error);
          throw new Error("Failed to delete timer entries");
        }
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
      setError("Failed to reset timer. Please try again.");
      setShowConfirmation(false);
      setTaskToReset(null);
    }
  };

  const cancelResetTimer = () => {
    setShowConfirmation(false);
    setTaskToReset(null);
  };

  const startEditing = (task) => {
    setEditingTask({
      ...task,
      start_date: task.start_date || "",
      due_date: task.due_date || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingTask) {
        const taskToUpdate = { ...editingTask };
        delete taskToUpdate.task_attachments;
        delete taskToUpdate.timer_entries;
        delete taskToUpdate.timeSpent;
        delete taskToUpdate.isTimerRunning;
        delete taskToUpdate.attachments;
        console.log("Submitting task update:", taskToUpdate);
        const updatedTask = await tasksService.updateTask(editingTask.id, taskToUpdate);
        setTasks((prev) =>
          prev.map((task) =>
            task.id === editingTask.id
              ? {
                  ...updatedTask,
                  timeSpent: task.timeSpent,
                  attachments: editingTask.attachments,
                  timerEntries: task.timerEntries,
                  isTimerRunning: task.isTimerRunning,
                  completed: updatedTask.milestone === "Done" ? true : updatedTask.completed,
                }
              : task
          )
        );
        setEditingTask(null);
      } else {
        const taskData = { ...newTask };
        if (taskData.milestone === "Done") taskData.completed = true;
        const task = await tasksService.createTask(taskData);
        const newTaskWithDefaults = {
          ...task,
          timeSpent: 0,
          timerEntries: [],
          isTimerRunning: false,
          attachments: newTask.attachments,
          completed: task.milestone === "Done" ? true : task.completed,
        };
        setTasks((prev) => [newTaskWithDefaults, ...prev]);
        if (onTaskAdded) onTaskAdded(newTaskWithDefaults);
        setNewTask({
          name: "",
          milestone: "Todo",
          priority: "Normal",
          start_date: "",
          due_date: "",
          assignee: "",
          client: "",
          project: "",
          description: "",
          attachments: [],
          timeSpent: 0,
          timerEntries: [],
          isTimerRunning: false,
        });
      }
      setShowForm(false);
    } catch (error) {
      console.error("Error saving task:", error);
      setError("Failed to save task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Kanban view
  const renderKanbanView = () => (
    <div className={styles.kanbanBoard}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={styles.kanbanColumns}>
          {Object.entries(groupedTasks).map(([milestone, milestoneTasks]) => (
            <div key={milestone} className={styles.kanbanColumn}>
              <h3 className={styles.columnTitle}>{milestone}</h3>
              <Droppable droppableId={milestone}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={styles.columnContent}
                  >
                    {milestoneTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${styles.task} ${task.completed ? styles.completed : ""} ${styles[task.priority.toLowerCase()]} ${snapshot.isDragging ? styles.dragging : ""}`}
                            onClick={(e) => handleTaskClick(task, e)}
                          >
                            <div className={styles.taskTop}>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                className={styles.checkButton}
                              >
                                <Check size={20} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                className={styles.deleteButton}
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                            <div className={styles.taskClickable}>
                              <div className={styles.taskContent}>
                                <div className={styles.taskHeader}>
                                  <div className={styles.titleSection}>
                                    <span className={styles.title}>{task.name}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); startEditing(task); }}
                                      className={styles.editButton}
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                  </div>
                                  <div className={styles.tags}>
                                    <span className={`${styles.tag} ${styles[task.priority.toLowerCase()]}`}>
                                      {task.priority}
                                    </span>
                                  </div>
                                </div>
                                <div className={styles.projectInfo}>
                                  <div className={styles.infoItem}>
                                    <Building2 size={16} />
                                    <span>{task.client}</span>
                                  </div>
                                  <div className={styles.infoItem}>
                                    <Briefcase size={16} />
                                    <span>{task.project}</span>
                                  </div>
                                </div>
                                <div className={styles.taskFooter}>
                                  <div className={styles.taskDates}>
                                    <span className={styles.dates}>
                                      Timeline: {new Date(task.start_date).toLocaleDateString("de-DE")} - {new Date(task.due_date).toLocaleDateString("de-DE")}
                                    </span>
                                  </div>
                                  <div className={styles.timerSection}>
                                    <div className={styles.timer}>
                                      <Clock size={16} />
                                      <span className={styles.time}>{formatTime(task.timeSpent)}</span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); toggleTimer(task.id); }}
                                        className={`${styles.timerButton} ${task.isTimerRunning ? styles.running : ""}`}
                                      >
                                        {task.isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); promptResetTimer(task.id); }}
                                        className={styles.resetButton}
                                        title="Reset Timer"
                                      >
                                        <StopCircle size={16} />
                                      </button>
                                    </div>
                                    <div className={styles.sessionInfo}>
                                      <span>{task.timerEntries.length} sessions</span>
                                    </div>
                                    {(task.timerEntries || []).length > 0 && (
                                      <div className={styles.timerEntries}>
                                        <h5>Timer Entries:</h5>
                                        <div className={styles.entriesList}>
                                          {(task.timerEntries || []).map((entry, index) => {
                                            const start = new Date(entry.start_time).toLocaleTimeString();
                                            const end = entry.end_time ? new Date(entry.end_time).toLocaleTimeString() : "Running";
                                            const duration = formatTime(
                                              entry.duration ||
                                              Math.floor((new Date() - new Date(entry.start_time)) / 1000)
                                            );
                                            return (
                                              <div key={index} className={styles.timerEntry}>
                                                <span>{start}</span>
                                                <span>→</span>
                                                <span>{end}</span>
                                                <span className={styles.duration}>{duration}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {milestoneTasks.length === 0 && (
                      <div className={styles.emptyColumn}>
                        <p>No tasks in {milestone}</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );

  // Render List view
  const renderListView = () => (
    <div className={styles.listView}>
      {tasks.length === 0 ? (
        <p className={styles.noTasks}>No tasks yet. Add some tasks to get started!</p>
      ) : (
        <div className={styles.list}>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`${styles.listItem} ${task.completed ? styles.completed : ""} ${styles[task.priority.toLowerCase()]}`}
              onClick={(e) => handleTaskClick(task, e)}
            >
              <div className={styles.listItemTop}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                  className={styles.checkButton}
                >
                  <Check size={20} />
                </button>
                <span className={styles.milestone}>{task.milestone}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className={styles.deleteButton}
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className={styles.listItemContent}>
                <div className={styles.taskHeader}>
                  <div className={styles.titleSection}>
                    <span className={styles.title}>{task.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditing(task); }}
                      className={styles.editButton}
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                  <div className={styles.tags}>
                    <span className={`${styles.tag} ${styles[task.priority.toLowerCase()]}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <div className={styles.projectInfo}>
                  <div className={styles.infoItem}>
                    <Building2 size={16} />
                    <span>{task.client}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <Briefcase size={16} />
                    <span>{task.project}</span>
                  </div>
                </div>
                {task.attachments.length > 0 && (
                  <div className={styles.taskAttachments}>
                    <h4>Attachments:</h4>
                    <div className={styles.attachmentGrid}>
                      {task.attachments.map((file, index) => (
                        <a
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.attachmentLink}
                        >
                          <Paperclip size={16} />
                          {file.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className={styles.taskFooter}>
                  <div className={styles.taskInfo}>
                    <span className={styles.dates}>
                      Timeline: {new Date(task.start_date).toLocaleDateString("de-DE")} - {new Date(task.due_date).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  <div className={styles.timerSection}>
                    <div className={styles.timer}>
                      <Clock size={16} />
                      <span className={styles.time}>{formatTime(task.timeSpent)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleTimer(task.id); }}
                        className={`${styles.timerButton} ${task.isTimerRunning ? styles.running : ""}`}
                      >
                        {task.isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); promptResetTimer(task.id); }}
                        className={styles.resetButton}
                        title="Reset Timer"
                      >
                        <StopCircle size={16} />
                      </button>
                    </div>
                    <div className={styles.sessionInfo}>
                      <span>{task.timerEntries.length} sessions</span>
                    </div>
                    {(task.timerEntries || []).length > 0 && (
                      <div className={styles.timerEntries}>
                        <h5>Timer Entries:</h5>
                        <div className={styles.entriesList}>
                          {(task.timerEntries || []).map((entry, index) => {
                            const start = new Date(entry.start_time).toLocaleTimeString();
                            const end = entry.end_time ? new Date(entry.end_time).toLocaleTimeString() : "Running";
                            const duration = formatTime(
                              entry.duration ||
                              Math.floor((new Date() - new Date(entry.start_time)) / 1000)
                            );
                            return (
                              <div key={index} className={styles.timerEntry}>
                                <span>{start}</span>
                                <span>→</span>
                                <span>{end}</span>
                                <span className={styles.duration}>{duration}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Modal for task details
  const renderTaskDetailsModal = () => (
    <div className={styles.modalOverlay} onClick={() => setSelectedTask(null)}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalCloseButton} onClick={() => setSelectedTask(null)}>
          <X size={20} />
        </button>
        {selectedTask && (
          <div className={styles.taskDetails}>
            <h2>{selectedTask.name}</h2>
            <p><strong>Client/Customer:</strong> {selectedTask.client}</p>
            <p><strong>Project:</strong> {selectedTask.project}</p>
            <p><strong>Milestone:</strong> {selectedTask.milestone}</p>
            <p><strong>Priority:</strong> {selectedTask.priority}</p>
            <p>
              <strong>Start Date:</strong>{" "}
              {new Date(selectedTask.start_date).toLocaleDateString("de-DE")}
            </p>
            <p>
              <strong>Due Date:</strong>{" "}
              {new Date(selectedTask.due_date).toLocaleDateString("de-DE")}
            </p>
            <p><strong>Assignee:</strong> {selectedTask.assignee}</p>
            <p><strong>Description:</strong> {selectedTask.description}</p>
            {selectedTask.attachments.length > 0 && (
              <div className={styles.taskAttachments}>
                <h4>Attachments:</h4>
                <div className={styles.attachmentGrid}>
                  {selectedTask.attachments.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.attachmentLink}
                    >
                      <Paperclip size={16} />
                      {file.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.taskFooter}>
              <div className={styles.timerSection}>
                <div className={styles.timer}>
                  <Clock size={16} />
                  <span className={styles.time}>{formatTime(selectedTask.timeSpent)}</span>
                </div>
                {(selectedTask.timerEntries || []).length > 0 && (
                  <div className={styles.timerEntries}>
                    <h5>Timer Entries:</h5>
                    <div className={styles.entriesList}>
                      {(selectedTask.timerEntries || []).map((entry, index) => {
                        const start = new Date(entry.start_time).toLocaleTimeString();
                        const end = entry.end_time ? new Date(entry.end_time).toLocaleTimeString() : "Running";
                        const duration = formatTime(
                          entry.duration ||
                          Math.floor((new Date() - new Date(entry.start_time)) / 1000)
                        );
                        return (
                          <div key={index} className={styles.timerEntry}>
                            <span>{start}</span>
                            <span>→</span>
                            <span>{end}</span>
                            <span className={styles.duration}>{duration}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <h1>Tasks</h1>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.summary}>
  <div className={styles.totalTime}>
    <Clock size={20} />
    <span>Total Time: {formatTime(tasks.reduce((total, task) => total + task.timeSpent, 0))}</span>
  </div>
  <button onClick={loadTasks} className={styles.refreshButton}>
    <RefreshCw size={16} />
    Refresh
  </button>
</div>

      {/* View Mode Tabs */}
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

      {/* Add Task Button */}
      {!showForm && (
        <button onClick={() => setShowForm(true)} className={styles.addButton}>
          <Plus size={20} />
          Add Task
        </button>
      )}

      {/* Render Task Form */}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>{editingTask ? "Edit Task" : "Add Task"}</h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingTask(null);
                setError(null);
              }}
              className={styles.closeButton}
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Form fields remain unchanged */}
            <div className={styles.formGroup}>
              <label htmlFor="name">Task Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editingTask ? editingTask.name : newTask.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="client">
                  <Building2 size={16} className={styles.inputIcon} />
                  Client/Customer
                </label>
                <input
                  type="text"
                  id="client"
                  name="client"
                  value={editingTask ? editingTask.client : newTask.client}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="project">
                  <Briefcase size={16} className={styles.inputIcon} />
                  Project Name
                </label>
                <input
                  type="text"
                  id="project"
                  name="project"
                  value={editingTask ? editingTask.project : newTask.project}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="milestone">Milestone</label>
                <select
                  id="milestone"
                  name="milestone"
                  value={editingTask ? editingTask.milestone : newTask.milestone}
                  onChange={handleInputChange}
                >
                  <option value="Todo">Todo</option>
                  <option value="On Going">On Going</option>
                  <option value="In Review">In Review</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={editingTask ? editingTask.priority : newTask.priority}
                  onChange={handleInputChange}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="start_date">Start Date</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={editingTask ? editingTask.start_date : newTask.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="due_date">Due Date</label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={editingTask ? editingTask.due_date : newTask.due_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="assignee">Assignee</label>
              <input
                type="text"
                id="assignee"
                name="assignee"
                value={editingTask ? editingTask.assignee : newTask.assignee}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="description">Task Description</label>
              <textarea
                id="description"
                name="description"
                value={editingTask ? editingTask.description : newTask.description}
                onChange={handleInputChange}
                rows="4"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.attachmentLabel}>
                <div className={styles.attachmentButton}>
                  <Paperclip size={20} />
                  <span>Add Attachments</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.mp4,.xlsx,.xls,.doc,.docx,.pdf"
                  className={styles.fileInput}
                />
              </label>
              {(editingTask ? editingTask.attachments : newTask.attachments).length > 0 && (
                <div className={styles.attachmentList}>
                  {(editingTask ? editingTask.attachments : newTask.attachments).map((file, index) => (
                    <div key={index} className={styles.attachmentItem}>
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className={styles.removeAttachment}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.formButtons}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                  setError(null);
                }}
                className={styles.closeButton}
                disabled={isSubmitting}
              >
                Close
              </button>
              <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
                <Save size={20} />
                {isSubmitting ? "Saving..." : editingTask ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showConfirmation && (
        <div className={styles.confirmationOverlay} onClick={cancelResetTimer}>
          <div className={styles.confirmationDialog} onClick={(e) => e.stopPropagation()}>
            <h3>Reset Timer</h3>
            <p>
              Are you sure you want to reset the timer for this task? This will permanently delete all timer entries and cannot be undone.
            </p>
            <div className={styles.confirmationButtons}>
              <button onClick={cancelResetTimer} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={confirmResetTimer} className={styles.confirmButton}>
                Reset Timer
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMode === "kanban" ? renderKanbanView() : renderListView()}

      {selectedTask && renderTaskDetailsModal()}
    </div>
  );
}

export default Tasks;
