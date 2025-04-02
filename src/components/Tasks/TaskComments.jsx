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

  return (
    <div className={styles.comments}>
      <h4>
        <MessageSquare size={16} />
        Comments
      </h4>
      <div className={styles.commentsList}>
        {comments.map((comment, index) => (
          <div key={index} className={styles.comment}>
            <div className={styles.commentHeader}>
              <span className={styles.author}>{comment.author}</span>
              <span className={styles.date}>
                {new Date(comment.timestamp).toLocaleString()}
              </span>
            </div>
            <p className={styles.commentText}>{comment.text}</p>
          </div>
        ))}
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