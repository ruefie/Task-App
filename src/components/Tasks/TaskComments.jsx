import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import styles from '../../styles/TaskComments.module.scss';

function TaskComments({ taskId, comments, onAddComment }) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(taskId, newComment);
      setNewComment('');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuthorEmail = (comment) => {
    return comment.auth_user?.email || 'Unknown User';
  };

  return (
    <div className={styles.comments}>
      <h4>
        <MessageSquare size={16} />
        Comments
      </h4>
      <div className={styles.commentsList}>
        {comments.map((comment) => (
          <div key={comment.id} className={styles.comment}>
            <div className={styles.commentHeader}>
              <span className={styles.author}>{getAuthorEmail(comment)}</span>
              <span className={styles.date}>
                {formatDate(comment.created_at)}
              </span>
            </div>
            <p className={styles.commentText}>{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className={styles.noComments}>No comments yet</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className={styles.commentForm}>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className={styles.commentInput}
        />
        <button type="submit" className={styles.sendButton}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

export default TaskComments;