import React from 'react';
import { Check, Trash2, Edit2, Building2, Briefcase, Clock, Play, Pause, StopCircle, Paperclip, Copy } from 'lucide-react';
import styles from '../../styles/Tasks.module.scss';

function TaskList({ 
  tasks, 
  onTaskClick, 
  onToggleTask, 
  onDeleteTask, 
  onStartEditing, 
  onToggleTimer, 
  onPromptResetTimer,
  onCopyTask,
  formatTime 
}) {
  return (
    <div className={styles.listView}>
      {tasks.length === 0 ? (
        <p className={styles.noTasks}>No tasks yet. Add some tasks to get started!</p>
      ) : (
        <div className={styles.list}>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`${styles.listItem} ${task.completed ? styles.completed : ""} ${styles[task.priority.toLowerCase()]}`}
              onClick={(e) => onTaskClick(task, e)}
            >
              <div className={styles.listItemTop}>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                  className={styles.checkButton}
                >
                  <Check size={20} />
                </button>
                <span className={styles.milestone}>{task.milestone}</span>
                <div className={styles.taskActions}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopyTask(task); }}
                    className={styles.copyButton}
                    title="Copy Task"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                    className={styles.deleteButton}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className={styles.listItemContent}>
                <div className={styles.taskHeader}>
                  <div className={styles.titleSection}>
                    <span className={styles.title}>{task.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onStartEditing(task); }}
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
                        onClick={(e) => { e.stopPropagation(); onToggleTimer(task.id); }}
                        className={`${styles.timerButton} ${task.isTimerRunning ? styles.running : ""}`}
                      >
                        {task.isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onPromptResetTimer(task.id); }}
                        className={styles.resetButton}
                        title="Reset Timer"
                      >
                        <StopCircle size={16} />
                      </button>
                    </div>
                    <div className={styles.sessionInfo}>
                      <span>{task.timerEntries.length} sessions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskList;