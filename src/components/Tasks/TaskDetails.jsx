import React, { useState, useEffect } from 'react';
import { X, Paperclip, Clock, Copy } from 'lucide-react';
import TaskComments from './TaskComments';
import { commentsService } from '../../lib/comments';
import styles from '../../styles/TaskDetails.module.scss';

function TaskDetails({ task, onClose, formatTime, onCopyTask }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadComments();
  }, [task.id]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const taskComments = await commentsService.getComments(task.id);
      setComments(taskComments);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (taskId, content) => {
    try {
      const newComment = await commentsService.addComment(taskId, content);
      setComments(prev => [...prev, newComment]);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentsService.deleteComment(commentId);
      loadComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  const handleUpdateComment = async (commentId, updatedContent) => {
    try {
      await commentsService.updateComment(commentId, updatedContent);
      loadComments();
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('Failed to update comment');
    }
  };

  if (!task) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <button className={styles.modalCloseButton} onClick={onClose}>
            <X size={20} />
          </button>
          <button 
            className={styles.copyButton}
            onClick={() => { onCopyTask(task); onClose(); }}
            title="Copy Task"
          >
            <Copy size={16} />
            <span>Copy Task</span>
          </button>
        </div>
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

          {error && <div className={styles.error}>{error}</div>}
          
          <TaskComments 
            taskId={task.id}
            comments={comments}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onUpdateComment={handleUpdateComment}
          />
        </div>
      </div>
    </div>
  );
}

export default TaskDetails;