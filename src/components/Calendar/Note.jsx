import React from 'react';
import { Bell, Edit2, Trash2, Calendar, Clock, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import styles from '../../styles/Note.module.scss';

function Note({ note, onEdit, onDelete, onSnooze }) {
  const formatReminderDateTime = (date, time) => {
    if (!date || !time) return null;
    return format(new Date(`${date}T${time}`), 'MMM d, yyyy h:mm a');
  };

  const getRepeatText = (type, interval) => {
    if (type === 'none') return '';
    const unit = type.slice(0); // Remove 'ly' from the end
    return `Repeats ${interval}x ${unit}${interval > 1 ? 's' : ''}`;
  };

  return (
    <div className={styles.noteItem}>
      <div className={styles.noteHeader}>
        <h4>{note.title}</h4>
        <div className={styles.noteActions}>
          {note.reminder_date && note.reminder_time && (
            <button onClick={() => onSnooze(note)} className={styles.snoozeButton} title="Snooze reminder">
              <Clock size={16} />
            </button>
          )}
          <button onClick={() => onEdit(note)} className={styles.editButton} title="Edit note">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(note.id)} className={styles.deleteButton} title="Delete note">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <p className={styles.noteContent}>{note.content}</p>
      <div className={styles.noteFooter}>
        <div className={styles.noteDate}>
          <Calendar size={14} />
          <span>{format(new Date(note.date), 'MMM d, yyyy')}</span>
        </div>
        {note.reminder_date && note.reminder_time && (
          <div className={styles.reminderInfo}>
            <Bell size={14} />
            <span>Reminder: {formatReminderDateTime(note.reminder_date, note.reminder_time)}</span>
          </div>
        )}
        {note.repeat_type !== 'none' && (
          <div className={styles.repeatInfo}>
            <Repeat size={14} />
            <span>{getRepeatText(note.repeat_type, note.repeat_interval)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Note;