import React, { useState } from "react";
import { X, Save, Bell, BellOff, Repeat, Clock } from "lucide-react";
import styles from "../../styles/NoteForm.module.scss";
import ReminderSettings from "./ReminderSettings.jsx";
import { scheduleNotification } from "../../lib/notifications";

function NoteForm({ note, onSave, onClose, initialData }) {
  const [formData, setFormData] = useState({
    title: note?.title || "",
    content: note?.content || "",
    date: initialData?.date || note?.date || "",
    reminder_date: initialData?.reminder_date || note?.reminder_date || "",
    reminder_time: initialData?.reminder_time || note?.reminder_time || "09:00",
    repeat_type: note?.repeat_type || "none",
    repeat_interval: note?.repeat_interval || 1,
    snooze_duration: note?.snooze_duration || 5,
  });

  const handleToggleReminder = () => {
    // Ask permission in a click
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    setFormData((prev) => ({
      ...prev,
      reminder_date: prev.reminder_date ? "" : prev.date,
      reminder_time: prev.reminder_date ? "" : "09:00",
    }));
  };
  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   onSave(formData);
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
    // then schedule a native reminder
    if (formData.reminder_date && formData.reminder_time) {
      const dt = new Date(
        `${formData.reminder_date}T${formData.reminder_time}`
      );
      if (dt.getTime() > Date.now()) {
        scheduleNotification(
          `⏰ Reminder: ${formData.title}`,
          formData.content,
          dt.getTime(),
           `note-${note?.id || 'new'}-${dt.getTime()}`
        );
      }
    }

    // showNotification(
    //   note ? 'Note updated' : 'Note added',
    //   note ? 'Your changes were saved.' : 'Your note was created.'
    // );
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleReminder = () => {
    setFormData((prev) => ({
      ...prev,
      reminder_date: prev.reminder_date ? "" : prev.date,
      reminder_time: prev.reminder_date ? "" : "09:00",
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={styles.noteForm}>
      <div className={styles.noteFormHeader}>
        <h3>{note ? "Edit Note" : "Add Note"}</h3>
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
            onClick={handleToggleReminder}
            className={`${styles.reminderButton} ${formData.reminder_date ? styles.active : ""}`}
          >
            {formData.reminder_date ? (
              <Bell size={20} />
            ) : (
              <BellOff size={20} />
            )}
            {formData.reminder_date ? "Reminder On" : "Add Reminder"}
          </button>
        </div>

        {formData.reminder_date && (
          // <div className={styles.reminderContainer}>
          //   <div className={styles.reminderInputs}>
          //     <div className={styles.reminderField}>
          //       <label htmlFor="reminder_date">Reminder Date</label>
          //       <input
          //         type="date"
          //         id="reminder_date"
          //         name="reminder_date"
          //         value={formData.reminder_date}
          //         onChange={handleChange}
          //       />
          //     </div>
          //     <div className={styles.reminderField}>
          //       <label htmlFor="reminder_time">Reminder Time</label>
          //       <input
          //         type="time"
          //         id="reminder_time"
          //         name="reminder_time"
          //         value={formData.reminder_time}
          //         onChange={handleChange}
          //       />
          //     </div>
          //   </div>

          //   <div className={styles.reminderSettings}>
          //     <div className={styles.repeatSection}>
          //       <label htmlFor="repeat_type">
          //         <Repeat size={16} />
          //         Repeat
          //       </label>
          //       <select
          //         id="repeat_type"
          //         name="repeat_type"
          //         value={formData.repeat_type}
          //         onChange={handleChange}
          //       >
          //         <option value="none">Don't repeat</option>
          //         <option value="daily">Daily</option>
          //         <option value="weekly">Weekly</option>
          //         <option value="monthly">Monthly</option>
          //         <option value="yearly">Yearly</option>
          //       </select>

          //       {formData.repeat_type !== 'none' && (
          //         <div className={styles.repeatInterval}>
          //           <label htmlFor="repeat_interval">Repeat every</label>
          //           <input
          //             type="number"
          //             id="repeat_interval"
          //             name="repeat_interval"
          //             value={formData.repeat_interval}
          //             onChange={handleChange}
          //             min="1"
          //             max="99"
          //           />
          //           <span>
          //             {formData.repeat_type === 'daily' ? 'days' :
          //              formData.repeat_type === 'weekly' ? 'weeks' :
          //              formData.repeat_type === 'monthly' ? 'months' : 'years'}
          //           </span>
          //         </div>
          //       )}
          //     </div>

          //     <div className={styles.snoozeSection}>
          //       <label htmlFor="snooze_duration">
          //         <Clock size={16} />
          //         Snooze duration
          //       </label>
          //       <select
          //         id="snooze_duration"
          //         name="snooze_duration"
          //         value={formData.snooze_duration}
          //         onChange={handleChange}
          //       >
          //         <option value="5">5 minutes</option>
          //         <option value="10">10 minutes</option>
          //         <option value="15">15 minutes</option>
          //         <option value="30">30 minutes</option>
          //         <option value="60">1 hour</option>
          //       </select>
          //     </div>
          //   </div>
          // </div>
          <div className={styles.reminderContainer}>
            <div className={styles.reminderInputs}>
              {/* date + time inputs */}
              <div className={styles.reminderField}>
                <label htmlFor="reminder_date">Reminder Date</label>
                <input
                  type="date"
                  id="reminder_date"
                  name="reminder_date"
                  value={formData.reminder_date}
                  onChange={handleChange}
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
                />
              </div>
            </div>

            {/* NEW: pull in our extracted component */}
            <ReminderSettings formData={formData} onChange={handleChange} />
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
