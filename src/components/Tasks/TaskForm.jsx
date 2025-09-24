import React, { useState, useRef, useEffect } from 'react';
import { Building2, Briefcase, Paperclip, X, Save } from 'lucide-react';
import styles from '../../styles/Tasks.module.scss';
import { tasksService } from '../../lib/tasks';
import { adminService } from '../../lib/admin';

function TaskForm({ onClose, editingTask, setTasks, onTaskAdded, initialData, copyData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const fileInputRef = useRef(null);
  const [taskData, setTaskData] = useState({
    name: "",
    milestone: "To Do",
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

  useEffect(() => {
    // Load employees for assignee dropdown
    const loadEmployees = async () => {
      try {
        const employeesData = await adminService.getEmployees();
        setEmployees(employeesData);
      } catch (error) {
        console.error('Error loading employees:', error);
        setError('Failed to load employees list');
      }
    };
    loadEmployees();
  }, []);

  useEffect(() => {
    if (editingTask) {
      setTaskData(editingTask);
    } else if (initialData) {
      setTaskData({
        ...taskData,
        ...initialData,
        timeSpent: 0,
        timerEntries: [],
        isTimerRunning: false,
        attachments: [],
      });
    }
  }, [editingTask, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const fileDetails = files.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
    }));
    setTaskData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...fileDetails],
    }));
  };

  const removeAttachment = (index) => {
    setTaskData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingTask) {
        const taskToUpdate = { ...taskData };
        delete taskToUpdate.task_attachments;
        delete taskToUpdate.timer_entries;
        delete taskToUpdate.timeSpent;
        delete taskToUpdate.isTimerRunning;
        delete taskToUpdate.attachments;
        const updatedTask = await tasksService.updateTask(editingTask.id, taskToUpdate);
        setTasks((prev) =>
          prev.map((task) =>
            task.id === editingTask.id
              ? {
                  ...updatedTask,
                  timeSpent: task.timeSpent,
                  attachments: taskData.attachments,
                  timerEntries: task.timerEntries,
                  isTimerRunning: task.isTimerRunning,
                  completed: updatedTask.milestone === "Done" ? true : updatedTask.completed,
                }
              : task
          )
        );
      } else {
        const newTaskData = { ...taskData };
        if (newTaskData.milestone === "Done") newTaskData.completed = true;
        const task = await tasksService.createTask(newTaskData);
        const newTaskWithDefaults = {
          ...task,
          timeSpent: 0,
          timerEntries: [],
          isTimerRunning: false,
          attachments: taskData.attachments,
          completed: task.milestone === "Done" ? true : task.completed,
        };
        setTasks((prev) => [newTaskWithDefaults, ...prev]);
        if (onTaskAdded) onTaskAdded(newTaskWithDefaults);
      }
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      setError("Failed to save task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormTitle = () => {
    if (editingTask) return "Edit Task";
    if (copyData) return "Copy Task";
    return "Add Task";
  };

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <h2>{getFormTitle()}</h2>
        <button onClick={onClose} className={styles.closeButton}>
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
            value={taskData.name}
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
              value={taskData.client}
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
              value={taskData.project}
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
              value={taskData.milestone}
              onChange={handleInputChange}
            >
              <option value="To Do">To Do</option>
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
              value={taskData.priority}
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
              value={taskData.start_date}
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
              value={taskData.due_date}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="assignee">Assignee</label>
          <select
            id="assignee"
            name="assignee"
            value={taskData.assignee}
            onChange={handleInputChange}
            required
            className={styles.select}
          >
            <option value="">Select Assignee</option>
            {employees.map((employee) => (
              <option 
                key={employee.id} 
                value={`${employee.first_name} ${employee.last_name}`}
              >
                {employee.first_name} {employee.last_name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="description">Task Description</label>
          <textarea
            id="description"
            name="description"
            value={taskData.description}
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
          {taskData.attachments.length > 0 && (
            <div className={styles.attachmentList}>
              {taskData.attachments.map((file, index) => (
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
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.formButtons}>
          <button
            type="button"
            onClick={onClose}
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
  );
}

export default TaskForm;