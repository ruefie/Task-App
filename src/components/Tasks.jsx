import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, Save, Check, Trash2, Paperclip, Play, Pause, Clock, StopCircle, Edit2, Building2, Briefcase } from 'lucide-react';
import { tasksService } from '../lib/tasks';
import { supabase } from '../lib/supabase';
import styles from '../styles/Tasks.module.scss';

function Tasks({ onTaskAdded, initialTaskData }) {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    name: '',
    milestone: 'Todo',
    priority: 'Normal',
    start_date: '',
    due_date: '',
    assignee: '',
    client: '',
    project: '',
    description: '',
    attachments: [],
    timeSpent: 0,
    timerEntries: [],
    isTimerRunning: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [taskToReset, setTaskToReset] = useState(null);

  const fileInputRef = useRef(null);
  const [timers, setTimers] = useState({});
  const [activeTimerEntry, setActiveTimerEntry] = useState(null);

  // Group tasks by milestone
  const groupedTasks = {
    'Todo': tasks.filter(task => task.milestone === 'Todo'),
    'On Going': tasks.filter(task => task.milestone === 'On Going'),
    'In Review': tasks.filter(task => task.milestone === 'In Review'),
    'Done': tasks.filter(task => task.milestone === 'Done')
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (initialTaskData) {
      setNewTask(prev => ({
        ...prev,
        ...initialTaskData
      }));
    }
  }, [initialTaskData]);

  const loadTasks = async () => {
    try {
      setError(null);
      const tasksData = await tasksService.getTasks();
      setTasks(tasksData.map(task => ({
        ...task,
        timeSpent: calculateTotalTimeSpent(task.timer_entries || []),
        isTimerRunning: hasActiveTimer(task.timer_entries || []),
        attachments: task.task_attachments || [],
        timerEntries: task.timer_entries || []
      })));
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks. Please try again.');
    }
  };

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

  const hasActiveTimer = (timerEntries) => {
    if (!timerEntries || timerEntries.length === 0) return false;
    return timerEntries.some(entry => !entry.end_time);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingTask) {
      setEditingTask(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const fileDetails = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file)
    }));

    if (editingTask) {
      setEditingTask(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...fileDetails]
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...fileDetails]
      }));
    }
  };

  const removeAttachment = (index) => {
    if (editingTask) {
      setEditingTask(prev => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index)
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index)
      }));
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!task.isTimerRunning) {
      try {
        const timerEntry = await tasksService.startTimer(taskId);
        setActiveTimerEntry(timerEntry);
        
        const timer = setInterval(() => {
          setTasks(prevTasks => 
            prevTasks.map(t => 
              t.id === taskId 
                ? { ...t, timeSpent: t.timeSpent + 1 }
                : t
            )
          );
        }, 1000);
        
        setTimers(prev => ({ ...prev, [taskId]: timer }));
        
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === taskId 
              ? {
                  ...t,
                  isTimerRunning: true,
                  timerEntries: [...t.timerEntries, timerEntry]
                }
              : t
          )
        );
      } catch (error) {
        console.error('Error starting timer:', error);
        setError('Failed to start timer. Please try again.');
      }
    } else {
      try {
        const activeEntry = task.timerEntries.find(entry => !entry.end_time);
        if (activeEntry) {
          const duration = Math.floor((new Date() - new Date(activeEntry.start_time)) / 1000);
          await tasksService.stopTimer(activeEntry.id, duration);
        }

        clearInterval(timers[taskId]);
        setTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[taskId];
          return newTimers;
        });

        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === taskId 
              ? { ...t, isTimerRunning: false }
              : t
          )
        );
      } catch (error) {
        console.error('Error stopping timer:', error);
        setError('Failed to stop timer. Please try again.');
      }
    }
  };

  const promptResetTimer = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setTaskToReset(task);
    setShowConfirmation(true);
  };

  const confirmResetTimer = async () => {
    if (!taskToReset) return;
    
    try {
      setError(null);
      const taskId = taskToReset.id;
      
      // Stop any running timer
      if (taskToReset.isTimerRunning) {
        const activeEntry = taskToReset.timerEntries.find(entry => !entry.end_time);
        if (activeEntry) {
          await tasksService.stopTimer(activeEntry.id, 0);
        }
      }
      
      // Clear interval if running
      if (timers[taskId]) {
        clearInterval(timers[taskId]);
        setTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[taskId];
          return newTimers;
        });
      }
      
      // Delete all timer entries from the database
      if (taskToReset.timerEntries && taskToReset.timerEntries.length > 0) {
        const { error } = await supabase
          .from('timer_entries')
          .delete()
          .eq('task_id', taskId);
          
        if (error) {
          console.error('Error deleting timer entries:', error);
          throw new Error('Failed to delete timer entries');
        }
      }
      
      // Update the task in the UI
      setTasks(tasks.map(task =>
        task.id === taskId
          ? { ...task, timeSpent: 0, timerEntries: [], isTimerRunning: false }
          : task
      ));
      
      setShowConfirmation(false);
      setTaskToReset(null);
    } catch (error) {
      console.error('Error resetting timer:', error);
      setError('Failed to reset timer. Please try again.');
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
      // Ensure dates are in the correct format for the date input
      start_date: task.start_date || '',
      due_date: task.due_date || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (editingTask) {
        // Create a clean copy of the task data for update
        const taskToUpdate = { ...editingTask };
        
        // Remove properties that shouldn't be sent to the API
        delete taskToUpdate.task_attachments;
        delete taskToUpdate.timer_entries;
        delete taskToUpdate.timeSpent;
        delete taskToUpdate.isTimerRunning;
        delete taskToUpdate.attachments;
        
        console.log('Submitting task update:', taskToUpdate);
        
        const updatedTask = await tasksService.updateTask(editingTask.id, taskToUpdate);
        
        setTasks(tasks.map(task =>
          task.id === editingTask.id ? { 
            ...updatedTask, 
            timeSpent: task.timeSpent,
            attachments: editingTask.attachments,
            timerEntries: task.timerEntries,
            isTimerRunning: task.isTimerRunning,
            completed: updatedTask.milestone === 'Done' ? true : updatedTask.completed
          } : task
        ));
        setEditingTask(null);
      } else {
        const taskData = { ...newTask };
        // Set completed to true if milestone is Done
        if (taskData.milestone === 'Done') {
          taskData.completed = true;
        }
        
        const task = await tasksService.createTask(taskData);
        const newTaskWithDefaults = {
          ...task,
          timeSpent: 0,
          timerEntries: [],
          isTimerRunning: false,
          attachments: newTask.attachments,
          completed: task.milestone === 'Done' ? true : task.completed
        };
        setTasks([newTaskWithDefaults, ...tasks]);
        if (onTaskAdded) {
          onTaskAdded(newTaskWithDefaults);
        }
        setNewTask({
          name: '',
          milestone: 'Todo',
          priority: 'Normal',
          start_date: '',
          due_date: '',
          assignee: '',
          client: '',
          project: '',
          description: '',
          attachments: [],
          timeSpent: 0,
          timerEntries: [],
          isTimerRunning: false
        });
      }
      setShowForm(false);
    } catch (error) {
      console.error('Error saving task:', error);
      setError('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      setError(null);
      const updatedTask = await tasksService.updateTask(id, {
        completed: !task.completed
      });
      setTasks(tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task status. Please try again.');
    }
  };

  const deleteTask = async (id) => {
    try {
      setError(null);
      await tasksService.deleteTask(id);
      if (timers[id]) {
        clearInterval(timers[id]);
        setTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[id];
          return newTimers;
        });
      }
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    }
  };

  const calculateTaskTimeEntries = (timerEntries) => {
    return timerEntries.map(entry => {
      const start = new Date(entry.start_time);
      const end = entry.end_time ? new Date(entry.end_time) : new Date();
      const duration = Math.floor((end - start) / 1000);
      return {
        ...entry,
        duration,
        formattedDuration: formatTime(duration)
      };
    });
  };

  // Calculate total time spent across all tasks
  const totalTimeSpent = tasks.reduce((total, task) => total + task.timeSpent, 0);

  // Handle drag end event
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped back to its original position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Find the task that was dragged
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Create a new array of tasks
    const newTasks = [...tasks];
    
    // Remove the task from its source
    const [movedTask] = newTasks.splice(
      newTasks.findIndex(t => t.id === draggableId),
      1
    );

    // Update the milestone based on the destination droppableId
    const newMilestone = destination.droppableId;
    movedTask.milestone = newMilestone;
    
    // If moved to Done, mark as completed
    if (newMilestone === 'Done') {
      movedTask.completed = true;
    } else if (movedTask.completed && newMilestone !== 'Done') {
      // If moved from Done to another column, mark as not completed
      movedTask.completed = false;
    }

    // Add the task to its new position
    newTasks.splice(
      newTasks.findIndex(t => t.milestone === newMilestone) + destination.index,
      0,
      movedTask
    );

    // Update the state
    setTasks(newTasks);

    // Update the task in the database
    try {
      await tasksService.updateTask(draggableId, {
        milestone: newMilestone,
        completed: movedTask.completed
      });
    } catch (error) {
      console.error('Error updating task after drag:', error);
      setError('Failed to update task. Please try again.');
      // Revert to the original state if the update fails
      loadTasks();
    }
  };

  return (
    <div className={styles.container}>
      <h1>Tasks</h1>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.summary}>
        <div className={styles.totalTime}>
          <Clock size={20} />
          <span>Total Time: {formatTime(totalTimeSpent)}</span>
        </div>
      </div>

      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)} 
          className={styles.addButton}
        >
          <Plus size={20} />
          Add Task
        </button>
      ) : (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>{editingTask ? 'Edit Task' : 'Add Task'}</h2>
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
              <button 
                type="submit" 
                className={styles.saveButton}
                disabled={isSubmitting}
              >
                <Save size={20} />
                {isSubmitting ? 'Saving...' : (editingTask ? 'Update' : 'Save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className={styles.confirmationOverlay}>
          <div className={styles.confirmationDialog}>
            <h3>Reset Timer</h3>
            <p>Are you sure you want to reset the timer for this task? This will permanently delete all timer entries and cannot be undone.</p>
            <div className={styles.confirmationButtons}>
              <button 
                onClick={cancelResetTimer}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={confirmResetTimer}
                className={styles.confirmButton}
              >
                Reset Timer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
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
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${styles.task} ${task.completed ? styles.completed : ''} ${styles[task.priority.toLowerCase()]} ${snapshot.isDragging ? styles.dragging : ''}`}
                            >
                              <button
                                onClick={() => toggleTask(task.id)}
                                className={styles.checkButton}
                              >
                                <Check size={20} />
                              </button>
                              <div className={styles.taskContent}>
                                <div className={styles.taskHeader}>
                                  <div className={styles.titleSection}>
                                    <span className={styles.title}>{task.name}</span>
                                    <button
                                      onClick={() => startEditing(task)}
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

                                <div className={styles.taskSummary}>
                                  <div className={styles.timeInfo}>
                                    <Clock size={16} />
                                    <span>Total Time: {formatTime(task.timeSpent)}</span>
                                  </div>
                                  <div className={styles.sessionInfo}>
                                    <span>{task.timerEntries.length} sessions</span>
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

                                <p className={styles.description}>{task.description}</p>
                                
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
                                    <span className={styles.assignee}>Assignee: {task.assignee}</span>
                                    <span className={styles.dates}>
                                      {task.start_date} - {task.due_date}
                                    </span>
                                  </div>
                                  <div className={styles.timerSection}>
                                    <div className={styles.timer}>
                                      <Clock size={16} />
                                      <span className={styles.time}>{formatTime(task.timeSpent)}</span>
                                      <button
                                        onClick={() => toggleTimer(task.id)}
                                        className={`${styles.timerButton} ${task.isTimerRunning ? styles.running : ''}`}
                                      >
                                        {task.isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                                      </button>
                                      <button
                                        onClick={() => promptResetTimer(task.id)}
                                        className={styles.resetButton}
                                        title="Reset Timer"
                                      >
                                        <StopCircle size={16} />
                                      </button>
                                    </div>
                                    {task.timerEntries.length > 0 && (
                                      <div className={styles.timerEntries}>
                                        <h5>Timer Entries:</h5>
                                        <div className={styles.entriesList}>
                                          {calculateTaskTimeEntries(task.timerEntries).map((entry, index) => (
                                            <div key={index} className={styles.timerEntry}>
                                              <span>{new Date(entry.start_time).toLocaleTimeString()}</span>
                                              <span>→</span>
                                              <span>{entry.end_time ? new Date(entry.end_time).toLocaleTimeString() : 'Running'}</span>
                                              <span className={styles.duration}>{entry.formattedDuration}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className={styles.deleteButton}
                              >
                                <Trash2 size={20} />
                              </button>
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
    </div>
  );
}

export default Tasks;