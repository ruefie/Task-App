// src/components/Tasks/TaskComments.jsx
import React, { useState } from 'react';
import { Send, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/TaskComments.module.scss';

function TaskComments({ taskId, comments, onAddComment, onDeleteComment, onUpdateComment }) {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const { user } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(taskId, newComment);
      setNewComment('');
    }
  };

  const handleEditClick = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (e, commentId) => {
    e.preventDefault();
    if (editingContent.trim()) {
      await onUpdateComment(commentId, editingContent);
      setEditingCommentId(null);
      setEditingContent('');
    }
  };

  const handleDeleteClick = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await onDeleteComment(commentId);
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

  const getAuthorName = (comment) => {
    const profile = comment.profiles;
    if (profile) {
      const firstName = profile.first_name || '';
      const lastName = profile.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
    }
    return 'Unknown User';
  };

  const canEditComment = (comment) => {
    return user && comment.user_id === user.id;
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
              <span className={styles.author}>{getAuthorName(comment)}</span>
              
              {canEditComment(comment) && (
                <div className={styles.commentActions}>
                  {editingCommentId !== comment.id && (
                    <>
                      <button 
                        onClick={() => handleEditClick(comment)}
                        className={styles.editButton}
                        title="Edit Comment"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(comment.id)}
                        className={styles.deleteButton}
                        title="Delete Comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              )}
              <span className={styles.date}>{formatDate(comment.created_at)}</span>
            </div>
            {editingCommentId === comment.id ? (
              <form onSubmit={(e) => handleSaveEdit(e, comment.id)} className={styles.editForm}>
                <input 
                  type="text" 
                  value={editingContent} 
                  onChange={(e) => setEditingContent(e.target.value)}
                  className={styles.editInput}
                />
                <div className={styles.editButtons}>
                  <button type="submit" className={styles.saveButton}>Save</button>
                  <button type="button" onClick={handleCancelEdit} className={styles.cancelButton}>Cancel</button>
                </div>
              </form>
            ) : (
              <p className={styles.commentText}>{comment.content}</p>
            )}
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
