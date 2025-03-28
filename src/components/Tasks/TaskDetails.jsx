import React from 'react';
import { X, Paperclip, Clock } from 'lucide-react';
import styles from '../../styles/Tasks.module.scss';

function TaskDetails({ task, onClose, formatTime }) {
  if (!task) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalCloseButton} onClick={onClose}>
          <X size={20} />
        </button>
        <div className={styles.taskDetails}>
          <h2>{task.name}</h2>
          <p><strong>Client/Customer:</strong> {task.client}</p>
          <p><strong>Project:</strong> {task.project}</p>
          <p><strong>Milestone:</strong> {task.milestone}</p>
          <p><strong>Priority:</strong> {task.priority}</p>
          <p>
            <strong>Start Date:</strong>{" "}
            {new Date(task.start_date).toLocaleDateString("de-DE")}
          </p>
          <p>
            <strong>Due Date:</strong>{" "}
            {new Date(task.due_date).toLocaleDateString("de-DE")}
          </p>
          <p><strong>Assignee:</strong> {task.assignee}</p>
          <p><strong>Description:</strong> {task.description}</p>
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
            <div className={styles.timerSection}>
              <div className={styles.timer}>
                <Clock size={16} />
                <span className={styles.time}>{formatTime(task.timeSpent)}</span>
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
  );
}

export default TaskDetails;