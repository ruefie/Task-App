import React from 'react';
import { Repeat, Clock } from 'lucide-react';
import styles from '../../styles/ReminderSettings.module.scss';

export default function ReminderSettings({ formData, onChange }) {
  return (
    <div className={styles.reminderSettings}>
      <div className={styles.repeatSection}>
        <label htmlFor="repeat_type">
          <Repeat size={16} /> Repeat
        </label>
        <select
          id="repeat_type"
          name="repeat_type"
          value={formData.repeat_type}
          onChange={onChange}
        >
          <option value="none">Don't repeat</option>
          <option value="minutely">Every Minute (test)</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        {formData.repeat_type !== 'none' && (
          <div className={styles.repeatInterval}>
            <label htmlFor="repeat_interval">Every</label>
            <input
              type="number"
              id="repeat_interval"
              name="repeat_interval"
              min="1"
              max="99"
              value={formData.repeat_interval}
              onChange={onChange}
            />
            <span>
              {
                formData.repeat_type === 'minutely' ? 'minute(s)' :
               formData.repeat_type === 'daily'   ? 'day(s)'   :
               formData.repeat_type === 'weekly'  ? 'week(s)'  :
               formData.repeat_type === 'monthly' ? 'month(s)' :
               'year(s)' }
              {/* // formData.repeat_type === 'daily'   ? 'day(s)'   :
              //  formData.repeat_type === 'weekly'  ? 'week(s)'  :
              //  formData.repeat_type === 'monthly' ? 'month(s)' :
              //                                     'year(s)'} */}
            </span>
          </div>
        )}
      </div>

      {/* <div className={styles.snoozeSection}>
        <label htmlFor="snooze_duration">
          <Clock size={16} /> Snooze
        </label>
        <select
          id="snooze_duration"
          name="snooze_duration"
          value={formData.snooze_duration}
          onChange={onChange}
        >
          {[5,10,15,30,60].map(m => (
            <option key={m} value={m}>
              {m === 60 ? '1 hour' : `${m} minutes`}
            </option>
          ))}
        </select>
      </div> */}
    </div>
);
}
