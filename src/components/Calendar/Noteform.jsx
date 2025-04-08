import React, { useState } from 'react';
import { X, Save, Bell, BellOff } from 'lucide-react';
import styles from '../../styles/NoteForm.module.scss';

function NoteForm({ note, onSave, onClose, initialData }) {
  const [formData, setFormData] = useState({
    title: note?.title || '',
    content: note?.content || '',
    date: initialData?.date || note?.date || '',
    reminder_date: initialData?.reminder_date || note?.reminder_date || '',
    reminder_time: initialData?.reminder_time || note?.reminder_time || '09:00'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleReminder = () => {
    setFormData(prev => ({
      ...prev,
      reminder_date: prev.reminder_date ? '' : prev.date,
      reminder_time: prev.reminder_date ? '' : '09:00'
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={styles.noteForm}>
      <div className={styles.noteFormHeader}>
        <h3>{note ? 'Edit Note' : 'Add Note'}</h3>
        <button type="button" onClick={onClose} className={styles.closeButton}>
          <X size={20} />
        </button>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Enter note title"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows="4"
          placeholder="Enter note content"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="date">Date</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <div className={styles.reminderToggle}>
          <button
            type="button"
            onClick={toggleReminder}
            className={`${styles.reminderButton} ${formData.reminder_date ? styles.active : ''}`}
          >
            {formData.reminder_date ? <Bell size={20} /> : <BellOff size={20} />}
            {formData.reminder_date ? 'Reminder On' : 'Add Reminder'}
          </button>
        </div>
        {formData.reminder_date && (
          <div className={styles.reminderInputs}>
            <div className={styles.reminderField}>
              <label htmlFor="reminder_date">Reminder Date</label>
              <input
                type="date"
                id="reminder_date"
                name="reminder_date"
                value={formData.reminder_date}
                onChange={handleChange}
                className={styles.reminderDateInput}
              />
            </div>
            <div className={styles.reminderField}>
              <label htmlFor="reminder_time">Reminder Time</label>
              <input
                type="time"
                id="reminder_time"
                name="reminder_time"
                value={formData.reminder_time}
                onChange={handleChange}
                className={styles.reminderTimeInput}
              />
            </div>
          </div>
        )}
      </div>

      <div className={styles.formButtons}>
        <button type="submit" className={styles.saveButton}>
          <Save size={20} />
          Save Note
        </button>
      </div>
    </form>
  );
}

export default NoteForm;